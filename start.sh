#!/bin/bash
set -e

echo "Starting Python Math & ML Engine on internal port 8000..."
cd /app/python_engine
python -m uvicorn main:app --host 127.0.0.1 --port 8000 &

echo "Waiting for Python engine to warm up..."
while ! nc -z 127.0.0.1 8000; do
  sleep 0.5
done
echo "Python engine is UP and ready."

echo "Starting Spring Boot on port ${PORT:-8080}..."
cd /app/backend
java -Dserver.port=${PORT:-8080} -Dpython.engine.url=http://127.0.0.1:8000 -jar app.jar
