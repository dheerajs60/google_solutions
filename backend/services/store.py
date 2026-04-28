from typing import Dict, Any, List
import json
import datetime
from google.cloud import bigquery
from firebase_admin import firestore

from backend.config.firebase_admin import db
from backend.config.bigquery_client import bq_client, project_id

# Global in-memory dictionary to store audit states.
ACTIVE_AUDITS: Dict[str, Dict[str, Any]] = {}

def store_audit(audit_id: str, data: Dict[str, Any], results: Dict[str, Any] = None, user_id: str = None):
    ACTIVE_AUDITS[audit_id] = {**data, "results": results, "user_id": user_id}
    
    overall_score = results.get("overall_score", 0.0) if results else 0.0
    status = "PASS" if overall_score > 0.9 else "WARNING" if overall_score > 0.8 else "FAIL"
    
    timestamp = data.get("date", datetime.datetime.now().strftime("%Y-%m-%d"))
    dataset_name = data.get("dataset", "Uploaded_Dataset.csv")
    model_type = data.get("model_type", "Classification")

    # Store lightweight metadata in Firestore
    if db:
        try:
            print(f"Firestore Diagnostics: Attempting to save to project '{db.project}'")
            doc_ref = db.collection("audit_history").document(audit_id)
            doc_ref.set({
                "id": audit_id,
                "user_id": user_id,
                "dataset": dataset_name,
                "date": timestamp,
                "model_type": model_type,
                "overall_score": overall_score,
                "status": status,
                "results": results, # SAVE FULL RESULTS HERE FOR PERSISTENCE ON REFRESH
                "sensitive_attrs": data.get("sensitive_attrs", []),
                "target_column": data.get("target_column", ""),
                "positive_label": data.get("positive_label", "")
            })
            print(f"Firestore: Successfully saved metadata for audit {audit_id}")
        except Exception as e:
            print(f"!!! Firestore Save Error for audit {audit_id}: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("!!! Firestore CRITICAL: Database client is NONE. Check service account permissions and key path.")

    # Store full details in BigQuery - only serializable metadata
    if bq_client:
        try:
            # Filter out non-serializable objects like model, dataframes
            serializable_data = {
                k: v for k, v in data.items() 
                if k in ["dataset", "date", "model_type", "sensitive_attrs", "target_column", "positive_label"]
            }
            full_details = {**serializable_data, "results": results, "user_id": user_id}
            table_ref = f"{project_id}.fair_audit.audits"
            
            # Convert nested dict into json string
            rows_to_insert = [
                {"audit_id": audit_id, "full_details": json.dumps(full_details)}
            ]
            
            errors = bq_client.insert_rows_json(table_ref, rows_to_insert)
            if errors:
                print(f"!!! BigQuery Insertion Error: {errors}")
            else:
                print(f"BigQuery: Successfully saved audit {audit_id} to {table_ref}")
        except Exception as e:
            print(f"!!! BigQuery Save Exception for audit {audit_id}: {e}")
    else:
        print("Warning: BigQuery client not initialized, skipping data save.")

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

def get_history(user_id: str = None) -> List[Dict[str, Any]]:
    history = []
    
    # 1. Try Firestore first
    if db:
        try:
            # Normalize user_id to avoid "undefined" strings from frontend
            if user_id == "undefined":
                user_id = None
                
            query = db.collection("audit_history")
            
            if user_id:
                # Strictly return only this user's audits
                user_docs = query.where("user_id", "==", user_id).stream()
                history = [doc.to_dict() for doc in user_docs]
                
                # Ensure all IDs are strings and sorting by timestamp
                for item in history:
                    if "id" not in item:
                        item["id"] = "legacy"
                
                history.sort(key=lambda x: x.get("date", ""), reverse=True)
                history = history[:50]
            else:
                # If no user_id (not logged in), return nothing to ensure privacy over platform history
                history = []
                
        except Exception as e:
            print(f"!!! Firestore Read Error: {e}")
        
    print(f"History: Found {len(history)} records in Firestore for local user_id: {user_id}")

    # 2. If nothing in Firestore, fallback to BigQuery
    if not history and bq_client:
        try:
            query = f"SELECT audit_id, full_details FROM `{project_id}.fair_audit.audits`"
            if user_id:
                 query += f" WHERE JSON_EXTRACT_SCALAR(full_details, '$.user_id') = '{user_id}'"
            query += " ORDER BY audit_id DESC LIMIT 50"
            results = bq_client.query(query).result()
            for row in results:
                details = json.loads(row.full_details)
                res = details.get("results", {})
                overall_score = res.get("overall_score", 0.0)
                status = "PASS" if overall_score > 0.9 else "WARNING" if overall_score > 0.8 else "FAIL"
                
                history.append({
                    "id": row.audit_id,
                    "dataset": details.get("dataset", "Unknown"),
                    "date": details.get("date", datetime.datetime.now().strftime("%Y-%m-%d")),
                    "model_type": details.get("model_type", "Classification"),
                    "overall_score": overall_score,
                    "status": status
                })
        except Exception as e:
            print(f"BigQuery history read error: {e}")

    # 3. Final fallback: local in-memory audits
    if not history:
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

    # 1. Try Memory First (Fastest, contains non-serializable model/df)
    if audit_id in ACTIVE_AUDITS:
        return ACTIVE_AUDITS[audit_id]

    # 2. Try Firestore (Contains full serializable results)
    if db:
        try:
            doc = db.collection("audit_history").document(audit_id).get()
            if doc.exists:
                data = doc.to_dict()
                print(f"Firestore: Retrieved full audit results for {audit_id}")
                return data
        except Exception as e:
            print(f"Firestore Read Error: {e}")

    # 3. Try BigQuery (Legacy/Backup)
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
        
    return None

def get_audit_results(audit_id: str) -> Dict[str, Any]:
    audit = get_audit(audit_id)
    return audit.get("results") if audit else None

def save_user_settings(user_id: str, settings: Dict[str, Any]):
    if not db:
        return
    try:
        doc_ref = db.collection("user_settings").document(user_id)
        doc_ref.set(settings, merge=True)
    except Exception as e:
        print(f"Error saving user settings: {e}")

def get_user_settings(user_id: str) -> Dict[str, Any]:
    if not db:
        return {}
    try:
        doc = db.collection("user_settings").document(user_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        print(f"Error fetching user settings: {e}")
    return {}
