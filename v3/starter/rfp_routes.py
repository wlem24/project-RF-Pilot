import os
import re
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from openai import (
    OpenAI,
    RateLimitError,
    BadRequestError,
    AuthenticationError,
    APIConnectionError,
    APIStatusError,
    OpenAIError,
)

from database import get_db
from auth_utils import get_current_user
import models
import schemas
import rag_engine

router = APIRouter(prefix="/rfps", tags=["RFPs"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Structured fields extracted from the RFP text, in addition to the plain
# summary. 
OVERVIEW_FIELDS = [
    "title", "organization", "projectOverview", "scopeOfWork",
    "submissionDeadline", "importantDates", "requirementsSummary",
    "evaluationCriteria", "keyDeliverables", "risks",
]


# ─────────────────────────────────────────────
#  Upload — extract PDF text, store RFP + doc record, run RAG ingestion,
#           then extract structured overview via a single OpenAI call
# ─────────────────────────────────────────────

@router.post("/upload", status_code=201)
def upload_rfp(
    title: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    import fitz  # PyMuPDF

    # Create the RFP row so we have an ID for the document + chunks
    rfp = models.RFP(uploaded_by=current_user.id, title=title, status="draft")
    db.add(rfp)
    db.commit()

    # Extract text from the uploaded PDF
    contents = file.file.read()
    doc      = fitz.open(stream=contents, filetype="pdf")
    raw_text = "".join(page.get_text() for page in doc)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded PDF seems to be empty or unreadable.")

    # Store document metadata
    rfp_doc = models.RFPDocument(
        rfp_id      =rfp.id,
        uploaded_by =current_user.id,
        file_name   =file.filename,
        file_type   ="pdf",
        file_size   =len(contents),
    )
    db.add(rfp_doc)
    db.commit()

    # Chunk → embed → store in document_chunks (the RAG ingestion pipeline)
    chunks = rag_engine.ingest_document(db, rfp.id, rfp_doc.id, raw_text)

    # Single OpenAI call: extract both a plain summary AND the structured overview
    try:
        extraction_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": (
                    "You are an expert RFP analyzer. Analyze the attached RFP text and respond with a single JSON "
                    "object with exactly these keys: "
                    "\"summary\" (a brief professional summary string), and \"overview\" (an object with these "
                    "fields, using null for anything not found in the text: "
                    "title, organization, projectOverview, scopeOfWork, submissionDeadline, importantDates, "
                    "requirementsSummary, evaluationCriteria, keyDeliverables, risks). "
                    "Every value in \"overview\" MUST be a plain string or null — never a nested object. "
                    "If a field has multiple parts (e.g. several dates or criteria), combine them into one "
                    "comma-separated string instead of an object or array. "
                    "Do not invent information that isn't present in the text."
                )},
                {"role": "user", "content": f"Analyze this RFP text and respond with the JSON object:\n\n{raw_text[:4000]}"}
            ],
            max_tokens=700,
        )
        raw_content = extraction_response.choices[0].message.content.strip()

        try:
            parsed  = json.loads(raw_content)
            summary = (parsed.get("summary") or "").strip() or raw_content
            overview = parsed.get("overview") if isinstance(parsed.get("overview"), dict) else None
            if overview is not None:
                overview = {k: overview.get(k) for k in OVERVIEW_FIELDS}
        except (json.JSONDecodeError, AttributeError):
            # Model didn't return valid JSON — fall back to plain summary text,
            # overview stays empty rather than failing the whole upload.
            summary  = raw_content
            overview = None

    except Exception:
        summary  = ""
        overview = None

    # Save AI summary + structured overview in ai_summaries table
    ai_summary = models.AISummary(
        rfp_id       =rfp.id,
        summary      =summary,
        objectives   =overview,
        scope        =(overview or {}).get("scopeOfWork"),
        model_version="gpt-3.5-turbo",
    )
    db.add(ai_summary)
    db.commit()

    return {
        "rfp_id"         : str(rfp.id),
        "rfp_document_id": str(rfp_doc.id),
        "chunks_created" : len(chunks),
        "summary"        : summary,
    }




@router.get("/")
def list_rfps(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfps = db.query(models.RFP).all()
    return [
        {
            "id"        : str(r.id),
            "title"     : r.title,
            "status"    : r.status,
            "notes"     : r.notes,
            "created_at": str(r.created_at),
        }
        for r in rfps
    ]



@router.get("/{rfp_id}")
def get_rfp(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfp = db.get(models.RFP, rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    ai_summary  = db.query(models.AISummary).filter_by(rfp_id=rfp_id).first()
    information = ai_summary.objectives if ai_summary else None

    return {
        "id"         : str(rfp.id),
        "title"      : rfp.title,
        "status"     : rfp.status,
        "notes"      : rfp.notes,
        "created_at" : str(rfp.created_at),
        "information": information,
    }



# adapted SQLite → PostgreSQL
# source text now comes from document_chunks


@router.post("/{rfp_id}/generate-draft")
async def generate_draft(
    rfp_id: uuid.UUID,
    payload: schemas.GenerateDraftRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rfp = db.get(models.RFP, rfp_id)
    if rfp is None:
        raise HTTPException(status_code=404, detail="RFP not found.")

    # Reconstruct source text from stored chunks (replaces old SQLite extracted_text)
    chunks = (
        db.query(models.DocumentChunk)
        .filter_by(rfp_id=rfp_id)
        .order_by(models.DocumentChunk.chunk_index)
        .all()
    )
    source_text = " ".join(c.content for c in chunks).strip()

    if not source_text:
        raise HTTPException(status_code=400, detail="This RFP has no extracted content to draft from.")

    custom_instructions = (payload.prompt or "").strip()
    system_instruction  = (
        f"You are an expert proposal writer. Draft a '{payload.draftType}' section for a "
        "response to the following RFP. Base it only on the RFP content provided; do not "
        "invent facts that aren't supported by the text."
    )
    user_message = (
        f"RFP Filename: {rfp.title}\n\nRFP Content:\n{source_text[:6000]}\n\n"
        + (f"Additional instructions from the user: {custom_instructions}\n\n" if custom_instructions else "")
        + f"Write the {payload.draftType} now."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=900,
        )
        return {"content": response.choices[0].message.content.strip(), "draftType": payload.draftType}

    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    except BadRequestError:
        raise HTTPException(status_code=400, detail="Invalid request parameters.")
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="AI service authentication failed.")
    except APIConnectionError:
        raise HTTPException(status_code=502, detail="Failed to connect to AI service.")
    except APIStatusError as e:
        raise HTTPException(status_code=e.status_code, detail="AI service error.")
    except OpenAIError:
        raise HTTPException(status_code=500, detail="Unexpected AI service error.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ─────────────────────────────────────────────
#  RAG Chat — Phase 4
#    1. UUID found in question text → fetch that specific RFP
#    2. rfp_id provided             → RAG search (best accuracy)
#    3. no rfp_id                   → list all available RFPs
# ─────────────────────────────────────────────

@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_rfp(
    body: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    print(f"--- [CHAT LOG] Question: '{body.question}' | rfp_id: {body.rfp_id} ---")

    # Priority 1: UUID mentioned in the question → fetch that specific RFP
    uuid_match = re.search(
        r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        body.question, re.IGNORECASE,
    )
    if uuid_match:
        requested_id = uuid_match.group(0)
        print(f"--- [CHAT LOG] Detected UUID in text: {requested_id} ---")
        try:
            target_rfp = db.get(models.RFP, uuid.UUID(requested_id))
        except ValueError:
            target_rfp = None

        if target_rfp:
            chunks = (
                db.query(models.DocumentChunk)
                .filter_by(rfp_id=target_rfp.id)
                .order_by(models.DocumentChunk.chunk_index)
                .all()
            )
            context = " ".join(c.content for c in chunks)[:6000]
            system_instruction = (
                "You are an RFP AI assistant. The user requested this specific RFP. "
                "Answer their question using the RFP text provided."
            )
            user_message = f"RFP: {target_rfp.title}\n\n{context}\n\nQuestion: {body.question}"
        else:
            system_instruction = "You are an RFP AI assistant. Inform the user politely that this RFP ID does not exist."
            user_message = body.question

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=400,
        )
        return schemas.ChatResponse(
            session_id=body.session_id,
            answer    =response.choices[0].message.content.strip(),
        )

    # Priority 2: rfp_id provided → RAG search (most accurate)
    elif body.rfp_id:
        row = rag_engine.ask_rfp(
            db        =db,
            session_id=body.session_id,
            user_id   =current_user.id,
            rfp_id    =body.rfp_id,
            question  =body.question,
            top_k     =body.top_k,
        )
        return schemas.ChatResponse(
            session_id   =row.session_id,
            answer       =row.ai_response,
            context_used =row.context_used,
            prompt_tokens=row.prompt_tokens,
        )

    # Priority 3: no rfp_id → show list of all available RFPs
    else:
        print("--- [CHAT LOG] No rfp_id — returning RFP list ---")
        all_rfps = db.query(models.RFP).all()
        rfps_list = "Available RFPs in the system:\n"
        for r in all_rfps:
            rfps_list += f"- ID: {r.id}, Title: {r.title}\n"

        system_instruction = (
            "You are an RFP AI assistant. Show the user the list of available RFPs "
            "and help them find what they are looking for."
        )
        user_message = f"{rfps_list}\nUser Query: {body.question}"

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=400,
        )
        return schemas.ChatResponse(
            session_id=body.session_id,
            answer    =response.choices[0].message.content.strip(),
        )
