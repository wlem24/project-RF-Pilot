from fastapi import APIRouter, Form, HTTPException
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional
import os
import re

from openai import (
    RateLimitError,
    BadRequestError,
    AuthenticationError,
    APIConnectionError,
    APIStatusError,
    OpenAIError,
)

from store_rfp import get_rfp_by_id, get_all_rfps

load_dotenv()

router = APIRouter()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)


@router.post("/chat")
async def chat_with_bot(prompt: str = Form(...), rfp_id: Optional[int] = Form(None)):
    print(f"--- [CHAT LOG] Received Prompt: '{prompt}' | rfp_id: {rfp_id} ---")

    # Priority 1: explicit ID mentioned in the prompt
    match = re.search(r"\d+", prompt)
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

    # Priority 2: use active tab rfp_id if no explicit ID in prompt
    elif rfp_id is not None:
        rfp = get_rfp_by_id(rfp_id)
        if rfp is None:
            raise HTTPException(status_code=404, detail="RFP not found.")

        context = f"Context from RFP #{rfp_id} (Filename: {rfp['filename']}):\n{rfp['extracted_text']}\n\n"
        system_instruction = "You are an RFP AI assistant and ur name is Michael Scott. Answer only from the provided RFP context."
        user_message = f"{context}Please answer the user question using the RFP text above.\nQuestion: {prompt}"

    # Priority 3: no explicit ID and no active rfp_id -> search/browse archive
    else:
        try:
            all_rfps = get_all_rfps()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        rfps_list_context = "Available archived RFPs in the database:\n"
        for r in all_rfps:
            rfps_list_context += f"- ID: {r['id']}, Filename: {r['filename']}, Summary: {r['summary'][:200]}...\n"

        system_instruction = (
            #اعطيه امثله تفصيليه وقواعد وقوانين لتحسين الرد 
            "You are an RFP Finder assistant and ur name is Michael Scott. Scan the provided list of archived RFPs. "
            "If the user asks for a file, show its ID, full Filename, and Summary."
        )
        user_message = f"{rfps_list_context}\nUser Query: {prompt}"

    # Send request to OpenAI
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_message},
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