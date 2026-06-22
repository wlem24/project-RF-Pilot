import re
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from openai import AuthenticationError, RateLimitError, APIConnectionError, OpenAIError

from database import get_db
from auth_utils import get_current_user
import models
import schemas
import rag_engine

router = APIRouter(prefix="/rfps", tags=["Chat"])


@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_bot(
    body: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        context_rfp_id: uuid.UUID | None = None

        if body.rfp_id:
            context_rfp_id = body.rfp_id if db.get(models.RFP, body.rfp_id) else None
        else:
            match = re.search(
                r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
                body.question, re.IGNORECASE,
            )
            if match:
                try:
                    candidate = uuid.UUID(match.group(0))
                    if db.get(models.RFP, candidate):
                        context_rfp_id = candidate
                except ValueError:
                    pass

        row = rag_engine.chat(
            db             =db,
            session_id     =body.session_id,
            user_id        =current_user.id,
            question       =body.question,
            context_rfp_id =context_rfp_id,
            top_k          =body.top_k,
        )
        return schemas.ChatResponse(
            session_id   =row.session_id,
            answer       =row.ai_response,
            context_used =row.context_used,
            prompt_tokens=row.prompt_tokens,
        )

    except AuthenticationError:
        raise HTTPException(status_code=502, detail="OpenAI API key is invalid or missing.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI rate limit reached.")
    except APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not reach OpenAI.")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="A database error occurred. Please try again.")
