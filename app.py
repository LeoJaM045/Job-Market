"""
Indian Job Market Trends & Hiring Intelligence System
=====================================================
Main Application Entry Point (Modular Architecture).

Architecture Pipeline:
  HDFS (Raw Storage) -> PySpark (Cleaning & Aggregation across Indian Tech Hubs)
  -> Kafka/Batch Stream (Bloom Filter Placement Scam Detection + DGIM Skill Spike Detection)
  -> Spark MLlib (Indian CTC Bracket Classification in ₹ LPA)
  -> MongoDB (Serving Layer: 'indian_job_intelligence_db')
  -> Streamlit (Presentation & Analytics Console)

Authors: Big Data Architecture & Engineering Team (India Specialism)
"""

import datetime
import streamlit as st

from config.settings import (
    APP_PAGE_TITLE,
    APP_PAGE_ICON,
    APP_LAYOUT,
    CUSTOM_DARK_THEME_CSS
)
from database.mongo_client import get_mongo_connection, fetch_job_postings
from components.sidebar import render_sidebar
from views.overview import render_overview_page
from views.skills import render_skills_page
from views.streaming import render_streaming_page
from views.salary_ml import render_salary_ml_page


def main() -> None:
    """Main execution lifecycle and routing handler for the Indian Tech Ecosystem."""
    # 1. Page Configuration
    st.set_page_config(
        page_title=APP_PAGE_TITLE,
        page_icon=APP_PAGE_ICON,
        layout=APP_LAYOUT,
        initial_sidebar_state="expanded"
    )

    # 2. Inject Enterprise Dark Styling
    st.markdown(CUSTOM_DARK_THEME_CSS, unsafe_allow_html=True)

    # 3. Initialize / Retrieve Data from Serving Layer (MongoDB / Synthetic Fallback)
    _, mongo_db, _, _ = get_mongo_connection()
    df_raw = fetch_job_postings(mongo_db, limit=3000)

    # 4. Render Sidebar Navigation & Global Filters (Indian Hubs, Roles, CTC)
    selected_page, df_filtered, _ = render_sidebar(df_raw)

    # 5. Route to Target Dashboard View
    if selected_page == "1. Overview & Executive Summary":
        render_overview_page(df_filtered)

    elif selected_page == "2. In-Demand Skills & Co-occurrence":
        render_skills_page(df_filtered)

    elif selected_page == "3. Real-Time Streaming & Spike Analytics":
        render_streaming_page()

    elif selected_page == "4. Salary Insights & ML Bracket Prediction":
        render_salary_ml_page(df_filtered)

    # 6. Global Footer & Pipeline Metadata
    st.markdown("---")
    f_c1, f_c2 = st.columns([3, 1])
    with f_c1:
        st.caption(
            "⚡ **Indian Job Market Trends & Hiring Intelligence System** | "
            "Distributed Big Data Stack: Apache Spark, HDFS, Kafka, MongoDB, Streamlit. "
            "Tech Hubs: Bengaluru · Mumbai · Hyderabad · Pune · Delhi NCR · Chennai."
        )
    with f_c2:
        st.caption(f"Engine Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")


if __name__ == "__main__":
    main()
