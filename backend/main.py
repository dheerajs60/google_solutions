from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Minimal app for diagnostic recovery
app = FastAPI(title="FairLens API Recovery", version="2.2.4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.2.4", "mode": "recovery"}

@app.get("/")
def home():
    return {"message": "FairLens API Recovery Mode Active"}

try:
    # Try importing routers lazily
    from backend.routers import audit, mitigation
    app.include_router(audit.router, prefix="/audit", tags=["Audit"])
    app.include_router(mitigation.router, prefix="/audit", tags=["Mitigation"])
    print("Routers loaded in safe mode.")
except Exception as e:
    print(f"Safe Mode Warning: Could not load routers: {e}")

try:
    import backend.config.firebase_admin
    print("Firebase loaded in safe mode.")
except Exception as e:
    print(f"Safe Mode Warning: Could not load Firebase: {e}")
