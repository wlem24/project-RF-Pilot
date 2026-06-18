from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str | None = Field(None, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    username: str
    email: EmailStr
    role: str | None = None


class RegisterResponse(UserResponse):
    message: str = "User registered successfully"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GenerateDraftRequest(BaseModel):
    draftType: str = Field(..., min_length=1, max_length=100)
    prompt: str | None = Field(None, max_length=4000)
