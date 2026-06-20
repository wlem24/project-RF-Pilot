from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # registers all 18 models with Base

from register import router as register_router
from login import router as login_router
from rfp_routes import router as rfp_router

app = FastAPI(title="RFP AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register_router)
app.include_router(login_router)
app.include_router(rfp_router)


@app.get("/")
def root():
    return {"message": "RFP AI Assistant API is running"}
