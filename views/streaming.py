"""
views/streaming.py
==================
Page 3: Real-Time Streaming Analytics (DGIM Surge Detector & Bloom Filter Consultancy Spam Defense).
Addresses real-time ingestion challenges in the Indian IT hiring ecosystem:
- DGIM Sliding Window: Real-time detection of rapid technology demand spikes (e.g., GenAI, PySpark).
- Bloom Filter: High-throughput filtration of fraudulent consultancy and fake training-and-placement postings.
"""

import math
import hashlib
from typing import List, Optional
import streamlit as st
import numpy as np
import pandas as pd
import plotly.express as px

from config.settings import (
    PLOTLY_THEME_LAYOUT,
    DEFAULT_BLOOM_SIZE,
    DEFAULT_BLOOM_HASHES,
    DEFAULT_DGIM_WINDOW,
    DEFAULT_SPIKE_THRESHOLD
)


class BloomFilter:
    """
    Space-efficient probabilistic data structure for detecting fraudulent consultancies
    and spam job postings commonly scraping Indian tech boards.
    """
    def __init__(self, size: int = DEFAULT_BLOOM_SIZE, num_hashes: int = DEFAULT_BLOOM_HASHES):
        self.size = size
        self.num_hashes = num_hashes
        self.bit_array = [0] * size
        self.items_count = 0

    def _hashes(self, item: str) -> List[int]:
        hashes = []
        for i in range(self.num_hashes):
            digest = hashlib.md5(f"{item}-{i}".encode("utf-8")).hexdigest()
            hashes.append(int(digest, 16) % self.size)
        return hashes

    def add(self, item: str) -> None:
        for index in self._hashes(item):
            self.bit_array[index] = 1
        self.items_count += 1

    def contains(self, item: str) -> bool:
        return all(self.bit_array[index] == 1 for index in self._hashes(item))

    def false_positive_probability(self) -> float:
        if self.items_count == 0:
            return 0.0
        exponent = -1.0 * (self.num_hashes * self.items_count) / self.size
        return math.pow(1.0 - math.exp(exponent), self.num_hashes)


class DGIMBucket:
    """Represents a power-of-2 bucket in the DGIM sliding-window algorithm."""
    def __init__(self, size: int, timestamp: int):
        self.size = size
        self.timestamp = timestamp


class DGIMStream:
    """
    DGIM algorithm implementation for estimating the frequency of technology spike flags
    in a sliding window N over Kafka streams in O(log^2 N) space.
    """
    def __init__(self, window_size: int = DEFAULT_DGIM_WINDOW):
        self.window_size = window_size
        self.current_time = 0
        self.buckets: List[DGIMBucket] = []

    def update(self, bit: int) -> None:
        self.current_time += 1
        self.buckets = [b for b in self.buckets if (self.current_time - b.timestamp) < self.window_size]

        if bit == 1:
            new_bucket = DGIMBucket(size=1, timestamp=self.current_time)
            self.buckets.insert(0, new_bucket)
            self._consolidate()

    def _consolidate(self) -> None:
        i = 0
        while i < len(self.buckets) - 2:
            if self.buckets[i].size == self.buckets[i+1].size == self.buckets[i+2].size:
                merged_size = self.buckets[i+1].size * 2
                merged_timestamp = self.buckets[i+1].timestamp
                self.buckets.pop(i+2)
                self.buckets.pop(i+1)
                self.buckets.insert(i+1, DGIMBucket(merged_size, merged_timestamp))
            else:
                i += 1

    def count_ones(self, k: Optional[int] = None) -> int:
        """Estimates number of 1s in the most recent k bits."""
        limit = k if k is not None else self.window_size
        threshold_time = self.current_time - limit
        total = 0
        last_bucket_size = 0

        for b in self.buckets:
            if b.timestamp > threshold_time:
                total += b.size
                last_bucket_size = b.size
            else:
                break

        return max(0, total - (last_bucket_size // 2))


def render_streaming_page() -> None:
    """
    Renders real-time stream simulation and probabilistic data structure dashboards.
    """
    st.title("Real-Time Streaming Analytics (DGIM & Bloom Filter)")
    st.caption("Algorithmic Ingestion Layer: Skill Surge Detection + Indian Consultancy Spam Filtration")

    if "bloom_filter" not in st.session_state:
        bf = BloomFilter(size=DEFAULT_BLOOM_SIZE, num_hashes=DEFAULT_BLOOM_HASHES)
        # Prepopulate with fraudulent consultancy signatures common in Indian job portals
        for suspicious_id in [f"CONS-FAKE-PLACEMENT-{k:03d}" for k in range(1, 40)] + [f"SCAM-CONSULTANCY-PUNE-{k:03d}" for k in range(1, 25)]:
            bf.add(suspicious_id)
        st.session_state["bloom_filter"] = bf

    if "dgim_stream" not in st.session_state:
        dgim = DGIMStream(window_size=DEFAULT_DGIM_WINDOW)
        np.random.seed(101)
        historical_bits = np.random.choice([0, 1], size=120, p=[0.70, 0.30])
        for b in historical_bits:
            dgim.update(int(b))
        st.session_state["dgim_stream"] = dgim

    tab_dgim, tab_bloom = st.tabs(["⚡ DGIM Skill Surge Detector", "🛡️ Bloom Filter Consultancy Spam Defense"])

    # --- TAB 1: DGIM STREAMING ---
    with tab_dgim:
        st.markdown("""
        <div class="system-card">
            <div class="system-card-title">DGIM Algorithmic Stream Mining (GenAI & PySpark Spike Detection)</div>
            <p style="margin: 0; color: #9CA3AF; font-size: 0.88rem; line-height: 1.5;">
                In high-velocity Indian tech job aggregation feeds (10k+ postings/hour across Naukri, LinkedIn, and corporate portals),
                tracking sudden surges in demand for emerging skills (e.g. <strong>GenAI, Databricks, PySpark</strong>) in a sliding window <em>N</em>
                is accomplished with <strong>O(log² N)</strong> memory using the <strong>DGIM Algorithm</strong>.
            </p>
        </div>
        """, unsafe_allow_html=True)

        dgim_obj: DGIMStream = st.session_state["dgim_stream"]

        ctrl_col1, ctrl_col2, ctrl_col3 = st.columns([1.5, 1.5, 2])
        with ctrl_col1:
            stream_pulse = st.button("Inject 10 Stream Ticks", help="Simulates batch stream arrivals of skill mention flags")
        with ctrl_col2:
            spike_threshold = st.slider("Surge Alert Threshold (Hits / Window)", 15, 60, DEFAULT_SPIKE_THRESHOLD)
        with ctrl_col3:
            window_size_view = st.slider("Sliding Window Inspection (Ticks)", 20, 120, 100)

        if stream_pulse:
            new_bits = np.random.choice([0, 1], size=10, p=[0.50, 0.50])
            for b in new_bits:
                dgim_obj.update(int(b))

        estimated_count = dgim_obj.count_ones(window_size_view)
        is_spike = estimated_count >= spike_threshold

        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric("Stream Ingestion Clock", f"t={dgim_obj.current_time}")
        with m2:
            st.metric("Active DGIM Buckets", f"{len(dgim_obj.buckets)} buckets", delta="Compressed in memory")
        with m3:
            st.metric(f"Estimated Spikes in Last {window_size_view} Ticks", f"{estimated_count}")
        with m4:
            st.metric("Surge Demand State", "CRITICAL SURGE" if is_spike else "NORMAL DEMAND", delta="Exceeds hiring threshold" if is_spike else "Within normal baseline", delta_color="inverse" if is_spike else "normal")

        st.subheader("DGIM Bucket Memory Cascade Representation")
        if dgim_obj.buckets:
            bucket_data = []
            for b in dgim_obj.buckets:
                bucket_data.append({
                    "Bucket Size (2^k)": b.size,
                    "Timestamp (t)": b.timestamp,
                    "Age (t_curr - t)": dgim_obj.current_time - b.timestamp
                })
            df_buckets = pd.DataFrame(bucket_data)

            fig_buckets = px.scatter(
                df_buckets,
                x="Age (t_curr - t)",
                y="Bucket Size (2^k)",
                size="Bucket Size (2^k)",
                color="Bucket Size (2^k)",
                color_continuous_scale="Viridis",
                hover_data=["Timestamp (t)"]
            )
            fig_buckets.update_layout(**PLOTLY_THEME_LAYOUT)
            fig_buckets.update_layout(height=320)
            st.plotly_chart(fig_buckets, use_container_width=True)

    # --- TAB 2: BLOOM FILTER CONSULTANCY SPAM ---
    with tab_bloom:
        st.markdown("""
        <div class="system-card">
            <div class="system-card-title">Bloom Filter: Fraudulent Indian Placement Consultancy Interception</div>
            <p style="margin: 0; color: #9CA3AF; font-size: 0.88rem; line-height: 1.5;">
                Indian tech job aggregators suffer heavily from fake "Training & 100% Placement Guarantee" consultancy spam.
                Incoming recruiter signatures and phone hashes are evaluated against a <strong>Bloom Filter</strong> with
                <em>k=4</em> salted hash functions over <em>m=12,000</em> bits, ensuring zero legitimate Indian recruiters are dropped
                while preventing spam consultancies from polluting downstream Spark MLlib salary models.
            </p>
        </div>
        """, unsafe_allow_html=True)

        bf_obj: BloomFilter = st.session_state["bloom_filter"]

        b_col1, b_col2, b_col3 = st.columns(3)
        with b_col1:
            st.metric("Bloom Bit Array (m)", f"{bf_obj.size:,} bits")
        with b_col2:
            st.metric("Cryptographic Digests (k)", f"{bf_obj.num_hashes} MD5 salts")
        with b_col3:
            fp_prob = bf_obj.false_positive_probability()
            st.metric("False Positive Rate (p)", f"{fp_prob * 100:.4f}%")

        st.markdown("---")
        test_col1, test_col2 = st.columns([2, 3])

        with test_col1:
            st.subheader("Probe Recruiter / Consultancy Signature")
            test_recruiter_id = st.text_input("Recruiter Signature / Contact Hash", value="CONS-FAKE-PLACEMENT-012")
            add_as_spam = st.button("Flag & Commit to Scam Registry")
            if add_as_spam:
                bf_obj.add(test_recruiter_id)
                st.success(f"Signature '{test_recruiter_id}' flagged and committed to Bloom Filter.")

            is_present = bf_obj.contains(test_recruiter_id)
            if is_present:
                st.error(f"⚠️ SCAM DETECTED: '{test_recruiter_id}' flagged as Fraudulent Indian Placement Consultancy.")
            else:
                st.success(f"✅ VERIFIED CLEAN: '{test_recruiter_id}' confirmed genuine corporate recruiter.")

        with test_col2:
            st.subheader("Bloom Filter Capacity & False Positive Curve")
            n_vals = np.linspace(10, 3000, 40)
            m = bf_obj.size
            k = bf_obj.num_hashes
            fp_curve = [math.pow(1.0 - math.exp(-1.0 * k * n / m), k) * 100 for n in n_vals]

            df_fp = pd.DataFrame({"Spam Signatures Ingested (n)": n_vals, "False Positive Rate (%)": fp_curve})
            fig_fp = px.line(
                df_fp,
                x="Spam Signatures Ingested (n)",
                y="False Positive Rate (%)",
                color_discrete_sequence=["#EF4444"]
            )
            fig_fp.add_vline(x=bf_obj.items_count, line_dash="dash", line_color="#38BDF8", annotation_text=f"Active n={bf_obj.items_count}")
            fig_fp.update_layout(**PLOTLY_THEME_LAYOUT)
            fig_fp.update_layout(height=300)
            st.plotly_chart(fig_fp, use_container_width=True)
