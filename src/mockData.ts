import { JobPosting, Role, ExperienceLevel, SalaryBracket, CompanyType } from './types';

export const ALL_ROLES: Role[] = [
  'Data Engineer',
  'PySpark Developer',
  'Machine Learning Engineer',
  'Full Stack Developer',
  'Cloud Data Architect',
  'Backend Engineer (Java/Go)',
  'Analytics Engineer',
];

export const ALL_CITIES: string[] = [
  'Bengaluru',
  'Mumbai',
  'Hyderabad',
  'Pune',
  'Delhi NCR (Gurgaon/Noida)',
  'Chennai',
];

export const ALL_COMPANY_TYPES: CompanyType[] = [
  'Product Unicorns (Flipkart, Swiggy, Razorpay)',
  'Global Capability Centres (GCCs)',
  'IT Services (TCS, Infosys, Wipro)',
  'Seed / Series-A Startups',
];

export const ALL_EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Fresher (0-2 yrs)',
  'Mid-Level (2-5 yrs)',
  'Senior (5-8 yrs)',
  'Lead / Principal (8+ yrs)',
];

export const ALL_SKILLS: string[] = [
  'PySpark',
  'Python',
  'SQL',
  'AWS',
  'Databricks',
  'Apache Kafka',
  'Snowflake',
  'Docker',
  'Kubernetes',
  'Apache Airflow',
  'MongoDB',
  'Apache Spark',
  'Scikit-Learn',
  'GenAI / LLMs',
  'React.js',
  'Node.js',
  'Java / Spring Boot',
  'dbt',
];

const COMPANIES_BY_TYPE: Record<CompanyType, string[]> = {
  'Product Unicorns (Flipkart, Swiggy, Razorpay)': [
    'Flipkart', 'Swiggy', 'Razorpay', 'Zomato', 'PhonePe', 'CRED', 'Meesho', 'BrowserStack'
  ],
  'Global Capability Centres (GCCs)': [
    'Walmart Global Tech India', 'Target Tech Bengaluru', 'Wells Fargo Tech India',
    'JPMorgan Chase India', 'Goldman Sachs India', "Lowe's India"
  ],
  'IT Services (TCS, Infosys, Wipro)': [
    'TCS', 'Infosys', 'Wipro', 'Cognizant India', 'HCLTech', 'LTIMindtree'
  ],
  'Seed / Series-A Startups': [
    'Zepto', 'Postman', 'Hasura', 'Sarvam AI', 'Krutrim', 'InVideo'
  ],
};

function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateJobPostings(count: number = 2400): JobPosting[] {
  const rand = pseudoRandom(42);
  const postings: JobPosting[] = [];

  const roleSkillAffinities: Record<Role, string[]> = {
    'Data Engineer': ['PySpark', 'SQL', 'Python', 'Apache Airflow', 'AWS', 'Snowflake', 'Docker', 'Apache Kafka'],
    'PySpark Developer': ['PySpark', 'Apache Spark', 'Python', 'Databricks', 'SQL', 'AWS', 'Apache Kafka', 'Snowflake'],
    'Machine Learning Engineer': ['Python', 'GenAI / LLMs', 'PySpark', 'Docker', 'Scikit-Learn', 'Kubernetes', 'AWS'],
    'Full Stack Developer': ['React.js', 'Node.js', 'MongoDB', 'Python', 'Docker', 'AWS', 'SQL'],
    'Cloud Data Architect': ['AWS', 'PySpark', 'Apache Kafka', 'Kubernetes', 'Snowflake', 'Databricks', 'dbt'],
    'Backend Engineer (Java/Go)': ['Java / Spring Boot', 'Apache Kafka', 'Docker', 'Kubernetes', 'SQL', 'AWS'],
    'Analytics Engineer': ['SQL', 'dbt', 'Snowflake', 'Python', 'Databricks', 'Apache Airflow'],
  };

  const baseLpaRanges: Record<ExperienceLevel, [number, number]> = {
    'Fresher (0-2 yrs)': [3.6, 9.5],
    'Mid-Level (2-5 yrs)': [8.5, 18.0],
    'Senior (5-8 yrs)': [18.5, 32.0],
    'Lead / Principal (8+ yrs)': [32.0, 58.0],
  };

  const cityMultipliers: Record<string, number> = {
    'Bengaluru': 1.18,
    'Mumbai': 1.14,
    'Hyderabad': 1.05,
    'Delhi NCR (Gurgaon/Noida)': 1.08,
    'Pune': 0.98,
    'Chennai': 0.94,
  };

  const companyMultipliers: Record<CompanyType, number> = {
    'Product Unicorns (Flipkart, Swiggy, Razorpay)': 1.45,
    'Global Capability Centres (GCCs)': 1.35,
    'IT Services (TCS, Infosys, Wipro)': 0.78,
    'Seed / Series-A Startups': 1.15,
  };

  const baseDate = new Date(2026, 0, 1);

  for (let i = 0; i < count; i++) {
    const role = ALL_ROLES[Math.floor(rand() * ALL_ROLES.length)];
    const city = ALL_CITIES[Math.floor(rand() * ALL_CITIES.length)];
    const compType = ALL_COMPANY_TYPES[Math.floor(rand() * ALL_COMPANY_TYPES.length)];
    const companyList = COMPANIES_BY_TYPE[compType];
    const company = companyList[Math.floor(rand() * companyList.length)];

    const expRoll = rand();
    let exp: ExperienceLevel = 'Mid-Level (2-5 yrs)';
    let years = 3;
    if (expRoll < 0.22) {
      exp = 'Fresher (0-2 yrs)';
      years = Math.floor(rand() * 2);
    } else if (expRoll < 0.60) {
      exp = 'Mid-Level (2-5 yrs)';
      years = 2 + Math.floor(rand() * 4);
    } else if (expRoll < 0.88) {
      exp = 'Senior (5-8 yrs)';
      years = 5 + Math.floor(rand() * 4);
    } else {
      exp = 'Lead / Principal (8+ yrs)';
      years = 8 + Math.floor(rand() * 8);
    }

    const primary = roleSkillAffinities[role] || ALL_SKILLS.slice(0, 6);
    const numSkills = 4 + Math.floor(rand() * 4);
    const selectedSkills = new Set<string>();

    for (const p of primary) {
      if (rand() > 0.30) selectedSkills.add(p);
    }
    while (selectedSkills.size < numSkills) {
      const anySkill = ALL_SKILLS[Math.floor(rand() * ALL_SKILLS.length)];
      selectedSkills.add(anySkill);
    }
    const skillsList = Array.from(selectedSkills);

    // LPA Calculation
    const [minLpa, maxLpa] = baseLpaRanges[exp];
    const rawLpa = minLpa + rand() * (maxLpa - minLpa);
    const cityMult = cityMultipliers[city] || 1.0;
    const compMult = companyMultipliers[compType] || 1.0;
    const pysparkBoost = skillsList.includes('PySpark') ? 1.08 : 1.0;
    const genaiBoost = skillsList.includes('GenAI / LLMs') ? 1.12 : 1.0;
    const finalLpa = Math.round(rawLpa * cityMult * compMult * pysparkBoost * genaiBoost * 10) / 10;

    let bracket: SalaryBracket = 'Medium (₹6 - ₹18 LPA)';
    if (finalLpa < 6.0) {
      bracket = 'Low (< ₹6 LPA)';
    } else if (finalLpa > 18.0) {
      bracket = 'High (> ₹18 LPA)';
    }

    const dayOffset = Math.floor(rand() * 90);
    const date = new Date(baseDate.getTime() + dayOffset * 86400000);
    const dateStr = date.toISOString().split('T')[0];

    // 16% consultancy scam rate
    const isSpam = rand() < 0.16;
    const recruiterId = isSpam
      ? `CONS-FAKE-PLACEMENT-${String(Math.floor(rand() * 35) + 1).padStart(3, '0')}`
      : `REC-${company.slice(0, 4).toUpperCase()}-${String(Math.floor(rand() * 200)).padStart(3, '0')}`;

    postings.push({
      jobId: `IND-JOB-${100000 + i}`,
      title: `${role} - ${skillsList[0]} Track`,
      role,
      city,
      companyType: compType,
      experienceLevel: exp,
      yearsExperience: years,
      skills: skillsList,
      salaryLpa: finalLpa,
      salaryBracket: bracket,
      postedDate: dateStr,
      isSpam,
      recruiterId,
      company,
    });
  }

  return postings;
}
