
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional
import fitz  # PyMuPDF library
import os
import re  # إضافة مكتبة الـ Regex للتعرف الذكي على الأرقام داخل الرسائل

from openai import (
    RateLimitError, 
    BadRequestError, 
    AuthenticationError, 
    APIConnectionError, 
    APIStatusError, 
    OpenAIError
)

from store_rfp import create_rfp, get_rfp_by_id, get_all_rfps

load_dotenv()

router = APIRouter()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join([page.get_text() for page in doc])


@router.post("/upload")
async def upload_rfp(file: UploadFile = File(...)):
    try:
        file_content = await file.read()
        extracted_text = extract_text_from_pdf(file_content)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="The uploaded PDF seems to be empty or unreadable.")

        summary_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert RFP analyzer. Provide a brief, professional summary of the attached text."},
                {"role": "user", "content": f"Summarize this RFP text:\n\n{extracted_text[:4000]}"}
            ],
            max_tokens=250
        )
        summary = summary_response.choices[0].message.content.strip()

        rfp_id = create_rfp(
            filename=file.filename,
            notes="Uploaded via Web Interface",
            summary=summary,
            extracted_text=extracted_text
        )

        return {
            "rfp_id": rfp_id,
            "title": file.filename,
            "summary": summary
        }

    except Exception as e:
        print(f"Error during upload processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process and save PDF: {str(e)}")


@router.get("/")
def list_all_rfps():
    try:
        return get_all_rfps()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch RFPs: {str(e)}")


@router.get("/{rfp_id}")
def get_rfp_details(rfp_id: int):
    rfp = get_rfp_by_id(rfp_id)
    if rfp is None:
        raise HTTPException(status_code=404, detail="RFP not found.")
    return {
        "id": rfp["id"],
        "title": rfp["filename"],
        "filename": rfp["filename"],
        "summary": rfp["summary"],
        "notes": rfp["notes"],
        "created_at": rfp["created_at"]
    }


# مسار المحادثة المطور: يدعم الملف الحالي، أو البحث في الأرشيف، أو جلب ملف قديم بالكامل عبر الـ ID
@router.post("/chat")
async def chat_with_bot(prompt: str = Form(...), rfp_id: Optional[int] = Form(None)):
    
    print(f"--- [CHAT LOG] Received Prompt: '{prompt}' | rfp_id: {rfp_id} ---")

    # 1. الأولوية الأولى: فحص ذكي وخارق (سواء كنت في شات عام أو خاص)
    # إذا كتب المستخدم أي رقم في الرسالة، نخرج فوراً لجلب هذا الملف المحدد من قاعدة البيانات
    match = re.search(r'\d+', prompt)
    
    if match:
        requested_id = int(match.group(0))
        print(f"--- [CHAT LOG] Detected ID request in text for ID: {requested_id} ---")
        rfp = get_rfp_by_id(requested_id)
        
        if rfp:
            print(f"--- [CHAT LOG] Found RFP in DB! Loading full text for filename: {rfp['filename']} ---")
            context = f"Context from Requested RFP #{requested_id} (Filename: {rfp['filename']}):\n{rfp['extracted_text']}\n\n"
            system_instruction = (
                "You are an RFP AI assistant and ur name is Michael Scott. The user explicitly requested "
                "this archived file. Answer their question or summarize the file using this full RFP text."
            )
            user_message = f"{context}The user wants to know about this specific file or says: {prompt}"
        else:
            print(f"--- [CHAT LOG] RFP with ID {requested_id} NOT FOUND in DB. ---")
            system_instruction = "You are Michael Scott. Inform the user politely that this specific ID does not exist in the database archives."
            user_message = prompt

    # 2. الأولوية الثانية: إذا لم يكتب المستخدم أي رقم، نعتمد على الحقول المرسلة من الواجهة
    elif rfp_id is not None:
        # المستخدم داخل صفحة ملف معينة ويسأل سؤالاً عادياً (مثل: ما هي الشروط؟)
        rfp = get_rfp_by_id(rfp_id)
        if rfp is None:
            raise HTTPException(status_code=404, detail="RFP not found.")

        context = f"Context from RFP #{rfp_id} (Filename: {rfp['filename']}):\n{rfp['extracted_text']}\n\n"
        system_instruction = "You are an RFP AI assistant and ur name is Michael Scott. Answer only from the provided RFP context."
        user_message = f"{context}Please answer the user question using the RFP text above.\nQuestion: {prompt}"

    else:
        # شات عام تماماً وبدون أي أرقام (عرض قائمة الأرشيف)
        try:
            all_rfps = get_all_rfps()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
        rfps_list_context = "Available archived RFPs in the database:\n"
        for r in all_rfps:
            rfps_list_context += f"- ID: {r['id']}, Filename: {r['filename']}, Summary: {r['summary'][:200]}...\n"
        
        system_instruction = (
            "You are an RFP Finder assistant and ur name is Michael Scott. Scan the provided list of archived RFPs. "
            "If the user asks for a file, show its ID, full Filename, and Summary."
        )
        user_message = f"{rfps_list_context}\nUser Query: {prompt}"

    # إرسال الطلب النهائي إلى OpenAI
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_message}
            ],
            max_tokens=400,
        )
        return {"reply": response.choices[0].message.content.strip()}

    except RateLimitError as e:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail="Invalid request parameters.")
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail="Authentication failed.")
    except APIConnectionError as e:
        raise HTTPException(status_code=502, detail="Failed to connect to OpenAI servers.")
    except APIStatusError as e:
        raise HTTPException(status_code=e.status_code, detail="OpenAI error status.")
    except OpenAIError as e:
        raise HTTPException(status_code=500, detail="Unexpected OpenAI error.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
