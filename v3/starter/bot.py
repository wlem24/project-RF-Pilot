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

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful and intelligent assistant."},
                {"role": "user", "content": f"{context}User question: {prompt}"}
            ]
        )
    except client.RateLimitError as e:
        # Trigger exponential backoff or wait here
        print(f"Rate limit hit: {e.status_code} - {e.message}")

    except client.BadRequestError as e:
        # Handle bad parameters, invalid tokens, or context length issues
        print(f"Invalid request parameters: {e.status_code} - {e.message}")

    except client.AuthenticationError as e:
        # Handle missing, incorrect, or expired API keys
        print(f"Authentication failed: {e.status_code} - {e.message}")

    except client.APIConnectionError as e:
        # Handle network drops, timeouts, or proxy issues
        print(f"Failed to connect to OpenAI API: {e.__cause__}")

    except client.APIStatusError as e:
        # Handle non-200 HTTP server errors (e.g. 500 Server Error, 503 Service Unavailable)
        print(f"OpenAI returned a status error: {e.status_code} - {e.message}")

    except client.OpenAIError as e:
        # Catch-all for any other OpenAI-specific exceptions
        print(f"An OpenAI exception occurred: {e}")

    except Exception as e:
        # Generic python safety net for unrelated code errors
        print(f"A non-OpenAI error occurred: {e}")
    
    return {"reply": response.choices[0].message.content}