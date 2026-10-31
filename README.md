# <div align="center">⛓️ ChainGraph.io</div>

## 🔗 Quick Links
* **Live Web App (Vercel)**: https://chain-graph-io.vercel.app/
* **API Service (Render)**: https://chaingraph-io.onrender.com
* **GitHub Repository**: https://github.com/InzmamKhan/ChainGraph.io

---

## 📖 Brief Description
ChainGraph.io is a full-stack on-chain intelligence and forensic visualization platform designed to model raw blockchain transactions as a directed temporal multigraph:

```
G = (V, E, T, W)
```
* **V (Vertices)**: Unique crypto wallet addresses.
* **E (Edges)**: Directed transaction transfers between wallets.
* **T (Temporal Domain)**: Timestamps representing when transfers occurred.
* **W (Weights)**: Transfer values (USD / ETH / USDT), gas fees, and token symbols.

Without relying on slow database indexing for prototypes, the system ingests raw transaction batches (via spreadsheets or manual record-by-record insertion), collapses parallel transfers into weighted edge bundles, extracts 8-dimensional topological feature vectors for every address, and runs an ensemble of **Random Forest** and **Isolation Forest** classifiers to isolate bad actors in sub-second times with a high-contrast Cyberpunk RGB visual hierarchy.

---

## ⚡ Key Features

1. **Dual Ingestion Engine**:
   * **Local Spreadsheet Import**: Ingests `.xlsx`, `.xls`, or `.csv` files using in-memory streaming via Apache POI without saving temporary files to disk.
   * **Manual Record Admission Queue**: An interactive form for real-time manual entry. Users fill in transaction parameters and hit **Next (Admit Record)** to enqueue multiple records before running atomic graph analysis.
   * **Schema Guidance Pop-up**: An interactive helper detailing mandatory column requirements (`tx_hash`, `timestamp`, `from_wallet`, `to_wallet`, `amount`, `token_symbol`, `gas_fee`, `wallet_age_days`).

2. **Five Forensic Anomaly Detectors**:
   * **Circular Repetition (Wash Trading)**: Pinpoints closed directed cycles (A -> B -> C -> A) intended to inflate artificial trading volume or manipulate exchange pricing.
   * **Peeling Chains (Layered Smurfing)**: Detects structured hops where a high-volume input repeatedly sheds small "peels" into sink accounts while routing 70%–99% of residual balances to fresh ephemeral carrier addresses.
   * **Fan-In (Consolidation)**: Flags collection vaults absorbing rapid inward bursts from dozens of satellite feeder addresses.
   * **Fan-Out (Dispersion)**: Identifies loot dispersion where a single source splatters funds across multiple fresh destinations.
   * **High-Frequency Ping-Pong (Bidirectional Bouncing)**: Surfaces bot pairs executing rapid back-and-forth trades with narrow interval deltas.

3. **Dynamic Parallel Edge Bundling**:
   * Condenses duplicate transactions between identical source-destination pairs into a single weighted edge stroke:
     ```text
     strokeWidth = min(16, max(2, floor(2.5 * transaction_count)))
     ```
   * High-frequency paths trigger real-time animated neon pulses across the canvas.

4. **Forensic Dark-Theme RGB UI**:
   * Normal / Benign: Electric Neon Green (`#00FF66`).
   * Critical Wash / Peeling: Neon Crimson Red (`#FF0055`) with glowing drop-shadows and risk badges.
   * Fan-In / Fan-Out Hubs: Neon Amber (`#FF9900`).
   * High-Frequency Ping-Pong: Electric Cyan (`#00E5FF`).

---

## 🏗️ Architecture & System Design

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER (Vercel)                                 │
│  React 18 + TypeScript + Vite + ReactFlow + HTML5 Canvas                         │
│  - State management for interactive graph pan, zoom, and node filtering          │
│  - Polar coordinate layout projection engine                                     │
│  - Split Modal: File Ingestion & Manual Record-by-Record Queue                   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ (1) POST /api/transactions/upload (multipart)
                                         │     or /api/transactions/manual (JSON)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION GATEWAY (Render Container)                    │
│  Spring Boot 3.3.4 (OpenJDK 21) - MVC Architecture                               │
│  ├── TransactionController (Rest Controller with CORS enablement)                │
│  ├── ExcelParserService (Apache POI 5.2.5 In-Memory OOXML Stream Processor)       │
│  └── GraphAnalysisClientService (Spring RestTemplate HTTP/1.1 Loopback Client)   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ (2) POST http://127.0.0.1:8000/api/v1/analyze
                                         │     application/json
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     COMPUTATION & ML ENGINE (Render Container)                   │
│  Python 3.11 + FastAPI + Uvicorn + NetworkX + Scikit-Learn                       │
│  ├── MultiDiGraph Builder (Adjacency hash maps)                                  │
│  ├── Topological Feature Engineering Pipeline                                    │
│  ├── Supervised Random Forest Classifier (100 Decision Trees)                    │
│  └── Unsupervised Isolation Forest (High-dimensional outlier isolation)          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow & Technical Life-Cycle

### Comprehensive Visual Flow

```
[ User Action: Excel File Upload OR Manual Form Queue ]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: BROWSER / CLIENT STREAMING                             │
│ • File selected or transactions queued one by one               │
│ • Axios creates RFC 7578 Multipart or JSON payload              │
│ • Dispatches HTTP POST across WAN to Render URL                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: SPRING BOOT IN-MEMORY UNPACKING & ORCHESTRATION        │
│ • Tomcat accepts socket stream on Render's dynamic $PORT        │
│ • Apache POI unzips OOXML (sheet1.xml & sharedStrings.xml)      │
│ • Sanitizes data types into Java 22 Record DTOs                 │
│ • RestTemplate serializes JSON to internal loopback port 8000   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: PYTHON GRAPH & ML COMPUTATION ENGINE                   │
│                                                                 │
│   (1) MultiDiGraph Assembly                                     │
│       Node (u) ──[ Tx: amount, time, hash ]──> Node (v)         │
│                                                                 │
│   (2) Feature Engineering Matrix                                │
│       ┌──────────────────────────────────────────────────────┐  │
│       │ Vector: [in_deg, out_deg, in_out_ratio, vol_in,      │  │
│       │          vol_out, reciprocity, cycle_bool, peel_bool]│  │
│       └──────────────────────────────────────────────────────┘  │
│                                                                 │
│   (3) Detection Algorithms & Inference                          │
│       • Bounded Johnson Cycle Detection (Loops <= 6 nodes)      │
│       • Reciprocal Cardinality Check: Succ(u) ∩ Pred(u)         │
│       • Peeling Residue Pass-Through (70% - 99% forward)        │
│       • Random Forest (Classifier) & Isolation Forest (Scores)  │
│                                                                 │
│   (4) Edge Bundling & RGB Tagging                               │
│       Parallel edges collapsed -> stroke width (2px to 16px)    │
│       RGB codes assigned: Green, Red, Amber, or Cyan            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4: REACTFLOW 60 FPS CANVAS RENDERING                      │
│ • JSON payload received by React Virtual DOM                    │
│ • Polar Coordinates Layout: x = Cx + R*cos(θ), y = Cy + R*sin(θ)│
│ • GPU-accelerated CSS glow filters applied                      │
│ • Animated dashed stroke pulses for high-frequency bots         │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Breakdown of Each Stage

#### Stage 1: Ingestion & Transmission (Client -> Spring Boot)
```
[User Form / Dropzone] ---> Axios Multipart Stream ---> [Spring Controller]
```
1. The user selects a file or queues records manually in `ImportModal.tsx`.
2. For files, Axios streams binary octets over `multipart/form-data` (RFC 7578). For manual records, a JSON payload is dispatched.
3. The Spring Boot backend (`TransactionController`) traps the request. If an Excel file is provided, `ExcelParserService` evaluates the binary stream via Apache POI's `WorkbookFactory.create(is)`.
4. It parses the uncompressed `sharedStrings.xml` and worksheet cell matrices in RAM, validates cell formats, and converts rows into immutable Java 22 record instances (`TransactionDto`).

#### Stage 2: Microservice Delegation (Spring Boot -> Python)
```
[TransactionDto List] ---> Jackson JSON Converter ---> POST 127.0.0.1:8000
```
1. `GraphAnalysisClientService` serializes the record list into a unified JSON structure and assigns a runtime `datasetId` (`UUID.randomUUID()`).
2. An HTTP `POST` is made to Python's FastAPI engine listening on loopback `127.0.0.1:8000`.

#### Stage 3: Topological Feature Engineering & ML Inference (Python Engine)
```
Raw Transactions ---> MultiDiGraph ---> 8D Features ---> Random Forest & Isolation Forest
```
1. **Graph Construction**: NetworkX instantiates a `MultiDiGraph` maintaining directed adjacency lists `_succ` and `_pred`.
2. **Topological Feature Vector Extraction**: For each node, an 8-dimensional behavioral vector is extracted:
   ```text
   x_v = [ in_degree, out_degree, in_out_ratio, vol_in, vol_out, reciprocity, is_cycle, is_peel ]
   ```
   * **Bounded Cycle Search**: Detects directed loops (cycles between 2 and 6 nodes) using an early-exit generator on Johnson's algorithm to eliminate exponential stalls.
   * **Reciprocity Calculation**: Computes bidirectional intersection cardinality:
     ```text
     Reciprocity(u, v) = Cardinality of (Successors(u) ∩ Predecessors(u))
     ```
   * **Peeling Residue Verification**: Flags nodes where an incoming volume is split into a dominant forward pass (70% - 99%) and a minor peel to a sink address.
3. **Model Prediction**:
   * The feature matrix is evaluated by a **Random Forest Classifier** trained on topological distributions, generating discrete class labels (0 to 5) and confidence scores.
   * Concurrently, an **Isolation Forest** checks multi-dimensional clustering distance to generate a risk score (0 to 100).
4. **Edge Bundling**: Parallel edges are collapsed into single bundles containing composite counts, cumulative token amounts, and dynamic stroke widths.

#### Stage 4: Composition & Rendering (Spring Boot -> React)
```
Enriched JSON ---> Polar Coordinate Math ---> ReactFlow Canvas
```
1. Python returns the serialized graph topology (nodes, bundled edges, anomaly breakdown, and overall risk summary) to Spring Boot, which immediately relays it to React.
2. ReactFlow projects nodes into a collision-free polar coordinate layout:
   ```text
   x = Center_X + Radius * cos(2 * PI * i / Total_Nodes)
   y = Center_Y + Radius * sin(2 * PI * i / Total_Nodes)
   ```
3. Custom SVG handles and GPU-accelerated CSS drop-shadow filters render the network at a steady **60 FPS**.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **Canvas Engine**: ReactFlow (SVG + HTML5 Canvas rendering)
* **Icons & Styling**: Lucide React, Custom Dark Neon CSS
* **Networking**: Axios
* **Hosting**: Vercel

### Backend
* **Framework**: Spring Boot 3.3.4 (Java 22 / OpenJDK 21)
* **Spreadsheet Processing**: Apache POI 5.2.5 (`poi` & `poi-ooxml`)
* **JSON Serialization**: Jackson 2
* **Build System**: Apache Maven 3.9.6
* **Architecture**: Spring MVC, RestController, DTO Pattern

### Mathematical & ML Computation Engine
* **Runtime**: Python 3.11 / 3.13
* **API Framework**: FastAPI, Uvicorn, Pydantic v2
* **Graph Mathematics**: NetworkX (MultiDiGraph, cycle detection, reciprocity)
* **Machine Learning**: Scikit-Learn (Random Forest, Isolation Forest)
* **Data Processing**: Pandas, NumPy, OpenPyXL
* **Persistence**: Joblib (serialized model weights)

### Deployment & Containerization
* **Container**: Multi-Stage `Dockerfile` (`maven:3.9.6` -> `eclipse-temurin:21-jre-jammy`)
* **Orchestration**: Custom `start.sh` startup daemon
* **Cloud Infrastructure**: Render (Docker Web Service) + Vercel (Edge CDN)

---

## 💻 Getting Started / Local Development

### Prerequisites
* **Java**: JDK 17 or 21+ (`java -version`)
* **Python**: Python 3.10+ (`python --version`)
* **Node.js**: Node 18+ and npm (`node -v`)

---

### Step 1: Start the Python Engine
```bash
# Navigate to python engine
cd python_engine

# Install required mathematical & ML dependencies
pip install -r requirements.txt

# (Optional) Generate the 100-sample test dataset and train model
python data_generator.py
python train.py

# Launch FastAPI on port 8000
python -m uvicorn main:app --port 8000 --reload
```
*Verify: Open `http://localhost:8000/` -> `{"status":"RUNNING","model_trained":true}`*

---

### Step 2: Start the Spring Boot Backend
Open a second terminal:
```bash
# Navigate to backend
cd backend

# Run via Maven Wrapper
.\mvnw.cmd spring-boot:run
```
*(On macOS/Linux, run `./mvnw spring-boot:run`)*  
*Verify: Backend starts on `http://localhost:8080`*

---

### Step 3: Start the React Frontend
Open a third terminal:
```bash
# Navigate to frontend
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
*Verify: Open `http://localhost:3000` in your browser.*

---

## 🧪 Testing with Sample Data
The repository includes a dedicated [`Sample Data/`](Sample%20Data/) folder containing 10 calibrated test scenarios (available in both `.xlsx` and `.csv`):

| File | Scenario | Expected Visual Anomaly |
|---|---|---|
| `01_perfect_normal_transfers` | 5 benign peer-to-peer users | All Green (`#00FF66`), 0 threats |
| `02_merchant_payroll_normal` | Corporate payroll distribution | All Green (`#00FF66`), legitimate dispersal |
| `03_circular_triangle_wash` | Triangle loop: A -> B -> C -> A | Crimson Red (`#FF0055`) Wash Trading |
| `04_circular_quad_wash` | 4-node loop: A -> B -> C -> D -> A | Crimson Red (`#FF0055`) Quad Loop |
| `05_peeling_chain_standard` | 5-hop structured balance peel | Crimson Red (`#FF0055`) Peeling Chain |
| `06_peeling_chain_micro` | Micro-residue laundering | Crimson Red (`#FF0055`) Peeling Root |
| `07_fan_in_consolidation` | 10 satellite accounts -> 1 vault | Amber (`#FF9900`) Fan-In Hub |
| `08_fan_out_dispersion` | 1 distributor -> 10 recipients | Amber (`#FF9900`) Fan-Out Hub |
| `09_high_frequency_ping_pong`| Rapid 12-tx back-and-forth bot trades | Electric Cyan (`#00E5FF`) + Pulsing Edge |
| `10_mixed_complex_anomalies` | Combined: normal + cycle + ping-pong | Multi-colored forensic canvas |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
