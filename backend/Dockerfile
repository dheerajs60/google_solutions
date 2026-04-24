# Use the official Python image
FROM python:3.11-slim

# Set working directory to /app
WORKDIR /app

# Copy the entire repository (build context will be the root)
COPY . .

# Install dependencies from the backend requirements file
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose port (Cloud Run sets the PORT env variable automatically, defaults to 8080)
EXPOSE 8080

# Command to run the FastAPI application
# We use 'backend.main:app' because the 'backend' folder is in the current directory (/app)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
