"""
database/mock_data.py
=====================
High-fidelity synthetic benchmark dataset generator tailored for the Indian Tech Ecosystem.
Generates realistic distributions across Tier-1 tech hubs, IT Services, GCCs, Unicorns,
and compensation metrics expressed in Indian Rupees Lakhs Per Annum (INR ₹ LPA).
"""

import datetime
from typing import List, Dict, Any
import numpy as np
import pandas as pd
import streamlit as st

from config.settings import (
    INDIAN_TECH_HUBS,
    COMPANY_TYPES,
    EXPERIENCE_TIERS,
    SALARY_BRACKETS
)

ALL_ROLES = [
    "Data Engineer",
    "PySpark Developer",
    "Machine Learning Engineer",
    "Full Stack Developer",
    "Cloud Data Architect",
    "Backend Engineer (Java/Go)",
    "Analytics Engineer"
]

ALL_SKILLS = [
    "PySpark", "Python", "SQL", "AWS", "Databricks", "Apache Kafka", "Snowflake",
    "Docker", "Kubernetes", "Apache Airflow", "MongoDB", "Apache Spark",
    "Scikit-Learn", "GenAI / LLMs", "React.js", "Node.js", "Java / Spring Boot", "dbt"
]

COMPANIES_BY_TYPE = {
    "Product Unicorns (Flipkart, Swiggy, Razorpay)": [
        "Flipkart", "Swiggy", "Razorpay", "Zomato", "PhonePe", "CRED", "Meesho", "BrowserStack"
    ],
    "Global Capability Centres (GCCs)": [
        "Walmart Global Tech India", "Target Tech Bengaluru", "Wells Fargo Tech India",
        "JPMorgan Chase India", "Goldman Sachs India", "Lowe's India"
    ],
    "IT Services (TCS, Infosys, Wipro)": [
        "TCS", "Infosys", "Wipro", "Cognizant India", "HCLTech", "LTIMindtree"
    ],
    "Seed / Series-A Startups": [
        "Zepto", "Postman", "Hasura", "Sarvam AI", "Krutrim", "InVideo"
    ]
}


@st.cache_data(show_spinner=False)
def generate_synthetic_job_market_data(num_records: int = 3000) -> pd.DataFrame:
    """
    Generates synthetic Indian IT benchmark records mirroring PySpark cleaned HDFS tables.

    Returns:
        pd.DataFrame containing Indian requisition metadata with compensation in ₹ LPA.
    """
    np.random.seed(42)

    role_weights = [0.25, 0.18, 0.15, 0.16, 0.10, 0.10, 0.06]
    city_weights = [0.35, 0.15, 0.20, 0.12, 0.10, 0.08]  # Bengaluru, Mumbai, Hyd, Pune, Delhi NCR, Chennai
    company_type_weights = [0.25, 0.30, 0.32, 0.13]
    exp_weights = [0.22, 0.38, 0.28, 0.12]

    # City multiplier on LPA
    city_multipliers = {
        "Bengaluru": 1.18,
        "Mumbai": 1.14,
        "Hyderabad": 1.05,
        "Delhi NCR (Gurgaon/Noida)": 1.08,
        "Pune": 0.98,
        "Chennai": 0.94
    }

    # Company type multipliers on LPA
    company_multipliers = {
        "Product Unicorns (Flipkart, Swiggy, Razorpay)": 1.45,
        "Global Capability Centres (GCCs)": 1.35,
        "IT Services (TCS, Infosys, Wipro)": 0.78,
        "Seed / Series-A Startups": 1.15
    }

    # Base LPA compensation by experience tier
    base_lpa_ranges = {
        "Fresher (0-2 yrs)": (3.6, 9.5),
        "Mid-Level (2-5 yrs)": (8.5, 18.0),
        "Senior (5-8 yrs)": (18.5, 32.0),
        "Lead / Principal (8+ yrs)": (32.0, 58.0)
    }

    role_skill_affinities: Dict[str, List[str]] = {
        "Data Engineer": ["PySpark", "SQL", "Python", "Apache Airflow", "AWS", "Snowflake", "Docker", "Apache Kafka"],
        "PySpark Developer": ["PySpark", "Apache Spark", "Python", "Databricks", "SQL", "AWS", "Apache Kafka", "Snowflake"],
        "Machine Learning Engineer": ["Python", "GenAI / LLMs", "PySpark", "Docker", "Scikit-Learn", "Kubernetes", "AWS"],
        "Full Stack Developer": ["React.js", "Node.js", "MongoDB", "Python", "Docker", "AWS", "SQL"],
        "Cloud Data Architect": ["AWS", "PySpark", "Apache Kafka", "Kubernetes", "Snowflake", "Databricks", "dbt"],
        "Backend Engineer (Java/Go)": ["Java / Spring Boot", "Apache Kafka", "Docker", "Kubernetes", "SQL", "AWS"],
        "Analytics Engineer": ["SQL", "dbt", "Snowflake", "Python", "Databricks", "Apache Airflow"]
    }

    records: List[Dict[str, Any]] = []
    start_date = datetime.date(2026, 1, 1)

    # Fraudulent placement consultancy signatures commonly filtered by Bloom Filter
    spam_consultancy_signatures = [
        f"CONS-FAKE-PLACEMENT-{i:03d}" for i in range(1, 40)
    ] + [f"SCAM-JOB-CONSULTANCY-{i:03d}" for i in range(1, 30)]

    for i in range(num_records):
        job_id = f"IND-JOB-{100000 + i}"
        role = np.random.choice(ALL_ROLES, p=role_weights)
        city = np.random.choice(INDIAN_TECH_HUBS, p=city_weights)
        comp_type = np.random.choice(COMPANY_TYPES, p=company_type_weights)
        company = np.random.choice(COMPANIES_BY_TYPE[comp_type])
        exp_tier = np.random.choice(EXPERIENCE_TIERS, p=exp_weights)

        # Years of experience calculation
        if exp_tier == "Fresher (0-2 yrs)":
            years = int(np.random.randint(0, 3))
        elif exp_tier == "Mid-Level (2-5 yrs)":
            years = int(np.random.randint(2, 6))
        elif exp_tier == "Senior (5-8 yrs)":
            years = int(np.random.randint(5, 9))
        else:
            years = int(np.random.randint(8, 17))

        # Skill sampling
        primary_pool = role_skill_affinities.get(role, ALL_SKILLS[:6])
        n_skills = int(np.random.randint(4, 9))
        sampled_primary = list(np.random.choice(primary_pool, size=min(n_skills - 1, len(primary_pool)), replace=False))
        remaining_pool = [s for s in ALL_SKILLS if s not in sampled_primary]
        sampled_secondary = list(np.random.choice(remaining_pool, size=n_skills - len(sampled_primary), replace=False))
        job_skills = list(set(sampled_primary + sampled_secondary))

        # Calculate Salary in LPA (Lakhs Per Annum)
        min_lpa, max_lpa = base_lpa_ranges[exp_tier]
        raw_lpa = np.random.uniform(min_lpa, max_lpa)
        city_f = city_multipliers[city]
        comp_f = company_multipliers[comp_type]
        pyspark_boost = 1.08 if "PySpark" in job_skills else 1.0
        genai_boost = 1.12 if "GenAI / LLMs" in job_skills else 1.0

        final_lpa = round(raw_lpa * city_f * comp_f * pyspark_boost * genai_boost, 1)

        # Indian Salary Bracket Mapping
        if final_lpa < 6.0:
            salary_bracket = "Low (< ₹6 LPA)"
        elif final_lpa <= 18.0:
            salary_bracket = "Medium (₹6 - ₹18 LPA)"
        else:
            salary_bracket = "High (> ₹18 LPA)"

        # Date & Spam Consultancy Flag (simulating Bloom Filter detection)
        random_day_offset = int(np.random.randint(0, 90))
        posted_date = start_date + datetime.timedelta(days=random_day_offset)

        # 16% fake consultancy scam rate on Indian job aggregators
        is_spam_ground_truth = bool(np.random.rand() < 0.16)
        if is_spam_ground_truth:
            recruiter_id = np.random.choice(spam_consultancy_signatures)
        else:
            recruiter_id = f"REC-{company[:4].upper()}-{(i % 250):04d}"

        records.append({
            "job_id": job_id,
            "role": role,
            "city": city,
            "company_type": comp_type,
            "company": company,
            "experience_level": exp_tier,
            "years_experience": years,
            "skills": job_skills,
            "skills_str": ", ".join(job_skills),
            "salary_lpa": final_lpa,
            "salary_bracket": salary_bracket,
            "posted_date": pd.to_datetime(posted_date),
            "is_spam": is_spam_ground_truth,
            "recruiter_id": recruiter_id
        })

    df = pd.DataFrame(records)
    df["posted_date"] = pd.to_datetime(df["posted_date"], utc=True).dt.tz_localize(None)
    return df
