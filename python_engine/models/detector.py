import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
import joblib
import os

# Anomaly Label Map
LABEL_MAP = {
    0: "NORMAL",
    1: "CIRCULAR_REPETITION",
    2: "PEELING_CHAIN",
    3: "FAN_IN",
    4: "FAN_OUT",
    5: "HIGH_FREQUENCY_PING_PONG"
}

class CryptoAnomalyModel:
    def __init__(self):
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False

    def train(self, X: pd.DataFrame, y: np.ndarray):
        """
        Trains both Supervised (RandomForest) and Unsupervised (IsolationForest).
        Features expected:
        [in_degree, out_degree, in_out_ratio, reciprocity_count,
         cycle_count, avg_amount_out_ratio, tx_frequency_burst]
        """
        self.classifier.fit(X, y)
        self.isolation_forest.fit(X)
        self.is_trained = True

    def predict(self, feature_df: pd.DataFrame):
        """
        Returns anomaly classifications and probability scores.
        """
        if not self.is_trained:
            # Fallback heuristic if untyped model weights are uninitialized
            preds = []
            for _, row in feature_df.iterrows():
                if row.get("cycle_count", 0) > 0:
                    preds.append((1, 0.95))
                elif row.get("is_peeling_candidate", 0) > 0:
                    preds.append((2, 0.90))
                elif row.get("in_degree", 0) >= 8 and row.get("out_degree", 0) <= 2:
                    preds.append((3, 0.88))
                elif row.get("out_degree", 0) >= 8 and row.get("in_degree", 0) <= 2:
                    preds.append((4, 0.88))
                elif row.get("reciprocity_count", 0) >= 5:
                    preds.append((5, 0.92))
                else:
                    preds.append((0, 0.10))
            return preds

        labels = self.classifier.predict(feature_df)
        probs = self.classifier.predict_proba(feature_df)
        max_probs = [float(np.max(p)) for p in probs]
        return list(zip(labels, max_probs))

    def save(self, filepath="models/anomaly_detector.joblib"):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"classifier": self.classifier, "isolation_forest": self.isolation_forest, "is_trained": self.is_trained}, filepath)

    def load(self, filepath="models/anomaly_detector.joblib"):
        if os.path.exists(filepath):
            data = joblib.load(filepath)
            self.classifier = data["classifier"]
            self.isolation_forest = data["isolation_forest"]
            self.is_trained = data["is_trained"]
            return True
        return False
