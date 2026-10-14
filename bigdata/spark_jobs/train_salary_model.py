"""
bigdata/spark_jobs/train_salary_model.py
========================================
PySpark MLlib Training Pipeline: Indian Tech Salary Bracket Classifier.
- Stages:
  1. StringIndexer for categorical features (city, company_type, experience_level, role)
  2. OneHotEncoderEstimator for indexed categoricals
  3. CountVectorizer for tokenized skills array
  4. VectorAssembler combining encoded categoricals, numericals, and skills vector
  5. RandomForestClassifier (numTrees=50, maxDepth=8, labelCol="label")
- Evaluation: MulticlassClassificationEvaluator (Accuracy & F1 Score)
- Persistence: Saves fitted PipelineModel to HDFS at /models/ctc_rf/
"""

import os
import sys
import time
import json
from typing import Dict, Any

try:
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    from pyspark.ml import Pipeline
    from pyspark.ml.feature import (
        StringIndexer, OneHotEncoder, CountVectorizer, VectorAssembler
    )
    from pyspark.ml.classification import RandomForestClassifier
    from pyspark.ml.evaluation import MulticlassClassificationEvaluator
    PYSPARK_AVAILABLE = True
except ImportError:
    PYSPARK_AVAILABLE = False


def train_salary_model(
    clean_input_path: str = "/jobs/clean",
    model_save_path: str = "/models/ctc_rf",
    test_ratio: float = 0.2
) -> Dict[str, Any]:
    """
    Fits Spark MLlib PipelineModel and serializes model to HDFS / filesystem.
    """
    start_time = time.time()

    if not PYSPARK_AVAILABLE:
        print("[Spark MLlib] PySpark not available; returning simulated model metrics.")
        return {
            "status": "simulated",
            "model_type": "Spark MLlib RandomForestClassifier (Simulated)",
            "accuracy": 0.914,
            "f1_score": 0.912,
            "num_trees": 50,
            "max_depth": 8,
            "model_path": model_save_path,
            "features": ["city", "company_type", "experience_level", "role", "years_experience", "skills_vector"],
            "is_simulated": True
        }

    master = os.getenv("SPARK_MASTER", "local[*]")
    spark = SparkSession.builder \
        .appName("IndianJobMarket-SalaryMLlibTrainer") \
        .master(master) \
        .config("spark.ui.enabled", "false") \
        .getOrCreate()

    try:
        print(f"[Spark MLlib] Loading training data from: {clean_input_path}")
        df = spark.read.parquet(clean_input_path)

        # Map derived_bracket string to numerical label
        df_labeled = df.withColumn(
            "label",
            F.when(F.col("salary_bracket") == "Low (< ₹6 LPA)", 0.0)
             .when(F.col("salary_bracket") == "Medium (₹6 - ₹18 LPA)", 1.0)
             .otherwise(2.0)
        )

        train_data, test_data = df_labeled.randomSplit([1.0 - test_ratio, test_ratio], seed=42)
        print(f"[Spark MLlib] Split complete: {train_data.count()} train, {test_data.count()} test records.")

        # Stage 1: Categorical Indexing
        indexers = [
            StringIndexer(inputCol="city", outputCol="city_idx", handleInvalid="keep"),
            StringIndexer(inputCol="company_type", outputCol="company_idx", handleInvalid="keep"),
            StringIndexer(inputCol="experience_level", outputCol="exp_idx", handleInvalid="keep"),
            StringIndexer(inputCol="role_classified", outputCol="role_idx", handleInvalid="keep")
        ]

        # Stage 2: One-Hot Encoding
        encoder = OneHotEncoder(
            inputCols=["city_idx", "company_idx", "exp_idx", "role_idx"],
            outputCols=["city_vec", "company_vec", "exp_vec", "role_vec"]
        )

        # Stage 3: Skills Array CountVectorizer
        cv = CountVectorizer(inputCol="skills", outputCol="skills_vec", minDF=2.0)

        # Stage 4: Vector Assembler
        assembler = VectorAssembler(
            inputCols=["city_vec", "company_vec", "exp_vec", "role_vec", "years_experience", "skills_vec"],
            outputCol="features",
            handleInvalid="keep"
        )

        # Stage 5: RandomForestClassifier
        rf = RandomForestClassifier(
            labelCol="label",
            featuresCol="features",
            numTrees=50,
            maxDepth=8,
            seed=42
        )

        # Construct Pipeline
        pipeline = Pipeline(stages=[*indexers, encoder, cv, assembler, rf])

        print("[Spark MLlib] Fitting PipelineModel across distributed partitions...")
        model = pipeline.fit(train_data)

        # Evaluate on test set
        predictions = model.transform(test_data)
        evaluator_acc = MulticlassClassificationEvaluator(labelCol="label", metricName="accuracy")
        evaluator_f1 = MulticlassClassificationEvaluator(labelCol="label", metricName="f1")

        accuracy = float(evaluator_acc.evaluate(predictions))
        f1_score = float(evaluator_f1.evaluate(predictions))

        print(f"[Spark MLlib] Evaluation: Accuracy={accuracy:.4f}, F1-Score={f1_score:.4f}")

        # Save PipelineModel to target path
        print(f"[Spark MLlib] Persisting PipelineModel to: {model_save_path}")
        model.write().overwrite().save(model_save_path)

        elapsed = round(time.time() - start_time, 2)
        metrics = {
            "status": "success",
            "model_type": "Spark MLlib PipelineModel (RandomForestClassifier)",
            "accuracy": round(accuracy, 4),
            "f1_score": round(f1_score, 4),
            "num_trees": 50,
            "max_depth": 8,
            "model_path": model_save_path,
            "training_time_sec": elapsed,
            "is_simulated": False
        }
        return metrics

    except Exception as e:
        print(f"[Spark MLlib Training Error]: {e}")
        return {
            "status": "error",
            "error": str(e),
            "is_simulated": True
        }


if __name__ == "__main__":
    train_salary_model()
