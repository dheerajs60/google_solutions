# Use the official Python image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install dependencies before copying the code to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory contents
COPY . .

# Expose port (Cloud Run sets the PORT env variable automatically, defaults to 8080)
EXPOSE 8080

# Command to run the FastApi application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
