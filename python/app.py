from fastapi import FastAPI, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
from datetime import datetime
from typing import Any
from collections import Counter
import os
import tempfile

from pcap_to_csv import pcap_path_to_rows

# ---------------- APP ----------------
app = FastAPI(
    title="Intrusion Detection System API",
    description="NSL-KDD based ML IDS",
    version="1.0.0"
)

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LOAD MODEL ----------------
model = joblib.load("ids_model.pkl")

if hasattr(model, "feature_names_in_"):
    FEATURE_NAMES = list(model.feature_names_in_)
else:
    FEATURE_NAMES = [
        "duration","protocol_type","service","flag","src_bytes","dst_bytes",
        "land","wrong_fragment","urgent","hot","num_failed_logins","logged_in",
        "num_compromised","root_shell","su_attempted","num_root",
        "num_file_creations","num_shells","num_access_files","num_outbound_cmds",
        "is_host_login","is_guest_login","count","srv_count","serror_rate",
        "srv_serror_rate","rerror_rate","srv_rerror_rate","same_srv_rate",
        "diff_srv_rate","srv_diff_host_rate","dst_host_count","dst_host_srv_count",
        "dst_host_same_srv_rate","dst_host_diff_srv_rate","dst_host_same_src_port_rate",
        "dst_host_srv_diff_host_rate","dst_host_serror_rate","dst_host_srv_serror_rate",
        "dst_host_rerror_rate","dst_host_srv_rerror_rate"
    ]


def normalize_label(label: Any) -> str:
    return str(label).strip().lower()


def build_row_result(prediction: Any, confidence: float | None) -> dict:
    attack_type = normalize_label(prediction)
    is_attack = attack_type != "normal"
    return {
        "attack_type": attack_type,
        "is_attack": is_attack,
        "confidence": round(float(confidence), 4) if confidence is not None else None,
        "confidence_percentage": round(float(confidence) * 100, 2) if confidence is not None else None,
        "status": "SAFE" if attack_type == "normal" else "ALERT",
    }


def run_prediction(data: list) -> dict:
    if not data:
        return {"success": False, "error": "No data provided"}

    df = pd.DataFrame(data)

    for col in FEATURE_NAMES:
        if col not in df.columns:
            df[col] = 0

    df = df[FEATURE_NAMES].fillna(0)

    predictions = model.predict(df)
    has_proba = hasattr(model, "predict_proba")
    probabilities = model.predict_proba(df) if has_proba else None

    results = []
    for i, prediction in enumerate(predictions):
        confidence = probabilities[i].max() if probabilities is not None else None
        results.append(build_row_result(prediction, confidence))

    attack_results = [r for r in results if r["is_attack"]]
    safe_results = [r for r in results if not r["is_attack"]]
    attack_rows = len(attack_results)
    safe_row_count = len(safe_results)

    if attack_results:
        attack_counts = Counter(r["attack_type"] for r in attack_results)
        primary_attack = attack_counts.most_common(1)[0][0]
        matching = [r for r in attack_results if r["attack_type"] == primary_attack]
        best_match = max(matching, key=lambda r: r["confidence"] or 0)
        summary = build_row_result(primary_attack, best_match["confidence"])
    else:
        conf_values = [r["confidence"] for r in safe_results if r["confidence"] is not None]
        avg_confidence = sum(conf_values) / len(conf_values) if conf_values else None
        summary = build_row_result("normal", avg_confidence)

    summary["attacks_detected"] = attack_rows
    summary["safe_rows"] = safe_row_count

    return {
        "success": True,
        "total_rows": len(results),
        "summary": summary,
        "predictions": results,
        "time": str(datetime.now()),
    }


# ---------------- HEALTH CHECK ----------------
@app.get("/health")
def health():
    return {
        "status": "running",
        "model_loaded": model is not None,
        "time": str(datetime.now())
    }


# ---------------- PREDICT ----------------
@app.post("/predict")
def predict(payload: Any = Body(...)):
    try:
        if isinstance(payload, list):
            data = payload
        elif isinstance(payload, dict):
            data = payload.get("data", [])
        else:
            data = []

        return run_prediction(data)

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ---------------- PREDICT PCAP (Wireshark) ----------------
@app.post("/predict-pcap")
async def predict_pcap(
    file: UploadFile = File(...),
    max_packets: int | None = None,
):
    filename = (file.filename or "").lower()
    if not filename.endswith((".pcap", ".pcapng")):
        return {"success": False, "error": "File must be .pcap or .pcapng"}

    suffix = ".pcapng" if filename.endswith(".pcapng") else ".pcap"
    tmp_path = None

    try:
        content = await file.read()
        if not content:
            return {"success": False, "error": "Empty capture file"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        rows = pcap_path_to_rows(tmp_path, max_packets=max_packets)
        result = run_prediction(rows)
        result["source"] = "wireshark"
        result["source_file"] = file.filename
        result["note"] = (
            "Converted from Wireshark capture. Host/rate features are approximate; "
            "use samples/*.csv for exact demo labels."
        )
        return result

    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {
        "message": "IDS API Running",
        "docs": "/docs",
        "endpoints": ["/predict", "/predict-pcap"]
    }
