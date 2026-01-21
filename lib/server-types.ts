/**
 * Tipos para sincronização com servidor e dados agregados
 */

export interface HealthDataSync {
  workerId: string; // ID anônimo do trabalhador
  timestamp: number;
  checkIn?: {
    status: "bem" | "dor-leve" | "dor-forte";
    date: string;
  };
  pressure?: {
    systolic: number;
    diastolic: number;
    date: string;
  };
  symptoms?: {
    symptoms: string[];
    date: string;
  };
}

export interface AggregatedHealthData {
  date: string;
  totalWorkers: number;
  totalCheckIns: number;
  checkInDistribution: {
    bem: number;
    dorLeve: number;
    dorForte: number;
  };
  averagePressure: {
    systolic: number;
    diastolic: number;
  };
  pressureClassification: {
    normal: number;
    preHypertension: number;
    hypertension: number;
  };
  commonSymptoms: Array<{
    symptom: string;
    count: number;
  }>;
  medalStats: {
    totalMedalsUnlocked: number;
    medalBreakdown: Record<string, number>;
  };
}

export interface WeeklyReport {
  week: number;
  year: number;
  startDate: string;
  endDate: string;
  data: AggregatedHealthData;
  trends: {
    checkInTrend: "increasing" | "stable" | "decreasing";
    pressureTrend: "increasing" | "stable" | "decreasing";
    engagementScore: number; // 0-100
  };
}

export interface MonthlyReport {
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  data: AggregatedHealthData;
  weeklyBreakdown: WeeklyReport[];
  recommendations: string[];
}

export interface SyncStatus {
  lastSync: number;
  nextSync: number;
  isSyncing: boolean;
  syncError?: string;
}

export interface DashboardStats {
  totalActiveWorkers: number;
  totalCheckIns: number;
  averageEngagement: number; // 0-100
  healthScore: number; // 0-100
  criticalAlerts: Array<{
    type: "high_pressure" | "low_engagement" | "high_symptoms";
    count: number;
    workers: number;
  }>;
  topSymptoms: Array<{
    symptom: string;
    count: number;
    percentage: number;
  }>;
  pressureDistribution: {
    normal: number;
    preHypertension: number;
    hypertension: number;
  };
}
