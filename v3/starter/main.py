from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# استيراد الـ Routers الخاصة بك
from register import router as register_router
from login import router as login_router
from bot import router as bot_router 
from rfp_routes import router as rfp_router

app = FastAPI(title="RFP AI Assistant API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تضمين الـ Routers بشكل نظيف وبدون أي تكرار
app.include_router(register_router)
app.include_router(login_router)
app.include_router(bot_router)

# نضمن مسارات الملفات مرة واحدة فقط وبـ الـ prefix الصحيح والمطلوب
app.include_router(rfp_router, prefix="/rfps", tags=["RFP Management"])


@app.get("/")
def root():
    return {"message": "RFP AI Assistant API is running"}