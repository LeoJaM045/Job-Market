"""
Indian Job Market Trends & Hiring Intelligence System
=====================================================
Main Application Entry Point (Modular Architecture with Live Real-Time Ingestion).

Architecture Pipeline:
  Real-Time Web Feeds (Arbeitnow & Jobicy APIs) / HDFS (Raw Storage)
  -> PySpark (Cleaning & Skill Tokenization across Indian Tech Hubs)
  -> Kafka/Batch Stream (Bloom Filter Placement Scam Defense + DGIM Surge Spike Detection)
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
from views.reports import render_reports_page
from views.infrastructure import render_infrastructure_page


def main() -> None:
    """Main execution lifecycle and routing handler with real-time API support."""
    # 1. Page Configuration
    st.set_page_config(
        page_title=APP_PAGE_TITLE,
        page_icon=APP_PAGE_ICON,
        layout=APP_LAYOUT,
        initial_sidebar_state="expanded"
    )

    # 2. Inject Enterprise Dark Styling
    st.markdown(CUSTOM_DARK_THEME_CSS, unsafe_allow_html=True)

    # 3. Initialize / Retrieve Data from Serving Layer (Live API / MongoDB / Fallback)
    _, mongo_db, _, _ = get_mongo_connection()

    if "current_source_mode" not in st.session_state:
        st.session_state["current_source_mode"] = "live"

    df_raw = fetch_job_postings(mongo_db, limit=3000, source_mode=st.session_state["current_source_mode"])

    # 4. Render Sidebar Navigation & Global Filters (Indian Hubs, Roles, CTC)
    selected_page, df_filtered, _, new_source_mode = render_sidebar(df_raw)

    # Handle source mode changes
    if new_source_mode != st.session_state["current_source_mode"]:
        st.session_state["current_source_mode"] = new_source_mode
        st.rerun()

    # 5. Route to Target Dashboard View
    if selected_page == "1. Overview & Executive Summary":
        render_overview_page(df_filtered)

    elif selected_page == "2. In-Demand Skills & Co-occurrence":
        render_skills_page(df_filtered)

    elif selected_page == "3. Real-Time Streaming & Spike Analytics":
        render_streaming_page()

    elif selected_page == "4. Salary Insights & ML Bracket Prediction":
        render_salary_ml_page(df_filtered)

    elif selected_page == "5. Intelligence Reports & Export Center":
        render_reports_page(df_filtered)

    elif selected_page == "6. Distributed Big Data Infrastructure (Hadoop/Spark/Kafka)":
        render_infrastructure_page()

    # 6. Global Footer & Pipeline Metadata
    st.markdown("---")
    f_c1, f_c2 = st.columns([3, 1])
    with f_c1:
        st.caption(
            "⚡ **Indian Job Market Trends & Hiring Intelligence System** | "
            "Distributed Big Data Stack: Apache Spark, HDFS, Kafka, MongoDB, Streamlit. "
            f"Active Ingestion Feed: {df_filtered['source_type'].iloc[0] if not df_filtered.empty and 'source_type' in df_filtered.columns else 'Live Stream'}"
        )
    with f_c2:
        st.caption(f"Stream Sync: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")


if __name__ == "__main__":
    main()
