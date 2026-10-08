"""
views/overview.py
=================
Page 1: Overview & Executive Summary Dashboard (Indian Tech Ecosystem).
Visualizes Indian IT hiring velocity, top skills, compensation benchmarks in ₹ LPA,
and consultancy spam filtration rates across major hubs like Bengaluru, Hyderabad, and Pune.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from config.settings import PLOTLY_THEME_LAYOUT, CURRENCY_SYMBOL, CURRENCY_UNIT


def render_overview_page(df: pd.DataFrame) -> None:
    """
    Renders the executive summary dashboard for the Indian Tech Ecosystem.

    Args:
        df: Filtered DataFrame of Indian job postings.
    """
    st.title("Indian Job Market Trends & Hiring Intelligence System")
    st.caption("Big Data Architecture: HDFS -> PySpark -> Kafka -> Bloom Filter (Spam Consultancy Defense) -> DGIM -> Spark MLlib -> MongoDB")

    # High-level architecture summary box
    st.markdown("""
    <div class="system-card">
        <div class="system-card-title">Indian Tech Ecosystem Pipeline Status: Operational</div>
        <p style="margin: 0; color: #9CA3AF; font-size: 0.9rem; line-height: 1.5;">
            Ingesting job postings across <strong>Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, and Chennai</strong>.
            Aggregated via <strong>PySpark</strong> batch workers. Real-time stream filters fraudulent placement consultancies
            and fake hiring rings via a <strong>Bloom Filter</strong>, while a <strong>DGIM Algorithm</strong> sliding window
            identifies real-time technology demand surges (e.g. PySpark, Databricks, GenAI).
            Compensation intelligence is modeled into <strong>₹ LPA</strong> tiers and served from <strong>MongoDB</strong>.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # 4 KPI Cards
    col1, col2, col3, col4 = st.columns(4)

    total_postings = len(df)
    avg_lpa = df["salary_lpa"].mean() if total_postings > 0 else 0.0
    spam_rate = (df["is_spam"].sum() / total_postings * 100) if total_postings > 0 else 0.0

    all_exploded_skills = [s for sublist in df["skills"] for s in sublist]
    top_skill = pd.Series(all_exploded_skills).mode()[0] if all_exploded_skills else "N/A"

    with col1:
        st.metric("Indian Postings Indexed", f"{total_postings:,}", delta="+18.5% QoQ Ingestion")
    with col2:
        st.metric("Top In-Demand Skill", top_skill, delta="Surging in GCCs & Unicorns")
    with col3:
        st.metric(f"Average CTC ({CURRENCY_UNIT})", f"{CURRENCY_SYMBOL}{avg_lpa:.1f} {CURRENCY_UNIT}", delta="+6.2% Indian Tech Avg")
    with col4:
        st.metric("Consultancy Scam Intercept", f"{spam_rate:.1f}%", delta="Blocked by Bloom Filter")

    st.markdown("---")

    # Charts Row 1: Daily Ingestion Velocity & Role Distribution
    chart_c1, chart_c2 = st.columns([3, 2])

    with chart_c1:
        st.subheader("Daily Postings Ingestion Velocity (Indian Tech Hubs)")
        if not df.empty:
            daily_counts = df.groupby(df["posted_date"].dt.date).size().reset_index(name="count")
            fig_time = px.area(
                daily_counts,
                x="posted_date",
                y="count",
                labels={"posted_date": "Date", "count": "Requisitions Ingested"},
                color_discrete_sequence=["#38BDF8"]
            )
            fig_time.update_layout(**PLOTLY_THEME_LAYOUT)
            fig_time.update_traces(fillcolor="rgba(56, 189, 248, 0.2)")
            st.plotly_chart(fig_time, use_container_width=True)
        else:
            st.info("No postings matching the selected filter criteria.")

    with chart_c2:
        st.subheader("Requisition Share by Engineering Role")
        if not df.empty:
            role_counts = df["role"].value_counts().reset_index()
            role_counts.columns = ["role", "count"]
            fig_pie = px.pie(
                role_counts,
                names="role",
                values="count",
                hole=0.55,
                color_discrete_sequence=px.colors.sequential.Tealgrn_r
            )
            fig_pie.update_layout(**PLOTLY_THEME_LAYOUT)
            st.plotly_chart(fig_pie, use_container_width=True)

    # Charts Row 2: Tech Hub Volume vs Compensation & Company Type Breakdown
    chart_c3, chart_c4 = st.columns(2)

    with chart_c3:
        st.subheader("Tech Hub Volume & Mean CTC (₹ LPA)")
        if not df.empty:
            city_stats = df.groupby("city").agg(
                postings=("job_id", "count"),
                avg_lpa=("salary_lpa", "mean")
            ).reset_index()

            fig_city = px.bar(
                city_stats,
                x="city",
                y="postings",
                color="avg_lpa",
                color_continuous_scale="Viridis",
                labels={"city": "Tech Hub", "postings": "Total Postings", "avg_lpa": "Mean CTC (₹ LPA)"}
            )
            fig_city.update_layout(**PLOTLY_THEME_LAYOUT)
            st.plotly_chart(fig_city, use_container_width=True)

    with chart_c4:
        st.subheader("Company Type Compensation Comparison")
        if not df.empty:
            comp_type_stats = df.groupby("company_type").agg(
                avg_lpa=("salary_lpa", "mean"),
                postings=("job_id", "count")
            ).reset_index()

            fig_comp = px.bar(
                comp_type_stats,
                x="company_type",
                y="avg_lpa",
                color="company_type",
                labels={"company_type": "Sector", "avg_lpa": "Average CTC (₹ LPA)"},
                color_discrete_sequence=px.colors.qualitative.Prism
            )
            fig_comp.update_layout(**PLOTLY_THEME_LAYOUT)
            fig_comp.update_layout(showlegend=False)
            st.plotly_chart(fig_comp, use_container_width=True)

    # Charts Row 3: Salary Bracket Share by Seniority
    st.subheader("Seniority Distribution across Indian Salary Brackets (₹ LPA)")
    if not df.empty:
        bracket_counts = df.groupby(["experience_level", "salary_bracket"]).size().reset_index(name="count")
        fig_bracket = px.bar(
            bracket_counts,
            x="experience_level",
            y="count",
            color="salary_bracket",
            barmode="stack",
            category_orders={"experience_level": ["Fresher (0-2 yrs)", "Mid-Level (2-5 yrs)", "Senior (5-8 yrs)", "Lead / Principal (8+ yrs)"]},
            color_discrete_map={
                "Low (< ₹6 LPA)": "#64748B",
                "Medium (₹6 - ₹18 LPA)": "#38BDF8",
                "High (> ₹18 LPA)": "#10B981"
            }
        )
        fig_bracket.update_layout(**PLOTLY_THEME_LAYOUT)
        st.plotly_chart(fig_bracket, use_container_width=True)
