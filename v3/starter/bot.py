from fastapi import APIRouter, UploadFile, File, Form
from dotenv import load_dotenv
from openai import OpenAI
import fitz  # PyMuPDF library
import os

#ضيفها
load_dotenv()


router = APIRouter()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join([page.get_text() for page in doc])

@router.post("/chat")
async def chat_with_bot(prompt: str = Form(...), file: UploadFile = File(None)):
    # If a file is uploaded, extract its text content first
    context = ""
    if file:
        file_content = await file.read()
        context = f"Context from PDF:\n{extract_text_from_pdf(file_content)}\n\n"

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful and intelligent assistant."},
            {"role": "user", "content": f"{context}User question: {prompt}"}
        ]
    )
    
    return {"reply": response.choices[0].message.content}