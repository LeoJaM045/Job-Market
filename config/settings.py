"""
config/settings.py
==================
Centralized application settings, MongoDB configurations, theme styles, and constants
tailored for the Indian Tech Ecosystem (INR ₹ in LPA, Tier-1 Tech Hubs, GCCs, Unicorns).
"""

from typing import Dict, Any, List

# MongoDB Cluster Defaults
MONGO_DEFAULT_URI = "mongodb://localhost:27017/"
MONGO_DATABASE_NAME = "indian_job_intelligence_db"
MONGO_TIMEOUT_MS = 1500

COLLECTION_POSTINGS = "indian_postings"
COLLECTION_STREAM_METRICS = "stream_metrics"
COLLECTION_MODEL_WEIGHTS = "mllib_weights"

# App & Page Branding
APP_PAGE_TITLE = "Indian Job Market Trends & Hiring Intelligence System"
APP_PAGE_ICON = "⚡"
APP_LAYOUT = "wide"

# Algorithmic Parameters
DEFAULT_BLOOM_SIZE = 12000
DEFAULT_BLOOM_HASHES = 4
DEFAULT_DGIM_WINDOW = 120
DEFAULT_SPIKE_THRESHOLD = 30

# Indian Tech Hubs & Ecosystem Taxonomies
INDIAN_TECH_HUBS: List[str] = [
    "Bengaluru",
    "Mumbai",
    "Hyderabad",
    "Pune",
    "Delhi NCR (Gurgaon/Noida)",
    "Chennai"
]

COMPANY_TYPES: List[str] = [
    "Product Unicorns (Flipkart, Swiggy, Razorpay)",
    "Global Capability Centres (GCCs)",
    "IT Services (TCS, Infosys, Wipro)",
    "Seed / Series-A Startups"
]

EXPERIENCE_TIERS: List[str] = [
    "Fresher (0-2 yrs)",
    "Mid-Level (2-5 yrs)",
    "Senior (5-8 yrs)",
    "Lead / Principal (8+ yrs)"
]

# Indian Salary Bracket Categorization (in Lakhs Per Annum - LPA)
SALARY_BRACKETS: List[str] = [
    "Low (< ₹6 LPA)",
    "Medium (₹6 - ₹18 LPA)",
    "High (> ₹18 LPA)"
]

CURRENCY_SYMBOL = "₹"
CURRENCY_UNIT = "LPA"

# Custom Enterprise Dark Theme CSS
CUSTOM_DARK_THEME_CSS = """
<style>
    /* Global Container Adjustments */
    .stApp {
        background-color: #0B0F19;
        color: #F3F4F6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Sidebar Styling */
    [data-testid="stSidebar"] {
        background-color: #111827;
        border-right: 1px solid #1F2937;
    }
    [data-testid="stSidebar"] .stMarkdown h1, 
    [data-testid="stSidebar"] .stMarkdown h2, 
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #F9FAFB;
    }

    /* Metric Card Styling */
    [data-testid="stMetric"] {
        background-color: #161F30;
        border: 1px solid #233249;
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    [data-testid="stMetricLabel"] {
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        color: #9CA3AF !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    [data-testid="stMetricValue"] {
        font-size: 1.85rem !important;
        font-weight: 700 !important;
        color: #38BDF8 !important;
        font-feature-settings: "tnum" 1;
    }
    [data-testid="stMetricDelta"] {
        font-weight: 600 !important;
    }

    /* Tabs and Section Dividers */
    .stTabs [data-baseweb="tab-list"] {
        background-color: #111827;
        border-radius: 8px;
        padding: 4px;
        border: 1px solid #1F2937;
    }
    .stTabs [data-baseweb="tab"] {
        color: #9CA3AF;
        border-radius: 6px;
        font-weight: 500;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1E293B !important;
        color: #38BDF8 !important;
    }

    /* Card Containers */
    .system-card {
        background: #161F30;
        border: 1px solid #233249;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
    }
    .system-card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #F3F4F6;
        margin-bottom: 12px;
        border-bottom: 1px solid #233249;
        padding-bottom: 8px;
    }

    /* Indian Ecosystem Badges */
    .tech-pill {
        display: inline-block;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-family: monospace;
        border-radius: 4px;
        background: #1E293B;
        color: #38BDF8;
        border: 1px solid #334155;
        margin-right: 4px;
    }
    .india-pill {
        display: inline-block;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-family: monospace;
        border-radius: 4px;
        background: #064E3B;
        color: #34D399;
        border: 1px solid #059669;
        margin-right: 4px;
    }
</style>
"""

# Standard Plotly Dark Theme Configuration
PLOTLY_THEME_LAYOUT: Dict[str, Any] = dict(
    paper_bgcolor="rgba(16, 24, 39, 0)",
    plot_bgcolor="rgba(16, 24, 39, 0)",
    font=dict(color="#E5E7EB", family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto"),
    xaxis=dict(
        gridcolor="#1F2937",
        zerolinecolor="#374151",
        linecolor="#374151",
        tickfont=dict(color="#9CA3AF")
    ),
    yaxis=dict(
        gridcolor="#1F2937",
        zerolinecolor="#374151",
        linecolor="#374151",
        tickfont=dict(color="#9CA3AF")
    ),
    legend=dict(
        bgcolor="rgba(17, 24, 39, 0.7)",
        bordercolor="#374151",
        font=dict(color="#E5E7EB")
    ),
    margin=dict(l=40, r=40, t=50, b=40),
)
