import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env from root or current dir
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('models/gemini-2.0-flash')

def generate_bias_explanation(metrics: dict, sensitive_attrs: list[str]) -> str:
    """
    Generates a professional bias audit explanation using Gemini 1.5 Pro.
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
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return None  # Let the frontend handle the retry
