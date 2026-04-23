from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import audit, mitigation

# Initialize firebase admin
import backend.config.firebase_admin

from backend.middleware.auth_middleware import FirebaseAuthMiddleware

app = FastAPI(title="FairLens API", version="1.0.0")

app.add_middleware(FirebaseAuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router, prefix="/audit", tags=["Audit"])
app.include_router(mitigation.router, prefix="/audit", tags=["Mitigation"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
