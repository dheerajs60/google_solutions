from typing import Dict, Any, List
import json
import datetime
from google.cloud import bigquery
from firebase_admin import firestore

from backend.config.firebase_admin import db
from backend.config.bigquery_client import bq_client, project_id

# Global in-memory dictionary to store audit states.
ACTIVE_AUDITS: Dict[str, Dict[str, Any]] = {}

def store_audit(audit_id: str, data: Dict[str, Any], results: Dict[str, Any] = None):
    ACTIVE_AUDITS[audit_id] = {**data, "results": results}
    
    overall_score = results.get("overall_score", 0.0) if results else 0.0
    status = "PASS" if overall_score > 0.9 else "WARNING" if overall_score > 0.8 else "FAIL"
    
    timestamp = data.get("date", datetime.datetime.now().strftime("%Y-%m-%d"))
    dataset_name = data.get("dataset", "Uploaded_Dataset.csv")
    model_type = data.get("model_type", "Classification")

    # Store lightweight metadata in Firestore
    if db:
        try:
            doc_ref = db.collection("audit_history").document(audit_id)
            doc_ref.set({
                "id": audit_id,
                "dataset": dataset_name,
                "date": timestamp,
                "model_type": model_type,
                "overall_score": overall_score,
                "status": status
            })
        except Exception as e:
            print(f"Firestore save error: {e}")
    else:
        print("Warning: Firestore client not configured, skipping metadata save.")

    # Store full details in BigQuery
    if bq_client:
        try:
            full_details = {**data, "results": results}
            table_ref = f"{project_id}.fair_audit.audits"
            
            # Convert nested dict into json string
            rows_to_insert = [
                {"audit_id": audit_id, "full_details": json.dumps(full_details)}
            ]
            
            errors = bq_client.insert_rows_json(table_ref, rows_to_insert)
            if errors:
                print(f"BigQuery insertion errors: {errors}")
        except Exception as e:
            print(f"BigQuery save error: {e}")
    else:
        print("Warning: BigQuery client not configured, skipping data save.")

def update_audit_results(audit_id: str, results: Dict[str, Any]):
    if audit_id in ACTIVE_AUDITS:
        ACTIVE_AUDITS[audit_id]["results"] = results
        
    if bq_client:
        try:
            details_str = json.dumps(ACTIVE_AUDITS.get(audit_id, {"results": results}))
            query = f"""
                UPDATE `{project_id}.fair_audit.audits`
                SET full_details = @details
                WHERE audit_id = @id
            """
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("details", "STRING", details_str),
                    bigquery.ScalarQueryParameter("id", "STRING", audit_id),
                ]
            )
            bq_client.query(query, job_config=job_config).result()
        except Exception as e:
            print(f"BigQuery update error: {e}")

def update_mitigation_results(audit_id: str, mitigation_res: Dict[str, Any]):
    if audit_id in ACTIVE_AUDITS:
        ACTIVE_AUDITS[audit_id]["mitigation_results"] = mitigation_res

def get_history() -> List[Dict[str, Any]]:
    history = []
    if db:
        try:
            docs = db.collection("audit_history").stream()
            for doc in docs:
                history.append(doc.to_dict())
        except Exception as e:
            print(f"Firestore read error: {e}")
    else:
        # Fallback local data matching the previous schema
        for key, value in ACTIVE_AUDITS.items():
            overall_score = value.get("results", {}).get("overall_score", 0.0)
            status = "PASS" if overall_score > 0.9 else "WARNING" if overall_score > 0.8 else "FAIL"
            history.append({
                "id": key,
                "dataset": value.get("dataset", "Unknown"),
                "date": value.get("date", "2026-04-08"),
                "model_type": value.get("model_type", "Classification"),
                "overall_score": overall_score,
                "status": status
            })
    return history

def get_audit(audit_id: str) -> Dict[str, Any]:
    if bq_client:
        try:
            query = f"""
                SELECT full_details 
                FROM `{project_id}.fair_audit.audits`
                WHERE audit_id = @id
            """
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("id", "STRING", audit_id),
                ]
            )
            result = bq_client.query(query, job_config=job_config).result()
            for row in result:
                return json.loads(row.full_details)
        except Exception as e:
            print(f"BigQuery read error: {e}")
        
    return ACTIVE_AUDITS.get(audit_id)

def get_audit_results(audit_id: str) -> Dict[str, Any]:
    audit = get_audit(audit_id)
    return audit.get("results") if audit else None
