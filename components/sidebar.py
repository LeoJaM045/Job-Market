"""
components/sidebar.py
=====================
Shared sidebar navigation, live real-time ingestion controls, MongoDB cluster status,
and Indian IT ecosystem filters.
"""

from typing import Tuple, Any, Optional
import datetime
import streamlit as st
import pandas as pd
from database.mongo_client import get_mongo_connection
from config.settings import COMPANY_TYPES, EXPERIENCE_TIERS, INDIAN_TECH_HUBS


def render_sidebar(df_raw: pd.DataFrame) -> Tuple[str, pd.DataFrame, Optional[Any], str]:
    """
    Renders the navigation menu, live data ingestion controls, and global filters.

    Returns:
        (selected_page, filtered_df, mongo_db_instance, selected_source_mode)
    """
    with st.sidebar:
        st.markdown("## ⚡ Indian Tech Hiring")
        st.markdown(
            "<span class='india-pill'>India IT Hubs</span>"
            "<span class='tech-pill'>Live Web Stream</span>"
            "<span class='tech-pill'>PySpark</span>",
            unsafe_allow_html=True
        )
        st.markdown("---")

        # 1. Navigation Menu
        selected_page = st.radio(
            "Navigation Module",
            [
                "1. Overview & Executive Summary",
                "2. In-Demand Skills & Co-occurrence",
                "3. Real-Time Streaming & Spike Analytics",
                "4. Salary Insights & ML Bracket Prediction"
            ],
            index=0
        )

        st.markdown("---")

        # 2. Real-Time Ingestion Source Controller
        st.markdown("### 🌐 Data Ingestion Stream")

        source_mode_label = st.radio(
            "Ingestion Mode",
            [
                "🟢 Live Real-Time Feed (Public APIs)",
                "🗄️ MongoDB Live Cluster",
                "📊 High-Fidelity Synthetic Benchmark"
            ],
            index=0,
            help="Toggle between fetching live jobs over HTTP, reading from MongoDB, or using the 3,000-record benchmark."
        )

        source_mode_map = {
            "🟢 Live Real-Time Feed (Public APIs)": "live",
            "🗄️ MongoDB Live Cluster": "db",
            "📊 High-Fidelity Synthetic Benchmark": "mock"
        }
        source_mode = source_mode_map[source_mode_label]

        # Trigger button for real-time live fetch
        col_btn, _ = st.columns([3, 1])
        with col_btn:
            if st.button("🔄 Pull Fresh Live Data"):
                st.cache_data.clear()
                st.success("Refreshed live job streams over network!")
                st.rerun()

        st.caption(f"Last Stream Handshake: {datetime.datetime.now().strftime('%H:%M:%S UTC')}")

        st.markdown("---")

        # 3. Storage & Serving Layer Status
        st.markdown("### 🗄️ Storage & Serving Layer")

        mongo_client, mongo_db, is_mongo_connected, mongo_err = get_mongo_connection()

        if is_mongo_connected:
            st.success("Connected to MongoDB (`indian_job_intelligence_db`)")
        else:
            st.info("MongoDB local instance offline. Real-time stream operating in direct-serving mode.")

        with st.expander("Database Configuration"):
            db_host = st.text_input("MongoDB URI", value="mongodb://localhost:27017/")
            db_name = st.text_input("Target Database", value="indian_job_intelligence_db")
            if st.button("Test Handshake"):
                c, d, ok, err = get_mongo_connection(db_host, db_name)
                if ok:
                    st.success("Successfully connected to MongoDB cluster!")
                else:
                    st.error(f"Handshake failed: {err}")

        st.markdown("---")

        # 4. Global Indian Market Filters
        st.markdown("### 🔍 Indian Market Filters")

        # Role filter
        all_roles = sorted(df_raw["role"].unique().tolist())
        selected_roles = st.multiselect("Engineering Role", all_roles, default=all_roles)

        # Tech Hub / City filter
        available_cities = [c for c in INDIAN_TECH_HUBS if c in df_raw["city"].unique()]
        selected_cities = st.multiselect("Tech Hub / City", available_cities, default=available_cities)

        # Company Sector filter
        available_comp_types = [ct for ct in COMPANY_TYPES if ct in df_raw["company_type"].unique()]
        selected_comp_types = st.multiselect("Sector / Company Type", available_comp_types, default=available_comp_types)

        # Experience Tier filter
        available_exp = [e for e in EXPERIENCE_TIERS if e in df_raw["experience_level"].unique()]
        selected_exp = st.multiselect("Experience Tier", available_exp, default=available_exp)

        # Date Range filter
        min_date = df_raw["posted_date"].min().date() if not df_raw.empty else datetime.date.today()
        max_date = df_raw["posted_date"].max().date() if not df_raw.empty else datetime.date.today()
        date_range = st.date_input(
            "Posting Date Range",
            [min_date, max_date],
            min_value=min_date,
            max_value=max_date
        )

        # Apply global filters to dataframe copy
        df_filtered = df_raw.copy()
        if selected_roles:
            df_filtered = df_filtered[df_filtered["role"].isin(selected_roles)]
        if selected_cities:
            df_filtered = df_filtered[df_filtered["city"].isin(selected_cities)]
        if selected_comp_types:
            df_filtered = df_filtered[df_filtered["company_type"].isin(selected_comp_types)]
        if selected_exp:
            df_filtered = df_filtered[df_filtered["experience_level"].isin(selected_exp)]
        if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
            start_d, end_d = date_range
            df_filtered = df_filtered[
                (df_filtered["posted_date"].dt.date >= start_d) &
                (df_filtered["posted_date"].dt.date <= end_d)
            ]

        return selected_page, df_filtered, mongo_db, source_mode
