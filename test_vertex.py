import os
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel

load_dotenv("backend/.env")

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "solutions-89747")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

print(f"Initializing Vertex AI with PROJECT_ID={PROJECT_ID}, LOCATION={LOCATION}")
try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = GenerativeModel("gemini-1.5-flash")
    print("Testing gemini generation...")
    response = model.generate_content("Hello")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Vertex AI API Failure: {e}")
