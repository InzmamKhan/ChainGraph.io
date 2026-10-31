# ChainGraph.io Deployment & Architecture Guide

## 1. Local Development Setup

### Python Engine
```bash
cd python_engine
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### Spring Boot Backend
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

### React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 2. Cloud Deployment (Vercel + Render)

### A. Frontend on Vercel
1. Set the **Root Directory** on Vercel to `frontend`.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_BACKEND_URL`: `https://<your-render-backend-url>.onrender.com` (Your deployed Render backend URL)
4. Click **Deploy**.

---

### B. Combined Backend + Python Engine on Render (Single Web Service)
A multi-stage [`Dockerfile`](Dockerfile) and orchestration script [`start.sh`](start.sh) are pre-configured in the repository root.

1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your Git repository.
3. Service Configuration:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (Root repository)
4. How it operates inside the container:
   - The container builds the Spring Boot JAR with OpenJDK.
   - Sets up Python 3.11 with all ML and graph libraries (`NetworkX`, `Scikit-learn`, `FastAPI`).
   - `start.sh` boots the Python FastAPI engine on internal port `8000` (loopback).
   - Once Python is healthy, Spring Boot starts on Render's external `$PORT`.
   - Your entire backend stack runs smoothly within Render's free tier single web service.
