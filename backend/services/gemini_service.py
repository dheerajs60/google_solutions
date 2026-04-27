import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part, FinishReason
import vertexai.preview.generative_models as generative_models
from dotenv import load_dotenv

# Load .env from root or current dir
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "solutions-89747")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-south2")

vertexai.init(project=PROJECT_ID, location=LOCATION)

model = GenerativeModel("gemini-1.5-pro-002")

def generate_bias_explanation_stream(metrics: dict, sensitive_attrs: list[str]):
    """
    Generates a professional bias audit explanation using Vertex AI Gemini 1.5 Pro (Streaming).
    """
    prompt = f"""
    You are the Lead Forensic Pathologist at 'FairLens Auditor'. 
    Conduct a high-fidelity 'Lead Auditor's Report' on the statistical drivers of bias.
    
    AUDIT TRACE DATA:
    - Demographic Parity: {metrics.get('demographic_parity', {}).get('value', 'N/A')}
    - Equal Opportunity: {metrics.get('equal_opportunity', {}).get('value', 'N/A')}
    - Disparate Impact: {metrics.get('disparate_impact', {}).get('value', 'N/A')}
    - Audited Attributes: {', '.join(sensitive_attrs)}
    
    SECTIONS:
    1. **Statistical Driver Analysis**: Directly reference the exact numeric metrics above. Why do these disparities exist? Use terms like 'covariance' and 'sampling bias'.
    2. **Proxy Variable Forensics**: Which other columns might be leaking info based on typical schemas?
    3. **Actionable Remediation**: Provide ONE precise, implementation-ready recommendation (e.g., 'Targeted Reweighing' or 'Equalized Odds Post-Processing').
    
    CONSTRAINTS:
    - Highly professional, clinical, and authoritative tone.
    - NO markdown headers (e.g., #). Use bolding (**) for sections.
    - Max 200 words of dense, metric-grounded analysis.
    
    AUDITOR'S REPORT:
    """
    
    try:
        responses = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 1024, "temperature": 0.2},
            stream=True
        )
        for response in responses:
            if response.text:
                yield response.text
    except Exception as e:
        print(f"Vertex AI (Gemini) Error: {e}")
        yield f"Error generating auditor report: {str(e)}"

def generate_bias_explanation(metrics: dict, sensitive_attrs: list[str]) -> str:
    """
    Non-streaming version for backward compatibility.
    """
    try:
        response = model.generate_content(
            f"Summarize bias in 100 words: {str(metrics)} for {sensitive_attrs}",
            generation_config={"max_output_tokens": 512, "temperature": 0.2}
        )
        return response.text.strip()
    except Exception as e:
        print(f"Vertex AI Error: {e}")
        return "Analysis unavailable."
