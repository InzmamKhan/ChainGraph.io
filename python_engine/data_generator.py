import random
import uuid
from datetime import datetime, timedelta
import pandas as pd
import os

def generate_crypto_dataset(num_transactions=1500, filename="data/sample_crypto_transactions.xlsx"):
    random.seed(42)
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    base_time = datetime(2026, 10, 24, 8, 0, 0)
    rows = []

    # 1. Normal Wallets Pool
    normal_wallets = [f"0x{uuid.uuid4().hex[:12]}" for _ in range(40)]

    for _ in range(int(num_transactions * 0.55)):
        u = random.choice(normal_wallets)
        v = random.choice(normal_wallets)
        if u == v:
            continue
        amt = round(random.uniform(10.0, 5000.0), 2)
        ts = base_time + timedelta(minutes=random.randint(1, 1400))
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": u,
            "to_wallet": v,
            "amount": amt,
            "token_symbol": "USDT",
            "gas_fee": round(random.uniform(0.0005, 0.003), 4),
            "wallet_age_days": random.randint(30, 800)
        })

    # 2. Pattern: Circular Repetitions (A -> B -> C -> A Wash Trading)
    circle_nodes = [f"0xCIRC_{i}" for i in range(4)]
    cycle_time = base_time + timedelta(hours=2)
    for cycle_loop in range(12):
        for idx in range(len(circle_nodes)):
            from_node = circle_nodes[idx]
            to_node = circle_nodes[(idx + 1) % len(circle_nodes)]
            cycle_time += timedelta(minutes=5)
            rows.append({
                "tx_hash": f"0x{uuid.uuid4().hex}",
                "timestamp": cycle_time.strftime("%Y-%m-%d %H:%M:%S"),
                "from_wallet": from_node,
                "to_wallet": to_node,
                "amount": 25000.0,
                "token_symbol": "ETH",
                "gas_fee": 0.005,
                "wallet_age_days": 10
            })

    # 3. Pattern: Peeling Chain (Large amount peeled repeatedly)
    peel_root = "0xPEEL_WHALE_01"
    current_peel_wallet = peel_root
    peel_balance = 500000.0
    peel_time = base_time + timedelta(hours=4)

    for step in range(8):
        peel_amount = round(random.uniform(10000.0, 15000.0), 2)
        forward_amount = round(peel_balance - peel_amount - 5.0, 2)
        next_carrier = f"0xPEEL_HOP_{step+1}"
        cold_storage = f"0xPEEL_SINK_{step+1}"

        peel_time += timedelta(minutes=15)
        # Send peel to sink
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": peel_time.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": current_peel_wallet,
            "to_wallet": cold_storage,
            "amount": peel_amount,
            "token_symbol": "USDT",
            "gas_fee": 0.002,
            "wallet_age_days": 1
        })
        # Forward main balance
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": peel_time.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": current_peel_wallet,
            "to_wallet": next_carrier,
            "amount": forward_amount,
            "token_symbol": "USDT",
            "gas_fee": 0.002,
            "wallet_age_days": 1
        })
        current_peel_wallet = next_carrier
        peel_balance = forward_amount

    # 4. Pattern: Fan-In (15 Feeder addresses consolidating into 1 Target)
    fan_in_target = "0xFAN_IN_TARGET_VAULT"
    fan_in_time = base_time + timedelta(hours=6)
    for f in range(18):
        feeder = f"0xFEEDER_{f}"
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": (fan_in_time + timedelta(minutes=random.randint(1, 20))).strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": feeder,
            "to_wallet": fan_in_target,
            "amount": round(random.uniform(200.0, 800.0), 2),
            "token_symbol": "USDT",
            "gas_fee": 0.001,
            "wallet_age_days": 5
        })

    # 5. Pattern: Fan-Out (1 Source dispersing to 20 Targets)
    fan_out_source = "0xFAN_OUT_DISPENSER"
    fan_out_time = base_time + timedelta(hours=7)
    for o in range(16):
        out_target = f"0xRECIPIENT_{o}"
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": (fan_out_time + timedelta(minutes=random.randint(1, 15))).strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": fan_out_source,
            "to_wallet": out_target,
            "amount": round(random.uniform(150.0, 450.0), 2),
            "token_symbol": "USDT",
            "gas_fee": 0.001,
            "wallet_age_days": 12
        })

    # 6. Pattern: High Frequency Ping-Pong (2 Wallets bouncing money back and forth)
    ping_node = "0xBOT_PING_ALPHA"
    pong_node = "0xBOT_PONG_BETA"
    ping_time = base_time + timedelta(hours=8)
    for p in range(25):
        from_n, to_n = (ping_node, pong_node) if p % 2 == 0 else (pong_node, ping_node)
        ping_time += timedelta(seconds=45)
        rows.append({
            "tx_hash": f"0x{uuid.uuid4().hex}",
            "timestamp": ping_time.strftime("%Y-%m-%d %H:%M:%S"),
            "from_wallet": from_n,
            "to_wallet": to_n,
            "amount": 1000.0,
            "token_symbol": "USDT",
            "gas_fee": 0.0008,
            "wallet_age_days": 60
        })

    df = pd.DataFrame(rows)
    # Save both XLSX and CSV for quick use
    df.to_excel(filename, index=False)
    csv_filename = filename.replace(".xlsx", ".csv")
    df.to_csv(csv_filename, index=False)
    print(f"Generated {len(df)} transactions in {filename} and {csv_filename}")

if __name__ == "__main__":
    generate_crypto_dataset()
