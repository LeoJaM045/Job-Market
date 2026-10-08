"""
database/mongo_client.py
========================
PyMongo connection pooling, health checks, and document retrieval logic with graceful fallbacks.
Optimized for the Indian Tech Ecosystem dataset in MongoDB.
"""

from typing import Tuple, Optional, Any
import streamlit as st
import pandas as pd

from config.settings import (
    MONGO_DEFAULT_URI,
    MONGO_DATABASE_NAME,
    MONGO_TIMEOUT_MS,
    COLLECTION_POSTINGS
)
from database.mock_data import generate_synthetic_job_market_data

try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False


@st.cache_resource(show_spinner=False)
def get_mongo_connection(
    uri: str = MONGO_DEFAULT_URI,
    db_name: str = MONGO_DATABASE_NAME
) -> Tuple[Optional[Any], Optional[Any], bool, Optional[str]]:
    """
    Initializes and caches a PyMongo MongoClient instance.

    Returns:
        (client, database, is_connected, error_message)
    """
    if not PYMONGO_AVAILABLE:
        return None, None, False, "PyMongo library is not installed in the current environment."

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=MONGO_TIMEOUT_MS)
        client.admin.command("ping")
        db = client[db_name]
        return client, db, True, None
    except (ServerSelectionTimeoutError, ConnectionFailure, Exception) as e:
        return None, None, False, str(e)


def fetch_job_postings(
    db: Optional[Any],
    limit: int = 3000
) -> pd.DataFrame:
    """
    Retrieves Indian job postings from MongoDB or falls back to synthetic Indian IT data.
    """
    if db is not None:
        try:
            collection = db[COLLECTION_POSTINGS]
            docs = list(collection.find({}, {"_id": 0}).limit(limit))
            if docs:
                df = pd.DataFrame(docs)
                if "posted_date" in df.columns:
                    df["posted_date"] = pd.to_datetime(df["posted_date"])
                return df
        except Exception:
            pass

    return generate_synthetic_job_market_data(num_records=limit)


def save_job_postings_to_mongo(
    db: Optional[Any],
    df: pd.DataFrame
) -> Tuple[bool, str]:
    """
    Saves dataframe records into MongoDB collection.
    """
    if db is None:
        return False, "MongoDB instance is offline."

    try:
        collection = db[COLLECTION_POSTINGS]
        records = df.to_dict(orient="records")
        for r in records:
            if isinstance(r.get("posted_date"), (pd.Timestamp, )):
                r["posted_date"] = r["posted_date"].to_pydatetime()
        collection.delete_many({})
        collection.insert_many(records)
        return True, f"Successfully committed {len(records)} records to collection."
    except Exception as e:
        return False, str(e)
