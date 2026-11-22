// Core application types

export type SystemName =
  | 'circulatory'
  | 'respiratory'
  | 'digestive'
  | 'nervous'
  | 'endocrine'
  | 'immune'
  | 'urinary'
  | 'musculoskeletal'
  | 'skin';

export type SystemStatus = 'normal' | 'mild' | 'attention';

export type Sex = 'male' | 'female' | 'other';

export interface SystemStatusMap {
  circulatory: SystemStatus;
  respiratory: SystemStatus;
  digestive: SystemStatus;
  nervous: SystemStatus;
  endocrine: SystemStatus;
  immune: SystemStatus;
  urinary: SystemStatus;
  musculoskeletal: SystemStatus;
  skin: SystemStatus;
}

export interface SystemReasons {
  [system: string]: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface ProfileData {
  id: string;
  name: string;
  age?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bloodGroup?: string | null;
  knownConditions: string[];
  currentMedicines: string[];
  allergies: string[];
  emergencyContact?: EmergencyContact | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabValueData {
  id: string;
  reportId: string;
  testName: string;
  value?: number | null;
  valueText?: string | null;
  unit?: string | null;
  reportDate?: Date | null;
  flag?: string | null;
}

export interface LabReportData {
  id: string;
  profileId: string;
  fileName?: string | null;
  reportDate?: Date | null;
  status: string;
  labValues: LabValueData[];
  createdAt: Date;
}

export interface CheckInData {
  id: string;
  profileId: string;
  date: Date;
  sleepHours?: number | null;
  mood?: number | null;
  energy?: number | null;
  waterLiters?: number | null;
  symptoms: string[];
  restingHR?: number | null;
  steps?: number | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  bloodSugar?: number | null;
  notes?: string | null;
}

export interface MedicineData {
  id: string;
  profileId: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  notes?: string | null;
  isActive: boolean;
}

export interface MedicineInfo {
  name: string;
  genericName: string;
  category: string;
  uses: string[];
  systems: SystemName[];
  sideEffects: string[];
  interactions: string[];
  maxDailyDose: string;
  warnings: string[];
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  createdAt: Date;
}

export interface TwinStatusData {
  id: string;
  profileId: string;
  circulatory: SystemStatus;
  respiratory: SystemStatus;
  digestive: SystemStatus;
  nervous: SystemStatus;
  endocrine: SystemStatus;
  immune: SystemStatus;
  urinary: SystemStatus;
  musculoskeletal: SystemStatus;
  skin: SystemStatus;
  reasons: SystemReasons;
  updatedAt: Date;
}

export interface TrendAlert {
  system: SystemName;
  metric: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  days: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  projectedChanges: Partial<Record<SystemName, { status: SystemStatus; reason: string }>>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
