"""
components/sidebar.py
=====================
Shared sidebar navigation, live real-time ingestion controls, MongoDB cluster status,
and Indian IT ecosystem filters with defensive tz-naive datetime sanitization.
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
    # Defensive normalization: ensure posted_date is always a clean tz-naive datetime
    if not df_raw.empty and "posted_date" in df_raw.columns:
        try:
            df_raw["posted_date"] = pd.to_datetime(df_raw["posted_date"], utc=True).dt.tz_localize(None)
        except Exception:
            pass

    with st.sidebar:
        st.markdown("## ⚡ Indian Tech Hiring")
        st.markdown(
            "<span class='india-pill'>India IT Hubs</span>"
            "<span class='tech-pill'>Live Web Stream</span>"
            "<span class='tech-pill'>PySpark</span>",
            unsafe_allow_html=True
        )
        # Big Data Pipeline Status Badges
        try:
            from database.bigdata_client import probe_bigdata_services
            bd_status = probe_bigdata_services()
            hdfs_b = bd_status.get("hdfs", {}).get("badge", "Offline (Simulated)")
            kafka_b = bd_status.get("kafka", {}).get("badge", "Idle (Simulated)")
            spark_b = bd_status.get("spark", {}).get("badge", "Pandas Fallback")
            mllib_b = bd_status.get("mllib", {}).get("badge", "Scikit-Learn Fallback")
            
            hdfs_color = "#34D399" if "Connected" in hdfs_b else "#F59E0B"
            kafka_color = "#34D399" if "Streaming" in kafka_b else "#94A3B8"
            spark_color = "#34D399" if "Ready" in spark_b else "#818CF8"
            mllib_color = "#34D399" if "Spark" in mllib_b else "#38BDF8"

            st.markdown(f"""
            <div style="background: #111827; border: 1px solid #374151; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.72rem;">
                <div style="font-weight: 600; color: #E5E7EB; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">Big Data Cluster Status</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #9CA3AF;">HDFS (9870):</span>
                    <span style="color: {hdfs_color}; font-weight: 600;">● {hdfs_b}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #9CA3AF;">Kafka (9092):</span>
                    <span style="color: {kafka_color}; font-weight: 600;">● {kafka_b}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="color: #9CA3AF;">Spark Batch:</span>
                    <span style="color: {spark_color}; font-weight: 600;">● {spark_b}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #9CA3AF;">Spark MLlib:</span>
                    <span style="color: {mllib_color}; font-weight: 600;">● {mllib_b}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        except Exception:
            pass

        # 1. Navigation Menu
        selected_page = st.radio(
            "Navigation Module",
            [
                "1. Overview & Executive Summary",
                "2. In-Demand Skills & Co-occurrence",
                "3. Real-Time Streaming & Spike Analytics",
                "4. Salary Insights & ML Bracket Prediction",
                "5. Intelligence Reports & Export Center",
                "6. Distributed Big Data Infrastructure (Hadoop/Spark/Kafka)"
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
        all_roles = sorted(df_raw["role"].unique().tolist()) if not df_raw.empty and "role" in df_raw.columns else []
        selected_roles = st.multiselect("Engineering Role", all_roles, default=all_roles)

        # Tech Hub / City filter
        available_cities = [c for c in INDIAN_TECH_HUBS if c in df_raw["city"].unique()] if not df_raw.empty and "city" in df_raw.columns else []
        selected_cities = st.multiselect("Tech Hub / City", available_cities, default=available_cities)

        # Company Sector filter
        available_comp_types = [ct for ct in COMPANY_TYPES if ct in df_raw["company_type"].unique()] if not df_raw.empty and "company_type" in df_raw.columns else []
        selected_comp_types = st.multiselect("Sector / Company Type", available_comp_types, default=available_comp_types)

        # Experience Tier filter
        available_exp = [e for e in EXPERIENCE_TIERS if e in df_raw["experience_level"].unique()] if not df_raw.empty and "experience_level" in df_raw.columns else []
        selected_exp = st.multiselect("Experience Tier", available_exp, default=available_exp)

        # Safe Date Range filter (Guaranteed tz-naive)
        if not df_raw.empty and "posted_date" in df_raw.columns:
            try:
                min_ts = df_raw["posted_date"].min()
                max_ts = df_raw["posted_date"].max()
                min_date = min_ts.date() if hasattr(min_ts, "date") else datetime.date.today() - datetime.timedelta(days=30)
                max_date = max_ts.date() if hasattr(max_ts, "date") else datetime.date.today()
            except Exception:
                min_date = datetime.date.today() - datetime.timedelta(days=30)
                max_date = datetime.date.today()
        else:
            min_date = datetime.date.today() - datetime.timedelta(days=30)
            max_date = datetime.date.today()

        # Handle edge case where min_date > max_date
        if min_date > max_date:
            min_date, max_date = max_date, min_date

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

        if isinstance(date_range, (list, tuple)) and len(date_range) == 2 and not df_filtered.empty and "posted_date" in df_filtered.columns:
            start_d, end_d = date_range
            try:
                # Compare safely by converting timestamps to pure Python date objects
                dates_only = df_filtered["posted_date"].dt.date
                df_filtered = df_filtered[
                    (dates_only >= start_d) &
                    (dates_only <= end_d)
                ]
            except Exception:
                pass

        # Quick Export Section
        st.markdown("---")
        with st.expander("📥 Quick Export Reports", expanded=False):
            st.caption(f"Export {len(df_filtered):,} active filtered records.")
            if not df_filtered.empty:
                # Prepare CSV data
                export_sub = df_filtered.copy()
                if "skills" in export_sub.columns:
                    export_sub["skills"] = export_sub["skills"].apply(lambda s: ", ".join(s) if isinstance(s, list) else str(s))
                csv_bytes = export_sub.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="📄 Export Filtered CSV",
                    data=csv_bytes,
                    file_name="indian_jobs_filtered.csv",
                    mime="text/csv",
                    use_container_width=True
                )

                # Quick text brief
                top_skill_quick = (
                    pd.Series([s for sl in df_filtered["skills"] for s in (sl if isinstance(sl, list) else [str(sl)])]).mode()[0]
                    if not df_filtered.empty else "N/A"
                )
                quick_brief = (
                    f"INDIAN TECH HIRING BRIEFING\n"
                    f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
                    f"Filtered Requisitions: {len(df_filtered):,}\n"
                    f"Mean CTC: INR {df_filtered['salary_lpa'].mean():.2f} LPA\n"
                    f"Top Skill: {top_skill_quick}\n"
                    f"Spam Intercept Rate: {(df_filtered['is_spam'].sum() / len(df_filtered) * 100):.1f}%\n"
                )
                st.download_button(
                    label="📝 Export Brief Memo (.txt)",
                    data=quick_brief,
                    file_name="indian_tech_hiring_brief.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            else:
                st.info("No postings match current filters.")

        return selected_page, df_filtered, mongo_db, source_mode
