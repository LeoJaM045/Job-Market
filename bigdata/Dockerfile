FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including curl for healthchecks and OpenJDK for local Spark fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV HDFS_URL=http://namenode:9870
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:9094
ENV SPARK_MASTER=spark://spark-master:7077

EXPOSE 8000

CMD ["uvicorn", "bigdata.api:app", "--host", "0.0.0.0", "--port", "8000"]
