export type ElevatorStatus = 'UP' | 'DOWN' | 'SLOW' | 'TRAPPED' | 'UNSAFE' | 'UNVERIFIED';

export interface FailureRisk {
  risk_score: number;
  risk_label: string;
}

export interface ElevatorReport {
  id: number | string;
  status: ElevatorStatus;
  reported_at: string;
  is_official: boolean;
}

export interface AdvocacyLog {
  sr_number: string;
  description: string;
  outcome: string;
  created_at: string;
}

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  published_date: string;
  is_mocked?: boolean;
}

export interface Building {
  bin: string;
  address: string;
  borough: string;
  verified_status: ElevatorStatus;
  verification_countdown: number;
  loss_of_service_30d: number | null;
  failure_risk: FailureRisk | null;
  recent_reports: ElevatorReport[];
  advocacy_logs: AdvocacyLog[];
  news_articles: NewsArticle[];
  is_mocked?: boolean;
}

export interface AdvocacyScript {
  headline: string;
  script: string;
  legal_reference: string;
}

export interface ExecutiveSummary {
  risk_level: string;
  historical_patterns: string;
  community_sentiment: string;
  legal_standing: string;
  recommended_action: string;
  confidence_score: number;
}

export interface OptimisticReport {
  id: number | string;
  status: string;
  reported_at?: string;
  time?: string;
  pending?: boolean;
}

export interface AuthSuccessData {
  token: string;
  username: string;
  primary_building?: { bin: string };
}
