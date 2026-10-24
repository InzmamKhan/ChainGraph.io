import random
import uuid
from datetime import datetime, timedelta
import pandas as pd
import os

def generate_crypto_dataset(num_transactions=100, filename="data/sample_crypto_transactions.xlsx"):
    random.seed(42)
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    base_time = datetime(2026, 10, 24, 8, 0, 0)
    rows = []

    # 1. Normal Wallets Pool (~40 txs)
    normal_wallets = [f"0x{uuid.uuid4().hex[:10]}" for _ in range(12)]
    for i in range(40):
        u = normal_wallets[i % len(normal_wallets)]
        v = normal_wallets[(i + 3) % len(normal_wallets)]
        amt = round(random.uniform(50.0, 1500.0), 2)
        ts = base_time + timedelta(minutes=i * 12)
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": u,
            "to_wallet": v,
            "amount": amt,
            "token_symbol": "USDT",
            "gas_fee": 0.0012,
            "wallet_age_days": random.randint(45, 300)
        })

    # 2. Pattern: Circular Repetition (A -> B -> C -> A) (~12 txs)
    circle_nodes = ["0xCIRC_ALPHA", "0xCIRC_BETA", "0xCIRC_GAMMA"]
    cycle_time = base_time + timedelta(hours=2)
    for _ in range(4): # 4 loops around 3 nodes = 12 txs
        for idx in range(len(circle_nodes)):
            from_n = circle_nodes[idx]
            to_n = circle_nodes[(idx + 1) % len(circle_nodes)]
            cycle_time += timedelta(minutes=4)
            rows.append({
                "tx_hash": f"0x{uuid.uuid4().hex}",
                "timestamp": cycle_time.strftime("%Y-%m-%d %H:%M:%S"),
                "from_wallet": from_n,
                "to_wallet": to_n,
                "amount": 10000.0,
                "token_symbol": "ETH",
                "gas_fee": 0.003,
                "wallet_age_days": 8
            })

    # 3. Pattern: Peeling Chain (12 txs: 6 peel steps)
    peel_whale = "0xPEEL_WHALE"
    peel_balance = 100000.0
    peel_time = base_time + timedelta(hours=4)
    current_carrier = peel_whale

    for step in range(6):
        peel_time += timedelta(minutes=10)
        peel_off = round(random.uniform(2000.0, 3000.0), 2)
        pass_through = round(peel_balance - peel_off - 2.0, 2)
        sink = f"0xPEEL_SINK_{step+1}"
        next_hop = f"0xPEEL_HOP_{step+1}"

        # Peel to sink
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": peel_time.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": current_carrier,
            "to_wallet": sink,
            "amount": peel_off,
            "token_symbol": "USDT",
            "gas_fee": 0.001,
            "wallet_age_days": 1
        })
        # Forward residue
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": (peel_time + timedelta(seconds=30)).strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": current_carrier,
            "to_wallet": next_hop,
            "amount": pass_through,
            "token_symbol": "USDT",
            "gas_fee": 0.001,
            "wallet_age_days": 1
        })
        current_carrier = next_hop
        peel_balance = pass_through

    # 4. Pattern: Fan-In (12 Feeder wallets -> 1 Target Vault) (12 txs)
    fan_in_target = "0xFAN_IN_TARGET_VAULT"
    fan_time = base_time + timedelta(hours=6)
    for f in range(12):
        feeder = f"0xFEEDER_{f+1}"
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": (fan_time + timedelta(minutes=f * 2)).strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": feeder,
            "to_wallet": fan_in_target,
            "amount": round(random.uniform(100.0, 500.0), 2),
            "token_symbol": "USDT",
            "gas_fee": 0.0009,
            "wallet_age_days": 4
        })

    # 5. Pattern: Fan-Out (1 Dispenser -> 12 Recipient Wallets) (12 txs)
    fan_out_dispenser = "0xFAN_OUT_DISPENSER"
    dispense_time = base_time + timedelta(hours=7)
    for r in range(12):
        recipient = f"0xRECIPIENT_{r+1}"
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": (dispense_time + timedelta(minutes=r * 2)).strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": fan_out_dispenser,
            "to_wallet": recipient,
            "amount": round(random.uniform(150.0, 350.0), 2),
            "token_symbol": "USDT",
            "gas_fee": 0.0009,
            "wallet_age_days": 7
        })

    # 6. Pattern: High-Frequency Ping-Pong (12 txs back & forth)
    ping = "0xBOT_PING_ALPHA"
    pong = "0xBOT_PONG_BETA"
    ping_time = base_time + timedelta(hours=8)
    for p in range(12):
        sender, receiver = (ping, pong) if p % 2 == 0 else (pong, ping)
        ping_time += timedelta(seconds=20)
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": ping_time.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": sender,
            "to_wallet": receiver,
            "amount": 500.0,
            "token_symbol": "USDT",
            "gas_fee": 0.0005,
            "wallet_age_days": 50
        })

    # Cap to exactly 100 samples total
    df = pd.DataFrame(rows[:100])
    df.to_excel(filename, index=False)
    csv_filename = filename.replace(".xlsx", ".csv")
    df.to_csv(csv_filename, index=False)
    print(f"Successfully generated compact sample dataset: {len(df)} transactions in {filename} and {csv_filename}")

if __name__ == "__main__":
    generate_crypto_dataset(num_transactions=100)
