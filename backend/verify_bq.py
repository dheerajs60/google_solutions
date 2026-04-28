import os
from google.cloud import bigquery
from google.api_core.exceptions import NotFound

def verify_bq():
    project_id = "hackathon-481806"
    client = bigquery.Client(project=project_id)
    
    print(f"Checking for dataset fair_audit in project {project_id}...")
    dataset_ref = f"{project_id}.fair_audit"
    
    try:
        dataset = client.get_dataset(dataset_ref)
        print(f"✅ Dataset found: {dataset_ref}")
        print(f"Location: {dataset.location}")
        
        table_ref = f"{dataset_ref}.audits"
        try:
            table = client.get_table(table_ref)
            print(f"✅ Table found: {table_ref}")
            print(f"Rows: {table.num_rows}")
        except Exception as e:
            print(f"❌ Table error: {e}")
            
    except NotFound:
        print(f"❌ Dataset fair_audit not found. Attempting to create...")
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "US"
        client.create_dataset(dataset)
        print(f"✅ Created dataset {dataset_ref}")

if __name__ == "__main__":
    verify_bq()
