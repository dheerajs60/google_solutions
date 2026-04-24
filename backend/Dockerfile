# Use the official Python image
FROM python:3.11-slim

# Create a staging directory to accept the build context, whichever it is
# It could be the repository root (.) or the backend directory (backend/)
WORKDIR /staging
COPY . .

# Now move the backend contents to /app/backend appropriately
WORKDIR /app
RUN mkdir -p /app/backend && \
    if [ -f /staging/backend/requirements.txt ]; then \
        # Context was the repo root, so backend is inside /staging/backend
        cp /staging/backend/requirements.txt /app/ && \
        cp -r /staging/backend/* /app/backend/; \
    elif [ -f /staging/requirements.txt ]; then \
        # Context was the backend directory itself
        cp /staging/requirements.txt /app/ && \
        cp -r /staging/* /app/backend/; \
    else \
        echo "Error: requirements.txt not found anywhere!" && exit 1; \
    fi

# Clean up staging to reduce image size
RUN rm -rf /staging

# Install dependencies from /app
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Cloud Run sets the PORT env variable automatically, defaults to 8080)
EXPOSE 8080

# Command to run the FastApi application using the correct module path
# Support port from env variables natively
CMD sh -c "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"
