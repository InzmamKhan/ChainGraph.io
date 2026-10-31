# ==========================================
# STAGE 1: Build Spring Boot Backend via Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS backend-build
WORKDIR /build

# Copy pom.xml and pre-download dependencies
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy backend source code and compile jar
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# STAGE 2: Combined Runtime Container
# ==========================================
FROM python:3.11-slim-bookworm

# Install OpenJDK 21 headless + netcat for readiness probe
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jre-headless \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setup Python ML Engine
COPY python_engine/requirements.txt ./python_engine/
RUN pip install --no-cache-dir -r ./python_engine/requirements.txt
COPY python_engine/ ./python_engine/

# Generate dataset & train model weights if not present
WORKDIR /app/python_engine
RUN python train.py

# 2. Setup Spring Boot App
WORKDIR /app
COPY --from=backend-build /build/target/*.jar ./backend/app.jar

# 3. Setup Entrypoint script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8080

CMD ["./start.sh"]
