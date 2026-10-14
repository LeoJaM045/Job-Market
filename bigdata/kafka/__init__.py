"""
bigdata/kafka
=============
Apache Kafka KRaft Streaming components:
- producer.py: Dual-mode producer (Live API polling every 60s & synthetic replay streaming)
- consumer.py: Ingestion consumer group ('spark-ingest') with WebHDFS landing, Bloom Filter spam gate, and DGIM surge tracking
"""
