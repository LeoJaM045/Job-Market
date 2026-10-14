"""
bigdata/hdfs_io.py
==================
HDFS (Hadoop Distributed File System) WebHDFS storage layer interface.
Manages raw JSON ingestion lake, cleaned Parquet tables, batch aggregates,
and saved Spark MLlib PipelineModels with auto-fallback and simulated explorer when offline.
"""

import os
import json
import datetime
from typing import List, Dict, Any, Tuple, Optional
import requests

HDFS_DEFAULT_HOST = os.getenv("HDFS_HOST", "localhost")
HDFS_DEFAULT_PORT = int(os.getenv("HDFS_PORT", "9870"))
HDFS_DEFAULT_URL = os.getenv("HDFS_URL", f"http://{HDFS_DEFAULT_HOST}:{HDFS_DEFAULT_PORT}")
HDFS_USER = os.getenv("HDFS_USER", "hadoop")

# Standard HDFS Layout Paths
HDFS_RAW_DIR = "/jobs/raw"
HDFS_CLEAN_DIR = "/jobs/clean"
HDFS_AGGREGATES_DIR = "/jobs/aggregates"
HDFS_MODELS_DIR = "/models/ctc_rf"


def get_webhdfs_url(path: str = "/", op: str = "LISTSTATUS", url: Optional[str] = None) -> str:
    """Builds standard WebHDFS v1 REST endpoint URL."""
    base = (url or HDFS_DEFAULT_URL).rstrip("/")
    clean_path = path.lstrip("/")
    return f"{base}/webhdfs/v1/{clean_path}?op={op}&user.name={HDFS_USER}"


def check_hdfs_health(url: Optional[str] = None) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Pings WebHDFS to determine if Hadoop NameNode is alive and accessible.
    Returns: (is_healthy, error_msg, metadata)
    """
    base_url = url or HDFS_DEFAULT_URL
    test_endpoint = get_webhdfs_url("/", op="LISTSTATUS", url=base_url)
    try:
        resp = requests.get(test_endpoint, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            return True, None, {
                "status": "connected",
                "namenode_url": base_url,
                "file_count": len(data.get("FileStatuses", {}).get("FileStatus", [])),
                "is_simulated": False
            }
        return False, f"WebHDFS returned HTTP {resp.status_code}", {"status": "error", "is_simulated": True}
    except Exception as exc:
        return False, str(exc), {"status": "offline", "is_simulated": True}


def ensure_hdfs_directories(url: Optional[str] = None) -> bool:
    """Ensures base directory hierarchy exists on HDFS: /jobs/raw, /jobs/clean, /jobs/aggregates, /models/ctc_rf."""
    base_url = url or HDFS_DEFAULT_URL
    target_dirs = [HDFS_RAW_DIR, HDFS_CLEAN_DIR, HDFS_AGGREGATES_DIR, HDFS_MODELS_DIR]
    
    for d in target_dirs:
        endpoint = get_webhdfs_url(d, op="MKDIRS", url=base_url)
        try:
            requests.put(endpoint, timeout=3.0)
        except Exception:
            return False
    return True


def write_raw_posting(job_id: str, raw_payload: Dict[str, Any], dt_str: Optional[str] = None, url: Optional[str] = None) -> bool:
    """
    Lands an unmodified raw job posting JSON payload into HDFS raw lake under:
    /jobs/raw/dt=YYYY-MM-DD/<job_id>.json
    """
    base_url = url or HDFS_DEFAULT_URL
    if not dt_str:
        dt_str = datetime.date.today().strftime("%Y-%m-%d")

    target_path = f"{HDFS_RAW_DIR}/dt={dt_str}/{job_id}.json"
    create_url = get_webhdfs_url(target_path, op="CREATE", url=base_url) + "&overwrite=true"

    try:
        # Step 1: WebHDFS 2-step create: request datanode redirect
        put_init = requests.put(create_url, allow_redirects=False, timeout=3.0)
        if put_init.status_code == 307:
            datanode_location = put_init.headers.get("Location")
            if datanode_location:
                json_bytes = json.dumps(raw_payload, default=str).encode("utf-8")
                put_data = requests.put(datanode_location, data=json_bytes, headers={"Content-Type": "application/json"}, timeout=5.0)
                return put_data.status_code in [200, 201]
        return False
    except Exception as e:
        print(f"[HDFS write_raw_posting] Write failed: {e}")
        return False


def list_hdfs_dir(path: str = "/", url: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Lists files and directories in HDFS ('hdfs dfs -ls' style).
    If HDFS is offline, returns a realistic simulated schema representation
    clearly labelled as 'simulated'.
    """
    base_url = url or HDFS_DEFAULT_URL
    endpoint = get_webhdfs_url(path, op="LISTSTATUS", url=base_url)

    try:
        resp = requests.get(endpoint, timeout=2.5)
        if resp.status_code == 200:
            raw_files = resp.json().get("FileStatuses", {}).get("FileStatus", [])
            results = []
            for item in raw_files:
                name = item.get("pathSuffix", "")
                full_path = f"{path.rstrip('/')}/{name}" if path != "/" else f"/{name}"
                results.append({
                    "path": full_path,
                    "name": name,
                    "type": "DIRECTORY" if item.get("type") == "DIRECTORY" else "FILE",
                    "length": item.get("length", 0),
                    "owner": item.get("owner", "hadoop"),
                    "group": item.get("group", "supergroup"),
                    "permission": item.get("permission", "755"),
                    "replication": item.get("replication", 1),
                    "modificationTime": datetime.datetime.fromtimestamp(item.get("modificationTime", 0) / 1000.0).isoformat(),
                    "is_simulated": False
                })
            return sorted(results, key=lambda x: (x["type"] != "DIRECTORY", x["name"]))
    except Exception:
        pass

    # Simulated Fallback for Local Dev / Cloud Preview without running Hadoop cluster
    return _generate_simulated_hdfs_listing(path)


def read_hdfs_file(path: str, url: Optional[str] = None) -> Optional[str]:
    """Reads a text/JSON file directly from HDFS via WebHDFS OPEN op."""
    base_url = url or HDFS_DEFAULT_URL
    endpoint = get_webhdfs_url(path, op="OPEN", url=base_url)
    try:
        resp = requests.get(endpoint, timeout=4.0)
        if resp.status_code == 200:
            return resp.text
    except Exception:
        pass
    return None


def _generate_simulated_hdfs_listing(path: str) -> List[Dict[str, Any]]:
    """Generates structural simulated HDFS layout when cluster is offline."""
    now_str = datetime.datetime.now().isoformat()
    clean_p = path.rstrip("/")

    if clean_p in ["", "/"]:
        return [
            {"path": "/jobs", "name": "jobs", "type": "DIRECTORY", "length": 0, "owner": "hdfs", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/models", "name": "models", "type": "DIRECTORY", "length": 0, "owner": "hdfs", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p == "/jobs":
        return [
            {"path": "/jobs/raw", "name": "raw", "type": "DIRECTORY", "length": 0, "owner": "hdfs", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean", "name": "clean", "type": "DIRECTORY", "length": 0, "owner": "hdfs", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/aggregates", "name": "aggregates", "type": "DIRECTORY", "length": 0, "owner": "hdfs", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p == "/jobs/raw":
        today = datetime.date.today().strftime("%Y-%m-%d")
        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        return [
            {"path": f"/jobs/raw/dt={today}", "name": f"dt={today}", "type": "DIRECTORY", "length": 0, "owner": "kafka-ingest", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": f"/jobs/raw/dt={yesterday}", "name": f"dt={yesterday}", "type": "DIRECTORY", "length": 0, "owner": "kafka-ingest", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p.startswith("/jobs/raw/dt="):
        return [
            {"path": f"{clean_p}/job_in_blr_1042.json", "name": "job_in_blr_1042.json", "type": "FILE", "length": 3412, "owner": "kafka-ingest", "group": "supergroup", "permission": "644", "replication": 3, "modificationTime": now_str, "is_simulated": True},
            {"path": f"{clean_p}/job_in_hyd_1043.json", "name": "job_in_hyd_1043.json", "type": "FILE", "length": 2980, "owner": "kafka-ingest", "group": "supergroup", "permission": "644", "replication": 3, "modificationTime": now_str, "is_simulated": True},
            {"path": f"{clean_p}/job_in_pun_1044.json", "name": "job_in_pun_1044.json", "type": "FILE", "length": 3120, "owner": "kafka-ingest", "group": "supergroup", "permission": "644", "replication": 3, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p == "/jobs/clean":
        return [
            {"path": "/jobs/clean/city=Bengaluru", "name": "city=Bengaluru", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean/city=Hyderabad", "name": "city=Hyderabad", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean/city=Pune", "name": "city=Pune", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean/city=Mumbai", "name": "city=Mumbai", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean/city=Delhi_NCR", "name": "city=Delhi_NCR", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/clean/city=Chennai", "name": "city=Chennai", "type": "DIRECTORY", "length": 0, "owner": "pyspark", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p == "/jobs/aggregates":
        return [
            {"path": "/jobs/aggregates/city_kpis.parquet", "name": "city_kpis.parquet", "type": "FILE", "length": 142050, "owner": "pyspark", "group": "supergroup", "permission": "644", "replication": 2, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/aggregates/skill_cooccurrence.parquet", "name": "skill_cooccurrence.parquet", "type": "FILE", "length": 284100, "owner": "pyspark", "group": "supergroup", "permission": "644", "replication": 2, "modificationTime": now_str, "is_simulated": True},
            {"path": "/jobs/aggregates/run_metrics.json", "name": "run_metrics.json", "type": "FILE", "length": 1024, "owner": "pyspark", "group": "supergroup", "permission": "644", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    elif clean_p == "/models" or clean_p == "/models/ctc_rf":
        return [
            {"path": "/models/ctc_rf/metadata", "name": "metadata", "type": "DIRECTORY", "length": 0, "owner": "mllib", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
            {"path": "/models/ctc_rf/stages", "name": "stages", "type": "DIRECTORY", "length": 0, "owner": "mllib", "group": "supergroup", "permission": "755", "replication": 1, "modificationTime": now_str, "is_simulated": True},
        ]
    return []
