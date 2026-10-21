export type Role =
  | 'Data Engineer'
  | 'PySpark Developer'
  | 'Machine Learning Engineer'
  | 'Full Stack Developer'
  | 'Cloud Data Architect'
  | 'Backend Engineer (Java/Go)'
  | 'Analytics Engineer';

export type ExperienceLevel =
  | 'Fresher (0-2 yrs)'
  | 'Mid-Level (2-5 yrs)'
  | 'Senior (5-8 yrs)'
  | 'Lead / Principal (8+ yrs)';

export type SalaryBracket =
  | 'Low (< ₹6 LPA)'
  | 'Medium (₹6 - ₹18 LPA)'
  | 'High (> ₹18 LPA)';

export type CompanyType =
  | 'Product Unicorns (Flipkart, Swiggy, Razorpay)'
  | 'Global Capability Centres (GCCs)'
  | 'IT Services (TCS, Infosys, Wipro)'
  | 'Seed / Series-A Startups';

export interface JobPosting {
  jobId: string;
  title: string;
  role: Role;
  city: string;
  companyType: CompanyType;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  skills: string[];
  salaryLpa: number;
  salaryBracket: SalaryBracket;
  postedDate: string; // YYYY-MM-DD
  isSpam: boolean;
  recruiterId: string;
  company: string;
}

export interface DGIMBucket {
  size: number;
  timestamp: number;
}

export interface FilterState {
  roles: Role[];
  cities: string[];
  companyTypes: CompanyType[];
  experienceLevels: ExperienceLevel[];
  dateRangeDays: number;
  searchQuery: string;
}

export interface MLPredictionInput {
  role: Role;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  city: string;
  companyType: CompanyType;
  skills: string[];
}

export interface MLPredictionOutput {
  predictedBracket: SalaryBracket;
  confidence: number;
  probabilities: {
    low: number;
    medium: number;
    high: number;
  };
  featureWeights: { feature: string; weight: number }[];
  estimatedLpaRange: [number, number];
}
