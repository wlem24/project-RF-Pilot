from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from register import router as register_router
from login import router as login_router


app = FastAPI(title="Auth API")

# Allow local React dev server to talk to this API
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CORS explanation:
# We add CORS so the browser-based React dev server (port 3000) is allowed
# to send requests to this API (port 8000). In production, configure allowed
# origins carefully to avoid exposing the API to unwanted clients.


# Include authentication routers for clean route organization
app.include_router(register_router)
app.include_router(login_router)


@app.get("/")
def root():
    return {"message": "Auth API is running"}






