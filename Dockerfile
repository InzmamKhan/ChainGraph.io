# ==========================================
# STAGE 1: Build Spring Boot Backend via Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS backend-build
WORKDIR /build

COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# STAGE 2: Combined Runtime Container (Eclipse Temurin JRE + Python)
# ==========================================
FROM eclipse-temurin:21-jre-jammy

# Install Python 3, pip, and netcat for readiness probe
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

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
