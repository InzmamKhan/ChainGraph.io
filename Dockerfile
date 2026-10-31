# ==========================================
# STAGE 1: Build Spring Boot Backend
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS backend-build
WORKDIR /build

# Copy Maven wrapper & POM
COPY backend/mvnw backend/mvnw.cmd backend/pom.xml ./
COPY backend/.mvn ./.mvn/
COPY backend/apache-maven-3.9.6 ./apache-maven-3.9.6/

# Download dependencies
RUN if [ -f ./mvnw ]; then chmod +x ./mvnw && ./mvnw dependency:go-offline -B; \
    else ./apache-maven-3.9.6/bin/mvn dependency:go-offline -B; fi

# Copy source and build jar
COPY backend/src ./src
RUN if [ -f ./mvnw ]; then ./mvnw clean package -DskipTests; \
    else ./apache-maven-3.9.6/bin/mvn clean package -DskipTests; fi

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
