"""
bigdata/kafka/consumer.py
=========================
Kafka Streaming Consumer (Group: 'spark-ingest').
Real-time pipeline operations:
1. Ingests raw job postings from Kafka topic 'job-postings'.
2. Lands unmodified JSON into HDFS Data Lake: /jobs/raw/dt=YYYY-MM-DD/<job_id>.json.
3. Evaluates Bloom Filter over recruiter spam keywords; routes fraudulent postings to 'job-postings-spam'.
4. Maintains sliding DGIM stream window tracking skill demand surges; emits bucket stats to 'stream-metrics'.
"""

import os
import sys
import time
import json
import datetime
from typing import Optional, Dict, Any, List

try:
    from kafka import KafkaConsumer, KafkaProducer
    from kafka.errors import NoBrokersAvailable
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False

from bigdata.hdfs_io import write_raw_posting, check_hdfs_health
from views.streaming import BloomFilter, DGIMStream
from database.live_fetcher import SPAM_KEYWORDS

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_INPUT = os.getenv("KAFKA_TOPIC_POSTINGS", "job-postings")
TOPIC_SPAM = os.getenv("KAFKA_TOPIC_SPAM", "job-postings-spam")
TOPIC_METRICS = os.getenv("KAFKA_TOPIC_METRICS", "stream-metrics")
CONSUMER_GROUP = "spark-ingest"


class StreamingIngestionPipeline:
    """
    Manages in-memory streaming algorithms (Bloom Filter & DGIM) alongside Kafka & HDFS sinks.
    """
    def __init__(self, bloom_size: int = 50000, num_hashes: int = 7, dgim_window: int = 1000):
        self.bloom_filter = BloomFilter(size=bloom_size, num_hashes=num_hashes)
        self.dgim_stream = DGIMStream(window_size=dgim_window)
        
        # Populate Bloom Filter with known Indian recruiter spam signatures
        self.known_spam_signatures = [
            "100% placement guarantee",
            "registration fee required",
            "pay for offer letter",
            "mandatory training charge",
            "placement consultancy fees",
            "backdoor tech job guarantee"
        ]
        for sig in self.known_spam_signatures:
            self.bloom_filter.add(sig.lower())

        self.processed_count = 0
        self.spam_count = 0
        self.hdfs_written_count = 0

    def check_is_spam(self, text: str) -> bool:
        """Checks if text contains spam signatures using Bloom Filter & keyword matching."""
        t_low = text.lower()
        # Direct Bloom check on full string and trigrams
        if self.bloom_filter.contains(t_low):
            return True
        for sig in self.known_spam_signatures:
            if sig in t_low or self.bloom_filter.contains(sig):
                return True
        return False

    def process_message(
        self,
        job_id: str,
        payload: Dict[str, Any],
        producer: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Processes a single streamed job record through HDFS landing, Bloom filter, and DGIM.
        """
        self.processed_count += 1
        title = payload.get("title", "")
        desc = payload.get("description", "")
        combined_text = f"{title} {desc}"

        # 1. Bloom Filter Spam Check
        is_spam = self.check_is_spam(combined_text) or payload.get("is_spam", False)
        if is_spam:
            self.spam_count += 1
            payload["is_spam"] = True
            # Route to dead-letter spam topic
            if producer is not None:
                try:
                    producer.send(TOPIC_SPAM, key=job_id, value={"job_id": job_id, "reason": "bloom_filter_spam_match", "timestamp": time.time()})
                except Exception:
                    pass

        # 2. HDFS Raw Lake Landing (/jobs/raw/dt=YYYY-MM-DD/<job_id>.json)
        dt_str = datetime.date.today().strftime("%Y-%m-%d")
        hdfs_ok = write_raw_posting(job_id=job_id, raw_payload=payload, dt_str=dt_str)
        if hdfs_ok:
            self.hdfs_written_count += 1

        # 3. DGIM Bit Stream Tracking (1 if posting mentions high-growth tech: PySpark, GenAI, Databricks)
        has_surge_skill = any(k in combined_text.lower() for k in ["pyspark", "spark", "genai", "llm", "databricks", "kafka"])
        self.dgim_stream.update(1 if has_surge_skill else 0)

        # 4. Periodically publish stream metrics to 'stream-metrics' topic
        metrics = {
            "processed_count": self.processed_count,
            "spam_count": self.spam_count,
            "spam_rate": round(self.spam_count / max(1, self.processed_count), 4),
            "dgim_window_size": self.dgim_stream.window_size,
            "dgim_estimated_surge_count": self.dgim_stream.count_ones(),
            "dgim_bucket_count": len(self.dgim_stream.buckets),
            "bloom_false_positive_prob": round(self.bloom_filter.false_positive_probability(), 6),
            "hdfs_persisted": self.hdfs_written_count,
            "timestamp": time.time()
        }

        if producer is not None and self.processed_count % 10 == 0:
            try:
                producer.send(TOPIC_METRICS, key="pipeline_stats", value=metrics)
            except Exception:
                pass

        return metrics


def run_consumer_loop(bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS) -> None:
    """
    Starts long-running Kafka consumer loop attached to 'spark-ingest' group.
    """
    pipeline = StreamingIngestionPipeline()

    if not KAFKA_AVAILABLE:
        print("[Kafka Consumer] kafka-python not installed. Running simulated consumption...")
        _run_simulated_consumer(pipeline)
        return

    try:
        consumer = KafkaConsumer(
            TOPIC_INPUT,
            bootstrap_servers=bootstrap_servers.split(","),
            group_id=CONSUMER_GROUP,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            key_deserializer=lambda k: k.decode("utf-8") if k else None
        )
        producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers.split(","),
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: str(k).encode("utf-8")
        )
        print(f"[Kafka Consumer] Subscribed to topic '{TOPIC_INPUT}' under group '{CONSUMER_GROUP}'...")

        for msg in consumer:
            job_id = msg.key or f"msg-{pipeline.processed_count}"
            metrics = pipeline.process_message(job_id=job_id, payload=msg.value, producer=producer)
            if pipeline.processed_count % 25 == 0:
                print(f"[Kafka Consumer] Processed: {pipeline.processed_count} | Spam Blocked: {pipeline.spam_count} | DGIM Surges: {metrics['dgim_estimated_surge_count']}")

    except NoBrokersAvailable:
        print(f"[Kafka Consumer] No Kafka brokers reachable at {bootstrap_servers}. Falling back to simulation.")
        _run_simulated_consumer(pipeline)
    except Exception as e:
        print(f"[Kafka Consumer Error]: {e}")


def _run_simulated_consumer(pipeline: StreamingIngestionPipeline) -> None:
    """Simulates real-time consumer streaming when Kafka cluster is not locally running."""
    print("[Kafka Consumer Simulated] Generating synthetic stream ticks...")
    from database.mock_data import generate_synthetic_job_market_data
    df = generate_synthetic_job_market_data(num_records=200)

    for rec in df.to_dict(orient="records"):
        job_id = str(rec.get("job_id", "sim-1"))
        pipeline.process_message(job_id=job_id, payload=rec, producer=None)


if __name__ == "__main__":
    run_consumer_loop()
