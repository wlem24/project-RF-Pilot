from fastapi import APIRouter, Depends

# TODO: import what you need from auth_utils and schemas

router = APIRouter()


# TODO Day 5: implement the evaluate endpoint
# POST / — protected with Depends(get_current_user)
# Accepts EvaluateRequest
# Returns EvaluateResponse with a placeholder message
