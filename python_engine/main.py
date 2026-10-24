from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from models.detector import CryptoAnomalyModel, LABEL_MAP
from graph_processor import GraphEngine
import os

app = FastAPI(title="Crypto Graph Math Engine", version="1.0.0")

model = CryptoAnomalyModel()
model.load("models/anomaly_detector.joblib")
engine = GraphEngine()

class TransactionItem(BaseModel):
    txHash: str
    timestamp: str
    fromWallet: str
    toWallet: str
    amount: float
    tokenSymbol: Optional[str] = "USDT"
    gasFee: Optional[float] = 0.001
    walletAgeDays: Optional[int] = 30

class AnalysisRequest(BaseModel):
    datasetId: str
    transactions: List[TransactionItem]

@app.get("/")
def health_check():
    return {"status": "RUNNING", "model_trained": model.is_trained}

@app.post("/api/v1/analyze")
def analyze_crypto_network(req: AnalysisRequest):
    tx_dicts = [t.model_dump() for t in req.transactions]

    if not tx_dicts:
        return {"summary": {}, "nodes": [], "edges": [], "detectedAnomalies": []}

    # 1. Build MultiDiGraph
    G = engine.build_multigraph(tx_dicts)

    # 2. Extract topological features for ML model
    feature_df = engine.extract_node_features(G)

    # 3. Predict via Model
    feature_cols = [
        "in_degree", "out_degree", "in_out_ratio", "total_in_amt",
        "total_out_amt", "reciprocity_count", "cycle_count", "is_peeling_candidate"
    ]
    predictions = model.predict(feature_df[feature_cols])

    # 4. Synthesize Node Results & RGB UI Coloring
    nodes_payload = []
    detected_anomalies = []

    for i, row in feature_df.iterrows():
        wallet = row["wallet"]
        label_code, confidence = predictions[i]
        label_name = LABEL_MAP.get(label_code, "NORMAL")

        # Color scheme based on anomaly
        # Default Benign: Neon Green (#00FF66)
        # Anomalies: Bright Bold Red (#FF0055), Orange (#FF9900), Cyan (#00E5FF), Purple (#CC00FF)
        if label_name == "NORMAL":
            color = "#00FF66"
            risk_score = 5
        elif label_name in ["CIRCULAR_REPETITION", "PEELING_CHAIN"]:
            color = "#FF0055" # Crimson Neon
            risk_score = 95
        elif label_name in ["FAN_IN", "FAN_OUT"]:
            color = "#FF9900" # Amber Neon
            risk_score = 75
        elif label_name == "HIGH_FREQUENCY_PING_PONG":
            color = "#00E5FF" # Electric Cyan Neon
            risk_score = 85
        else:
            color = "#CC00FF"
            risk_score = 50

        node_data = {
            "id": wallet,
            "label": f"{wallet[:6]}...{wallet[-4:]}" if len(wallet) > 10 else wallet,
            "inDegree": int(row["in_degree"]),
            "outDegree": int(row["out_degree"]),
            "totalReceived": float(row["total_in_amt"]),
            "totalSent": float(row["total_out_amt"]),
            "anomalyType": label_name,
            "riskScore": risk_score,
            "color": color,
            "confidence": round(confidence, 2)
        }
        nodes_payload.append(node_data)

        if label_name != "NORMAL":
            detected_anomalies.append({
                "wallet": wallet,
                "type": label_name,
                "confidence": round(confidence, 2),
                "riskScore": risk_score
            })

    # 5. Edge Bundles
    edges_payload = engine.bundle_edges(G)

    # 6. Overall Metrics
    total_vol = sum(t["amount"] for t in tx_dicts)
    summary = {
        "totalTransactions": len(tx_dicts),
        "uniqueWallets": len(nodes_payload),
        "totalVolume": round(total_vol, 2),
        "anomalyCount": len(detected_anomalies),
        "overallRiskScore": round(sum(n["riskScore"] for n in nodes_payload) / max(1, len(nodes_payload)), 1)
    }

    return {
        "summary": summary,
        "nodes": nodes_payload,
        "edges": edges_payload,
        "detectedAnomalies": detected_anomalies
    }
