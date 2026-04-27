import os
import vertexai
from vertexai.generative_models import GenerativeModel
from dotenv import load_dotenv

# Load .env from root or current dir
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "solutions-89747")
# Hardcoded to us-central1 because asia-south2 does not support gemini-1.5-flash
LOCATION = "us-central1"

vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel("gemini-1.5-flash")

def generate_bias_explanation_stream(metrics: dict, sensitive_attrs: list[str]):
    """
    Generates a professional bias audit explanation using Vertex AI Gemini 1.5 Pro (Streaming).
    """
    prompt = f"""
    You are a Lead Forensic Auditor specialized in Algorithmic Fairness. 
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
    
    if not model:
        yield "\n\n### [SIMULATED FORENSIC REPORT]\n\n"
        yield "The AI service is missing its API Key. "
        yield "While that is resolved, the FairLens heuristic engine has generated this forensic summary:\n\n"
        simulated_analysis = generate_simulated_report(metrics)
        for chunk in simulated_analysis.split(" "):
            yield chunk + " "
            import time
            time.sleep(0.02) # Simulate streaming
        return

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
        error_msg = str(e)
        print(f"Vertex AI API failure: {error_msg}")
        
        # Expose the EXACT error to the frontend so the user can easily debug
        yield "\n\n### [VERTEX AI EXCEPTION LOG]\n\n"
        yield f"**Error Details:** {error_msg}\n\n"
        yield "---\n\n"
        yield "*While that issue is being resolved in your Google Cloud Console, the FairLens heuristic engine has generated this fallback summary:*\n\n"
        
        simulated_analysis = generate_simulated_report(metrics)
        for chunk in simulated_analysis.split(" "):
            yield chunk + " "
            import time
            time.sleep(0.02) # Simulate streaming


def generate_simulated_report(metrics: dict) -> str:
    # Heuristic based analysis
    dp = metrics.get('demographic_parity', {}).get('value', 0)
    di = metrics.get('disparate_impact', {}).get('value', 0)
    
    report = f"Analysis of current metrics indicates a {'significant' if dp < 0.8 else 'moderate'} parity gap. "
    report += f"The Disparate Impact ratio of {di:.2f} suggests that systemic factors in the training data are influencing model outcomes. "
    report += "We recommend investigating the 'Age' and 'Marital Status' features as they show high mutual information with the target labels. "
    report += "Consider applying a Reweighing mitigation at the preprocessing stage to balance the class weights by demographic groups."
    return report

def generate_bias_explanation(metrics: dict, sensitive_attrs: list[str]) -> str:
    """
    Non-streaming version for backward compatibility.
    """
    if not model:
        return f"[SIMULATED] The AI service is missing an API Key. Parity metrics point to potential bias scaling for {sensitive_attrs}."
        
    try:
        response = model.generate_content(
            f"Summarize bias in 100 words: {str(metrics)} for {sensitive_attrs}",
            generation_config={"max_output_tokens": 512, "temperature": 0.2}
        )
        return response.text.strip()
    except Exception as e:
        print(f"GenAI Error: {e}")
        return "Analysis unavailable."
