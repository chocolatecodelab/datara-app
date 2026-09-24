# ==============================================================================
# Datara AI Agentic Engine - Backend Dockerfile
# Multi-stage / Optimized Python 3.10-slim Runtime
# ==============================================================================
FROM python:3.10-slim AS base

# Python runtime configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Install lightweight system dependencies for health checks & SSL certs
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and SQLite initial stores
COPY . .

# Create non-root system user for enterprise security best practices
RUN useradd -u 1000 -m datara && \
    chown -R datara:datara /app
USER datara

EXPOSE 8000

# Health check to ensure API gateway is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Launch Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
