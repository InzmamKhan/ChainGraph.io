import networkx as nx
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any

class GraphEngine:
    def __init__(self):
        pass

    def build_multigraph(self, transactions: List[Dict[str, Any]]):
        G = nx.MultiDiGraph()
        for tx in transactions:
            from_w = tx.get("fromWallet")
            to_w = tx.get("toWallet")
            amt = float(tx.get("amount", 0.0))
            ts = tx.get("timestamp", "")
            tx_h = tx.get("txHash", "")

            G.add_edge(from_w, to_w, txHash=tx_h, amount=amt, timestamp=ts)
        return G

    def extract_node_features(self, G: nx.MultiDiGraph) -> pd.DataFrame:
        features = []
        nodes = list(G.nodes())

        # Simple cycles detection on reduced directed graph
        simple_digraph = nx.DiGraph(G)
        try:
            cycles = list(nx.simple_cycles(simple_digraph))
        except Exception:
            cycles = []

        cycle_nodes = set()
        for c in cycles:
            if 3 <= len(c) <= 6:
                for node in c:
                    cycle_nodes.add(node)

        for node in nodes:
            in_edges = list(G.in_edges(node, data=True))
            out_edges = list(G.out_edges(node, data=True))

            in_deg = len(in_edges)
            out_deg = len(out_edges)
            in_out_ratio = (in_deg + 1e-4) / (out_deg + 1e-4)

            total_in_amt = sum(e[2].get("amount", 0.0) for e in in_edges)
            total_out_amt = sum(e[2].get("amount", 0.0) for e in out_edges)

            # Reciprocity (Ping Pong check)
            successors = set(G.successors(node))
            predecessors = set(G.predecessors(node))
            reciprocal_nodes = successors.intersection(predecessors)
            reciprocity_count = sum(
                len(G.get_edge_data(node, r)) + len(G.get_edge_data(r, node))
                for r in reciprocal_nodes
            )

            # Peeling check candidate
            is_peeling = 0
            if in_deg >= 1 and out_deg >= 2:
                # 1 large in, 1 main out, 1 small out
                out_amts = sorted([e[2].get("amount", 0.0) for e in out_edges], reverse=True)
                if len(out_amts) >= 2 and total_in_amt > 0:
                    pass_through = out_amts[0] / total_in_amt
                    if 0.75 <= pass_through <= 0.99:
                        is_peeling = 1

            features.append({
                "wallet": node,
                "in_degree": in_deg,
                "out_degree": out_deg,
                "in_out_ratio": in_out_ratio,
                "total_in_amt": total_in_amt,
                "total_out_amt": total_out_amt,
                "reciprocity_count": reciprocity_count,
                "cycle_count": 1 if node in cycle_nodes else 0,
                "is_peeling_candidate": is_peeling
            })

        return pd.DataFrame(features)

    def bundle_edges(self, G: nx.MultiDiGraph):
        """
        Collapses multiple edges between the same node pair into bundled representation
        with thickness proportional to transaction count and volume.
        """
        bundled = {}
        for u, v, data in G.edges(data=True):
            pair_key = f"{u}->{v}"
            if pair_key not in bundled:
                bundled[pair_key] = {
                    "id": f"edge-{u[:6]}-{v[:6]}-{len(bundled)}",
                    "source": u,
                    "target": v,
                    "transactionCount": 0,
                    "totalAmount": 0.0,
                    "transactions": []
                }
            bundled[pair_key]["transactionCount"] += 1
            bundled[pair_key]["totalAmount"] += data.get("amount", 0.0)
            bundled[pair_key]["transactions"].append({
                "txHash": data.get("txHash"),
                "amount": data.get("amount"),
                "timestamp": data.get("timestamp")
            })

        result = []
        for edge in bundled.values():
            count = edge["transactionCount"]
            # Visual thickness: logarithmically or min-max scaled
            thickness = min(16, max(2, int(count * 2.5)))
            edge["edgeThickness"] = thickness
            edge["isHighFrequency"] = count >= 4
            result.append(edge)
        return result
