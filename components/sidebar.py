"""
components/sidebar.py
=====================
Shared sidebar navigation, MongoDB cluster status controls, and Indian IT ecosystem filters.
"""

from typing import Tuple, Any, Optional
import streamlit as st
import pandas as pd
from database.mongo_client import get_mongo_connection
from config.settings import COMPANY_TYPES, EXPERIENCE_TIERS, INDIAN_TECH_HUBS


def render_sidebar(df_raw: pd.DataFrame) -> Tuple[str, pd.DataFrame, Optional[Any]]:
    """
    Renders the navigation menu, database configuration tools, and global filters
    tailored for Indian tech hubs, roles, and company types.

    Args:
        df_raw: Raw unfiltered DataFrame.

    Returns:
        (selected_page, filtered_df, mongo_db_instance)
    """
    with st.sidebar:
        st.markdown("## ⚡ Indian Tech Hiring")
        st.markdown(
            "<span class='india-pill'>India IT Hubs</span>"
            "<span class='tech-pill'>PySpark</span>"
            "<span class='tech-pill'>DGIM</span>"
            "<span class='tech-pill'>MLlib</span>",
            unsafe_allow_html=True
        )
        st.markdown("---")

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
        st.markdown("### 🗄️ Storage & Serving Layer")

        mongo_client, mongo_db, is_mongo_connected, mongo_err = get_mongo_connection()

        if is_mongo_connected:
            st.success("Connected to MongoDB (`indian_job_intelligence_db`)")
        else:
            st.info("MongoDB local instance offline. Utilizing cached PySpark Indian IT dataset replica.")

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
        st.markdown("### 🔍 Indian Market Filters")

        # Role filter
        all_roles = sorted(df_raw["role"].unique().tolist())
        selected_roles = st.multiselect("Engineering Role", all_roles, default=all_roles)

        # Indian City Hub filter
        all_cities = [c for c in INDIAN_TECH_HUBS if c in df_raw["city"].unique()]
        selected_cities = st.multiselect("Tech Hub / City", all_cities, default=all_cities)

        # Company Type filter (Unicorns, GCCs, IT Services, Startups)
        all_comp_types = [ct for ct in COMPANY_TYPES if ct in df_raw["company_type"].unique()]
        selected_comp_types = st.multiselect("Company Type", all_comp_types, default=all_comp_types)

        # Experience Level filter
        all_exp = [e for e in EXPERIENCE_TIERS if e in df_raw["experience_level"].unique()]
        selected_exp = st.multiselect("Experience Tier", all_exp, default=all_exp)

        # Date range filter
        min_date = df_raw["posted_date"].min().date()
        max_date = df_raw["posted_date"].max().date()
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

        return selected_page, df_filtered, mongo_db
