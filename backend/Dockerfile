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
    fi

# Hyper-resilience: If we are in the 'backend' context, we need a 'backend' directory
# so that imports like 'from backend.routers' work.
RUN if [ ! -d backend ]; then \
        echo "Reconstructing 'backend' package structure..." && \
        mkdir /tmp/app_content && \
        cp -r . /tmp/app_content && \
        rm -rf * && \
        mkdir backend && \
        mv /tmp/app_content/* backend/ && \
        touch backend/__init__.py; \
    fi

# Expose port
EXPOSE 8080

# Start uvicorn - always using backend.main:app now that we've ensured the structure
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
