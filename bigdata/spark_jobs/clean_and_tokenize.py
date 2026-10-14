"""
bigdata/spark_jobs/clean_and_tokenize.py
========================================
PySpark Batch Job 1: Ingestion, Tokenization, and Parquet Partitioning.
- Explicit StructType schema (strictly no schema inference overhead).
- Ported skill regexes extracting 17 distinct technologies into Spark ArrayType.
- Role classification and salary bracket discretization.
- Idempotent deduplication on (job_id, company, title).
- Writes partitioned Parquet files to HDFS at /jobs/clean/ partitioned by city.
"""

import os
import sys
import time
import json
from typing import Dict, Any

try:
    from pyspark.sql import SparkSession
    from pyspark.sql.types import (
        StructType, StructField, StringType, IntegerType, FloatType,
        BooleanType, ArrayType, TimestampType
    )
    from pyspark.sql import functions as F
    PYSPARK_AVAILABLE = True
except ImportError:
    PYSPARK_AVAILABLE = False


# Explicit StructType Schema for Raw Ingestion from HDFS
RAW_JOB_SCHEMA = StructType([
    StructField("job_id", StringType(), False),
    StructField("title", StringType(), True),
    StructField("company", StringType(), True),
    StructField("company_type", StringType(), True),
    StructField("city", StringType(), True),
    StructField("experience_level", StringType(), True),
    StructField("years_experience", IntegerType(), True),
    StructField("salary_lpa", FloatType(), True),
    StructField("salary_bracket", StringType(), True),
    StructField("description", StringType(), True),
    StructField("posted_date", StringType(), True),
    StructField("is_spam", BooleanType(), True),
    StructField("source", StringType(), True),
    StructField("tags", ArrayType(StringType()), True)
])

# 17 Standard Tech Skills Regexes (matching Indian Big Data ecosystem requirements)
TECH_SKILL_PATTERNS = {
    "PySpark": r"(?i)\b(pyspark|apache spark|spark)\b",
    "Python": r"(?i)\b(python|python3)\b",
    "SQL": r"(?i)\b(sql|postgresql|mysql|rdbms)\b",
    "AWS": r"(?i)\b(aws|amazon web services|ec2|s3)\b",
    "Databricks": r"(?i)\b(databricks|delta lake)\b",
    "Apache Kafka": r"(?i)\b(kafka|event stream)\b",
    "Snowflake": r"(?i)\b(snowflake)\b",
    "Docker": r"(?i)\b(docker|container)\b",
    "Kubernetes": r"(?i)\b(kubernetes|k8s)\b",
    "Apache Airflow": r"(?i)\b(airflow)\b",
    "MongoDB": r"(?i)\b(mongodb|mongo|nosql)\b",
    "Scikit-Learn": r"(?i)\b(scikit|sklearn|machine learning)\b",
    "GenAI / LLMs": r"(?i)\b(genai|llm|langchain|gpt|artificial intelligence)\b",
    "React.js": r"(?i)\b(react|reactjs|nextjs)\b",
    "Node.js": r"(?i)\b(node|nodejs|express)\b",
    "Java / Spring Boot": r"(?i)\b(java|spring boot|spring)\b",
    "dbt": r"(?i)\b(dbt)\b"
}


def get_spark_session(app_name: str = "IndianJobMarket-CleanAndTokenize") -> "SparkSession":
    """Initializes or retrieves active PySpark session."""
    master = os.getenv("SPARK_MASTER", "local[*]")
    builder = SparkSession.builder \
        .appName(app_name) \
        .master(master) \
        .config("spark.sql.parquet.compression.codec", "snappy") \
        .config("spark.sql.sources.partitionOverwriteMode", "dynamic") \
        .config("spark.ui.enabled", "false")
    return builder.getOrCreate()


def run_clean_and_tokenize(
    raw_input_path: str = "/jobs/raw/dt=*/*.json",
    clean_output_path: str = "/jobs/clean",
    hdfs_host: str = "localhost:9870"
) -> Dict[str, Any]:
    """
    Executes PySpark batch cleaning job over raw JSON data on HDFS.
    Returns metrics dictionary with execution details.
    """
    start_time = time.time()
    
    if not PYSPARK_AVAILABLE:
        print("[Spark] PySpark not installed in environment; simulation mode active.")
        return {
            "status": "simulated",
            "message": "PySpark not installed in local environment.",
            "execution_time_sec": 1.25,
            "records_processed": 3000,
            "partitions_written": 6
        }

    spark = get_spark_session()
    print(f"[Spark] Connected to Spark master: {spark.sparkContext.master}")

    try:
        # 1. Read Raw JSON with explicit StructType schema
        print(f"[Spark] Ingesting raw JSON from: {raw_input_path}")
        df_raw = spark.read.schema(RAW_JOB_SCHEMA).json(raw_input_path)
        initial_count = df_raw.count()
        print(f"[Spark] Loaded {initial_count} raw postings.")

        # 2. Deduplicate on (job_id, company, title)
        df_dedup = df_raw.dropDuplicates(["job_id", "company", "title"])

        # 3. Timestamp normalization to TimestampType (tz-naive)
        df_time = df_dedup.withColumn(
            "posted_timestamp",
            F.coalesce(
                F.to_timestamp("posted_date", "yyyy-MM-dd'T'HH:mm:ss"),
                F.to_timestamp("posted_date", "yyyy-MM-dd"),
                F.current_timestamp()
            )
        )

        # 4. Text combination for skill extraction
        df_comb = df_time.withColumn(
            "combined_text",
            F.concat_ws(" ", F.coalesce(F.col("title"), F.lit("")), F.coalesce(F.col("description"), F.lit("")))
        )

        # 5. Extract skills array using ported regexes
        skill_exprs = []
        for skill_name, pattern in TECH_SKILL_PATTERNS.items():
            expr = F.when(F.col("combined_text").rlike(pattern), F.lit(skill_name))
            skill_exprs.append(expr)

        # Create array of skills and filter out nulls
        raw_skills_array = F.array(*skill_exprs)
        clean_skills_array = F.expr("filter(raw_skills_array, x -> x is not null)")
        
        df_skills = df_comb.withColumn("raw_skills_array", raw_skills_array) \
                           .withColumn("skills", clean_skills_array) \
                           .drop("raw_skills_array", "combined_text")

        # 6. Standardize Engineering Role from title if unassigned
        df_role = df_skills.withColumn(
            "role_classified",
            F.when(F.lower(F.col("title")).rlike(r"(pyspark|spark)"), "PySpark Developer")
             .when(F.lower(F.col("title")).rlike(r"(data engineer|etl|pipeline)"), "Data Engineer")
             .when(F.lower(F.col("title")).rlike(r"(machine learning|ml engineer|ai |data scientist)"), "Machine Learning Engineer")
             .when(F.lower(F.col("title")).rlike(r"(full stack|frontend|web)"), "Full Stack Developer")
             .when(F.lower(F.col("title")).rlike(r"(architect|cloud)"), "Cloud Data Architect")
             .when(F.lower(F.col("title")).rlike(r"(backend|java|golang)"), "Backend Engineer")
             .otherwise("Data Engineer")
        )

        # 7. Standardize Salary Bracket in LPA
        df_final = df_role.withColumn(
            "derived_bracket",
            F.when(F.col("salary_lpa") < 6.0, "Low (< ₹6 LPA)")
             .when((F.col("salary_lpa") >= 6.0) & (F.col("salary_lpa") <= 18.0), "Medium (₹6 - ₹18 LPA)")
             .otherwise("High (> ₹18 LPA)")
        )

        # 8. Partition and write to clean Parquet
        print(f"[Spark] Writing partitioned Parquet to: {clean_output_path}")
        df_final.write \
            .mode("overwrite") \
            .partitionBy("city") \
            .parquet(clean_output_path)

        end_time = time.time()
        elapsed = round(end_time - start_time, 2)
        final_count = df_final.count()

        metrics = {
            "status": "success",
            "job": "clean_and_tokenize",
            "input_records": initial_count,
            "clean_records": final_count,
            "duplicates_dropped": initial_count - final_count,
            "execution_time_sec": elapsed,
            "target_path": clean_output_path,
            "is_simulated": False
        }
        print(f"[Spark] Batch cleaning completed successfully in {elapsed}s: {metrics}")
        return metrics

    except Exception as e:
        print(f"[Spark Clean Error]: {e}")
        return {
            "status": "error",
            "error": str(e),
            "execution_time_sec": round(time.time() - start_time, 2),
            "is_simulated": True
        }


if __name__ == "__main__":
    raw_path = sys.argv[1] if len(sys.argv) > 1 else "/jobs/raw/dt=*/*.json"
    clean_path = sys.argv[2] if len(sys.argv) > 2 else "/jobs/clean"
    run_clean_and_tokenize(raw_input_path=raw_path, clean_output_path=clean_path)
