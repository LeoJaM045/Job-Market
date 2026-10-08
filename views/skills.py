"""
views/skills.py
===============
Page 2: In-Demand Skills & Skill Co-occurrence Intelligence (Indian IT Hubs).
Analyzes skill token frequencies across Bengaluru, Hyderabad, and Pune tech corridors,
including pairwise tech stack affinities (e.g. PySpark + AWS + Databricks vs React + Node.js + MongoDB).
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
from config.settings import PLOTLY_THEME_LAYOUT


def render_skills_page(df: pd.DataFrame) -> None:
    """
    Renders top Indian skill rankings and co-occurrence affinity heatmap.

    Args:
        df: Filtered DataFrame of Indian job postings.
    """
    st.title("In-Demand Skills & Skill Trends (Indian Tech Hubs)")
    st.caption("PySpark Tokenization & Frequent Pattern Mining across Bengaluru, Hyderabad, Pune & Delhi NCR Tech Corridors")

    col_skill_ctrl, _ = st.columns([2, 3])
    with col_skill_ctrl:
        top_n = st.slider("Select Top N Skills to Analyze", min_value=5, max_value=18, value=12)

    # Flatten skills into tabular records
    all_skills_flat = []
    for row in df.itertuples():
        for skill in row.skills:
            all_skills_flat.append({
                "role": row.role,
                "skill": skill,
                "exp": row.experience_level,
                "city": row.city,
                "company_type": row.company_type
            })
    df_skills_flat = pd.DataFrame(all_skills_flat)

    if not df_skills_flat.empty:
        skill_counts = df_skills_flat["skill"].value_counts().reset_index()
        skill_counts.columns = ["skill", "frequency"]
        top_skills_list = skill_counts.head(top_n)["skill"].tolist()

        c1, c2 = st.columns([3, 2])

        with c1:
            st.subheader(f"Top {top_n} Skills Demanded in Indian Requisitions")
            fig_top_skills = px.bar(
                skill_counts.head(top_n),
                x="frequency",
                y="skill",
                orientation="h",
                color="frequency",
                color_continuous_scale="Teal",
                labels={"frequency": "Requisition Mentions", "skill": "Technology / Framework"}
            )
            fig_top_skills.update_layout(**PLOTLY_THEME_LAYOUT)
            fig_top_skills.update_layout(yaxis=dict(autorange="reversed"))
            st.plotly_chart(fig_top_skills, use_container_width=True)

        with c2:
            st.subheader("Skill Requirement by Seniority Tier")
            filtered_skills_exp = df_skills_flat[df_skills_flat["skill"].isin(top_skills_list[:7])]
            exp_skill_grouped = filtered_skills_exp.groupby(["skill", "exp"]).size().reset_index(name="count")

            fig_exp_skill = px.bar(
                exp_skill_grouped,
                x="skill",
                y="count",
                color="exp",
                barmode="group",
                category_orders={"exp": ["Fresher (0-2 yrs)", "Mid-Level (2-5 yrs)", "Senior (5-8 yrs)", "Lead / Principal (8+ yrs)"]},
                color_discrete_sequence=px.colors.qualitative.Safe
            )
            fig_exp_skill.update_layout(**PLOTLY_THEME_LAYOUT)
            st.plotly_chart(fig_exp_skill, use_container_width=True)

        st.markdown("---")

        # Co-occurrence Heatmap Matrix
        st.subheader("🔥 Indian IT Skill Co-occurrence Matrix (Pairwise Synergy)")
        st.caption("Measures how frequently technology pairs appear together in Indian job postings (e.g., PySpark + Databricks + AWS vs React.js + Node.js + MongoDB).")

        matrix_skills = top_skills_list[:10]
        co_matrix = np.zeros((len(matrix_skills), len(matrix_skills)), dtype=int)

        for skills_list in df["skills"]:
            present_skills = [s for s in matrix_skills if s in skills_list]
            for i, s1 in enumerate(matrix_skills):
                for j, s2 in enumerate(matrix_skills):
                    if s1 in present_skills and s2 in present_skills:
                        co_matrix[i][j] += 1

        fig_heat = px.imshow(
            co_matrix,
            x=matrix_skills,
            y=matrix_skills,
            color_continuous_scale="dense",
            labels=dict(x="Technology 1", y="Technology 2", color="Co-occurrences"),
            text_auto=True
        )
        fig_heat.update_layout(**PLOTLY_THEME_LAYOUT)
        fig_heat.update_layout(height=520)
        st.plotly_chart(fig_heat, use_container_width=True)

    else:
        st.warning("No skills data available for the selected filters.")
