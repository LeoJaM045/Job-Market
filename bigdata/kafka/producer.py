"""
bigdata/kafka/producer.py
=========================
Kafka Streaming Producer for Indian Tech Job Market.
Dual Ingestion Mode:
1. Live Poll Mode: Polls Arbeitnow & Jobicy REST APIs every 60 seconds, publishing postings with key=job_id.
2. Synthetic Replay Mode (--replay-synthetic): Replays the 3,000-record synthetic Indian IT dataset at
   a configurable rate (e.g., 5-20 records/sec) for offline demos and pipeline testing.
"""

import os
import sys
import time
import json
import argparse
from typing import Optional, Dict, Any

try:
    from kafka import KafkaProducer
    from kafka.errors import NoBrokersAvailable
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False

from database.live_fetcher import fetch_realtime_job_market_data
from database.mock_data import generate_synthetic_job_market_data

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_JOB_POSTINGS = os.getenv("KAFKA_TOPIC_POSTINGS", "job-postings")


def get_kafka_producer(bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS) -> Optional[Any]:
    """Initializes and returns a KafkaProducer instance if brokers are reachable."""
    if not KAFKA_AVAILABLE:
        print("[Kafka Producer] kafka-python library not available.")
        return None

    try:
        producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers.split(","),
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: str(k).encode("utf-8"),
            acks=1,
            retries=3,
            max_block_ms=3000
        )
        print(f"[Kafka Producer] Connected to Kafka brokers at: {bootstrap_servers}")
        return producer
    except NoBrokersAvailable:
        print(f"[Kafka Producer] No brokers available at {bootstrap_servers}. Fallback mode active.")
        return None
    except Exception as e:
        print(f"[Kafka Producer] Connection error: {e}")
        return None


def run_synthetic_replay(
    producer: Optional[Any],
    rate_per_sec: float = 10.0,
    num_records: int = 3000,
    topic: str = TOPIC_JOB_POSTINGS
) -> None:
    """
    Replays the synthetic 3,000-record dataset into Kafka topic at specified throughput.
    """
    print(f"[Kafka Producer] Starting synthetic replay stream: {num_records} records @ {rate_per_sec} msg/sec...")
    df_mock = generate_synthetic_job_market_data(num_records=num_records)
    records = df_mock.to_dict(orient="records")

    delay = 1.0 / max(0.1, rate_per_sec)
    published = 0

    for rec in records:
        job_id = str(rec.get("job_id", f"job-{published}"))
        if producer is not None:
            try:
                future = producer.send(topic, key=job_id, value=rec)
                producer.flush()
                published += 1
            except Exception as e:
                print(f"[Kafka Producer] Publish error on {job_id}: {e}")
        else:
            # Simulated stdout stream output when Kafka broker is offline
            published += 1
            if published % 50 == 0:
                print(f"[Kafka Stream Simulated] Replayed {published}/{num_records} postings to topic '{topic}'.")

        time.sleep(delay)

    print(f"[Kafka Producer] Replay completed: {published} job postings streamed.")


def run_live_poll_loop(
    producer: Optional[Any],
    poll_interval_sec: int = 60,
    topic: str = TOPIC_JOB_POSTINGS
) -> None:
    """
    Polls Arbeitnow and Jobicy REST APIs every 60 seconds and publishes distinct postings.
    """
    print(f"[Kafka Producer] Starting live API polling loop (interval={poll_interval_sec}s, topic={topic})...")
    seen_ids = set()

    while True:
        try:
            print(f"[Kafka Producer] Polling live APIs at {time.strftime('%Y-%m-%d %H:%M:%S')}...")
            df_live = fetch_realtime_job_market_data(limit=100)
            new_records = 0

            for rec in df_live.to_dict(orient="records"):
                job_id = str(rec.get("job_id"))
                if job_id not in seen_ids:
                    seen_ids.add(job_id)
                    new_records += 1
                    if producer is not None:
                        producer.send(topic, key=job_id, value=rec)

            if producer is not None:
                producer.flush()

            print(f"[Kafka Producer] Published {new_records} new live postings (total seen: {len(seen_ids)}).")
        except Exception as e:
            print(f"[Kafka Producer] Poll cycle error: {e}")

        time.sleep(poll_interval_sec)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kafka Streaming Job Producer")
    parser.add_argument("--replay-synthetic", action="store_true", help="Stream synthetic benchmark dataset")
    parser.add_argument("--rate", type=float, default=10.0, help="Messages per second for synthetic replay")
    parser.add_argument("--records", type=int, default=3000, help="Total synthetic records to stream")
    parser.add_argument("--interval", type=int, default=60, help="Polling interval in seconds for live mode")
    parser.add_argument("--broker", type=str, default=KAFKA_BOOTSTRAP_SERVERS, help="Kafka bootstrap broker")

    args = parser.parse_args()
    producer = get_kafka_producer(bootstrap_servers=args.broker)

    if args.replay_synthetic:
        run_synthetic_replay(producer, rate_per_sec=args.rate, num_records=args.records)
    else:
        run_live_poll_loop(producer, poll_interval_sec=args.interval)
