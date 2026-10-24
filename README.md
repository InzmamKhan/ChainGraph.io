# ChainGraph.io - Crypto Anomaly Visualizer

## System Architecture

```
[ React + ReactFlow (Port 3000) ]
        │ (Upload Excel/CSV)
        ▼
[ Spring Boot MVC Backend (Port 8080) ]
  ├── ExcelParserService (Apache POI)
  └── GraphAnalysisClientService (HTTP Client)
        │ (POST JSON transactions)
        ▼
[ Python ML & Graph Engine (Port 8000) ]
  ├── GraphEngine (NetworkX Topology & Edge Bundling)
  └── CryptoAnomalyModel (RandomForest + IsolationForest)
```

---

## 1. Quick Start Guide

### Step 1: Python Engine Setup
```bash
cd python_engine
pip install -r requirements.txt
```

#### Generate Big Sample Dataset (.xlsx and .csv)
Run the built-in generator to create a realistic 1,500+ transaction dataset containing all 5 anomaly types:
```bash
python data_generator.py
```
This produces:
* `python_engine/data/sample_crypto_transactions.xlsx`
* `python_engine/data/sample_crypto_transactions.csv`

#### Train the Machine Learning Model
Train the Random Forest & Isolation Forest on the topological features:
```bash
python train.py
```
This trains the model and saves the trained weights to:
`python_engine/models/anomaly_detector.joblib`

#### Start the Python Service
```bash
uvicorn main:app --port 8000 --reload
```

---

### Step 2: Spring Boot Backend Setup
In a new terminal:
```bash
cd backend
mvn clean spring-boot:run
```
Spring Boot listens on `http://localhost:8080`.

---

### Step 3: React Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 2. Testing the Anomaly Visualizer
1. Click the glowing neon button **"UPLOAD EXCEL / CSV"** on the dashboard.
2. Select `python_engine/data/sample_crypto_transactions.xlsx` (or `.csv`).
3. The system will:
   * Read the sheet rows via Apache POI.
   * Send the transactions to the Python engine.
   * Compute multigraph edge bundling and extract topological features.
   * Classify nodes through the trained ML model.
   * Render the network graph with **Dark Theme & Bright Neon RGB Nodes**.
