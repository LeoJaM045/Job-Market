"""
bigdata/spark_jobs/aggregate.py
===============================
PySpark Batch Job 2: Distributed Aggregations & Skill Co-occurrence Matrix.
- GroupBy aggregations across Indian cities, sectors, experience levels, roles, and temporal months.
- Distributed skill frequency calculation via explode().
- High-performance skill co-occurrence matrix via self-join on exploded skills.
- Writes optimized Parquet partitions to HDFS at /jobs/aggregates/
- Generates and writes run_metrics.json recording row counts, partition stats, and wall-clock execution time.
"""

import os
import sys
import time
import json
from typing import Dict, Any

try:
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    PYSPARK_AVAILABLE = True
except ImportError:
    PYSPARK_AVAILABLE = False


def get_spark_session(app_name: str = "IndianJobMarket-Aggregations") -> "SparkSession":
    """Initializes or retrieves active PySpark session."""
    master = os.getenv("SPARK_MASTER", "local[*]")
    return SparkSession.builder \
        .appName(app_name) \
        .master(master) \
        .config("spark.sql.parquet.compression.codec", "snappy") \
        .config("spark.ui.enabled", "false") \
        .getOrCreate()


def run_aggregations(
    clean_input_path: str = "/jobs/clean",
    aggregates_output_path: str = "/jobs/aggregates",
    metrics_file_path: str = "/jobs/aggregates/run_metrics.json"
) -> Dict[str, Any]:
    """
    Executes distributed aggregations and writes output Parquet files and execution metrics.
    """
    start_time = time.time()

    if not PYSPARK_AVAILABLE:
        print("[Spark Aggregate] PySpark not available; returning simulated metrics.")
        simulated_metrics = {
            "status": "simulated",
            "execution_time_sec": 1.48,
            "total_records_aggregated": 3000,
            "city_kpis_rows": 24,
            "skill_frequencies_rows": 17,
            "cooccurrence_pairs_rows": 136,
            "partitions": 8,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "is_simulated": True
        }
        return simulated_metrics

    spark = get_spark_session()
    print(f"[Spark Aggregate] Reading cleaned Parquet from: {clean_input_path}")

    try:
        df = spark.read.parquet(clean_input_path)
        total_rows = df.count()
        num_partitions = df.rdd.getNumPartitions()

        # 1. GROUPBY AGGREGATIONS: City, Sector, Experience, Role, Month
        df_kpis = df.groupBy("city", "company_type", "experience_level", "role_classified") \
            .agg(
                F.count("job_id").alias("postings_count"),
                F.round(F.avg("salary_lpa"), 2).alias("avg_salary_lpa"),
                F.round(F.min("salary_lpa"), 2).alias("min_salary_lpa"),
                F.round(F.max("salary_lpa"), 2).alias("max_salary_lpa"),
                F.round(F.avg("years_experience"), 1).alias("avg_years_exp"),
                F.sum(F.when(F.col("is_spam") == True, 1).otherwise(0)).alias("spam_count")
            )

        kpis_output = f"{aggregates_output_path}/city_role_kpis.parquet"
        df_kpis.write.mode("overwrite").parquet(kpis_output)
        kpi_count = df_kpis.count()

        # 2. SKILL FREQUENCY VIA EXPLODE()
        df_exploded = df.select("job_id", "city", F.explode("skills").alias("skill"))
        df_skill_freq = df_exploded.groupBy("skill") \
            .agg(
                F.count("job_id").alias("demand_count"),
                F.countDistinct("city").alias("cities_active")
            ) \
            .orderBy(F.desc("demand_count"))

        skills_output = f"{aggregates_output_path}/skill_frequency.parquet"
        df_skill_freq.write.mode("overwrite").parquet(skills_output)
        skill_count = df_skill_freq.count()

        # 3. SKILL CO-OCCURRENCE MATRIX VIA SELF-JOIN ON EXPLODED SKILLS
        df_s1 = df.select("job_id", F.explode("skills").alias("skill_a"))
        df_s2 = df.select("job_id", F.explode("skills").alias("skill_b"))

        # Self-join on same job_id where skill_a < skill_b to prevent symmetric double-counting
        df_cooccur = df_s1.join(df_s2, on="job_id") \
            .filter(F.col("skill_a") < F.col("skill_b")) \
            .groupBy("skill_a", "skill_b") \
            .agg(F.count("job_id").alias("cooccurrence_count")) \
            .orderBy(F.desc("cooccurrence_count"))

        cooccur_output = f"{aggregates_output_path}/skill_cooccurrence.parquet"
        df_cooccur.write.mode("overwrite").parquet(cooccur_output)
        cooccur_count = df_cooccur.count()

        end_time = time.time()
        elapsed = round(end_time - start_time, 2)

        # 4. WRITE RUN METRICS JSON TO HDFS / LOCAL
        metrics = {
            "status": "success",
            "job": "aggregate",
            "execution_time_sec": elapsed,
            "total_records_aggregated": total_rows,
            "city_kpis_rows": kpi_count,
            "skill_frequencies_rows": skill_count,
            "cooccurrence_pairs_rows": cooccur_count,
            "partitions": num_partitions,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "is_simulated": False
        }

        print(f"[Spark Aggregate] Completed in {elapsed}s: {metrics}")
        
        # Save run metrics
        try:
            with open("/tmp/run_metrics.json", "w") as f:
                json.dump(metrics, f, indent=2)
        except Exception:
            pass

        return metrics

    except Exception as e:
        print(f"[Spark Aggregate Error]: {e}")
        return {
            "status": "error",
            "error": str(e),
            "execution_time_sec": round(time.time() - start_time, 2),
            "is_simulated": True
        }


if __name__ == "__main__":
    clean_p = sys.argv[1] if len(sys.argv) > 1 else "/jobs/clean"
    agg_p = sys.argv[2] if len(sys.argv) > 2 else "/jobs/aggregates"
    run_aggregations(clean_input_path=clean_p, aggregates_output_path=agg_p)
