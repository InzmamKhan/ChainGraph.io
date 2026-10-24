import pandas as pd
import numpy as np
from models.detector import CryptoAnomalyModel
from graph_processor import GraphEngine
from data_generator import generate_crypto_dataset
import os

def train_model():
    dataset_path = "data/sample_crypto_transactions.csv"
    if not os.path.exists(dataset_path):
        print("Generating training dataset...")
        generate_crypto_dataset(num_transactions=2000, filename="data/sample_crypto_transactions.xlsx")

    print("Loading data...")
    df = pd.read_csv(dataset_path)

    # Convert to transaction dicts
    tx_list = []
    for _, r in df.iterrows():
        tx_list.append({
            "txHash": str(r["tx_hash"]),
            "timestamp": str(r["timestamp"]),
            "fromWallet": str(r["from_wallet"]),
            "toWallet": str(r["to_wallet"]),
            "amount": float(r["amount"]),
            "tokenSymbol": str(r.get("token_symbol", "USDT")),
            "gasFee": float(r.get("gas_fee", 0.001)),
            "walletAgeDays": int(r.get("wallet_age_days", 30))
        })

    # Build Graph & Extract Features
    engine = GraphEngine()
    G = engine.build_multigraph(tx_list)
    features_df = engine.extract_node_features(G)

    # Create Ground Truth Labels based on our synthetic definitions
    # 0: Normal, 1: Circular, 2: Peeling, 3: Fan-In, 4: Fan-Out, 5: Ping-Pong
    labels = []
    for _, row in features_df.iterrows():
        w = row["wallet"]
        if "CIRC" in w or row["cycle_count"] > 0:
            labels.append(1)
        elif "PEEL" in w or row["is_peeling_candidate"] == 1:
            labels.append(2)
        elif "FEEDER" in w or "FAN_IN" in w or (row["in_degree"] >= 8 and row["out_degree"] <= 2):
            labels.append(3)
        elif "RECIPIENT" in w or "FAN_OUT" in w or (row["out_degree"] >= 8 and row["in_degree"] <= 2):
            labels.append(4)
        elif "PING" in w or "PONG" in w or row["reciprocity_count"] >= 5:
            labels.append(5)
        else:
            labels.append(0)

    y = np.array(labels)
    feature_cols = [
        "in_degree", "out_degree", "in_out_ratio", "total_in_amt",
        "total_out_amt", "reciprocity_count", "cycle_count", "is_peeling_candidate"
    ]
    X = features_df[feature_cols]

    print(f"Training on {len(X)} nodes across {len(np.unique(y))} classes...")
    model = CryptoAnomalyModel()
    model.train(X, y)
    model.save("models/anomaly_detector.joblib")
    print("Training complete! Saved weights to python_engine/models/anomaly_detector.joblib")

if __name__ == "__main__":
    train_model()
