"""
database/bigdata_client.py
==========================
Client adapter for the Big Data Analytics Infrastructure (HDFS, Kafka, PySpark, and Spark MLlib).
Connects to the FastAPI Big Data Bridge (http://localhost:8000) with automatic service probing
and seamless fallback to local Python/pandas/scikit-learn processing when containers are offline.
"""

import os
import requests
from typing import Dict, Any, List, Optional
import streamlit as st

from bigdata.hdfs_io import check_hdfs_health, list_hdfs_dir
from bigdata.ml_service import salary_engine

BIGDATA_API_URL = os.getenv("BIGDATA_API_URL", "http://localhost:8000")


@st.cache_data(ttl=5.0, show_spinner=False)
def probe_bigdata_services(api_url: str = BIGDATA_API_URL) -> Dict[str, Any]:
    """
    Probes the Big Data stack health via the FastAPI bridge or direct service checks.
    Returns status dictionary with badges.
    """
    try:
        resp = requests.get(f"{api_url}/health", timeout=1.2)
        if resp.status_code == 200:
            return resp.json().get("services", {})
    except Exception:
        pass

    # Direct fallback probing if bridge container is offline
    hdfs_ok, _, _ = check_hdfs_health()
    mllib_loaded = salary_engine.is_mllib_loaded

    return {
        "hdfs": {
            "name": "Hadoop WebHDFS",
            "endpoint": os.getenv("HDFS_URL", "http://localhost:9870"),
            "status": "connected" if hdfs_ok else "offline",
            "badge": "Connected" if hdfs_ok else "Offline (Simulated)",
            "is_simulated": not hdfs_ok
        },
        "kafka": {
            "name": "Apache Kafka (KRaft)",
            "broker": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
            "status": "idle_simulated",
            "badge": "Idle (Simulated)",
            "is_simulated": True
        },
        "spark": {
            "name": "Apache Spark Batch",
            "master": os.getenv("SPARK_MASTER", "local[*]"),
            "status": "pandas_fallback",
            "badge": "Pandas Fallback",
            "is_simulated": True
        },
        "mllib": {
            "name": "Spark MLlib Model",
            "status": "deployed_mllib" if mllib_loaded else "sklearn_fallback",
            "badge": (
                "Deployed (Spark MLlib)"
                if mllib_loaded else
                "Scikit-Learn Fallback"
            ),
            "is_simulated": not mllib_loaded
        }
    }


def get_hdfs_listing(path: str = "/") -> List[Dict[str, Any]]:
    """
    Fetches HDFS directory listing through FastAPI bridge or direct WebHDFS / simulated explorer.
    """
    try:
        resp = requests.get(f"{BIGDATA_API_URL}/hdfs/ls", params={"path": path}, timeout=2.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass

    return list_hdfs_dir(path=path)


def predict_salary_unified(
    role: str,
    experience_level: str,
    years_experience: float,
    city: str,
    company_type: str,
    skills: List[str]
) -> Dict[str, Any]:
    """
    Executes salary prediction via FastAPI bridge or local inference engine.
    """
    payload = {
        "role": role,
        "experience_level": experience_level,
        "years_experience": years_experience,
        "city": city,
        "company_type": company_type,
        "skills": skills
    }

    try:
        resp = requests.post(f"{BIGDATA_API_URL}/predict_salary", json=payload, timeout=2.0)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass

    # Direct local execution
    return salary_engine.predict(
        role=role,
        experience_level=experience_level,
        years_experience=years_experience,
        city=city,
        company_type=company_type,
        skills=skills
    )
