# Use the official Python image
FROM python:3.11-slim

# Set working directory to /app
WORKDIR /app

# Copy the entire context
COPY . .

# Robustly find and install requirements
RUN if [ -f backend/requirements.txt ]; then \
        pip install --no-cache-dir -r backend/requirements.txt; \
    elif [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        ls -R && echo "requirements.txt not found" && exit 1; \
    fi

# Expose port (Cloud Run sets the PORT env variable automatically)
EXPOSE 8080

# Robustly start the application
CMD ["sh", "-c", "if [ -d backend ]; then uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}; else uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}; fi"]
