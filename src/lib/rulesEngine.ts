/**
 * Rules Engine – pure TypeScript, no LLM.
 * Maps lab values, conditions, check-ins, and vitals to system statuses.
 */

import {
  SystemName,
  SystemStatus,
  SystemStatusMap,
  SystemReasons,
  LabValueData,
  CheckInData,
  ProfileData,
} from '@/types';
import baselines from '@/config/baselines.json';

type RuleResult = {
  system: SystemName;
  status: SystemStatus;
  reason: string;
};

function status(a: SystemStatus, b: SystemStatus): SystemStatus {
  const rank: Record<SystemStatus, number> = { normal: 0, mild: 1, attention: 2 };
  return rank[a] >= rank[b] ? a : b;
}

// ── Lab value rules ────────────────────────────────────────────────────────────

function checkHemoglobin(value: number, sex: string): RuleResult[] {
  const ranges = baselines.labRanges.hemoglobin;
  const range = sex === 'female' ? ranges.female : ranges.male;
  if (value < range.min - 2) {
    return [{ system: 'circulatory', status: 'attention', reason: `Hemoglobin ${value} g/dL is significantly below normal (${range.min}-${range.max} g/dL) – severe anemia likely` }];
  }
  if (value < range.min) {
    return [{ system: 'circulatory', status: 'mild', reason: `Hemoglobin ${value} g/dL is below normal (${range.min}-${range.max} g/dL) – mild anemia` }];
  }
  return [];
}

function checkHbA1c(value: number): RuleResult[] {
  if (value >= baselines.labRanges.hba1c.diabetes.min) {
    return [{ system: 'endocrine', status: 'attention', reason: `HbA1c ${value}% suggests diabetes (≥6.5%)` }];
  }
  if (value >= baselines.labRanges.hba1c.prediabetes.min) {
    return [{ system: 'endocrine', status: 'mild', reason: `HbA1c ${value}% is in prediabetes range (5.7-6.4%)` }];
  }
  return [];
}

function checkGlucose(value: number): RuleResult[] {
  if (value >= baselines.labRanges.glucose_fasting.diabetes.min) {
    return [{ system: 'endocrine', status: 'attention', reason: `Fasting glucose ${value} mg/dL is in diabetic range (≥126 mg/dL)` }];
  }
  if (value >= baselines.labRanges.glucose_fasting.prediabetes.min) {
    return [{ system: 'endocrine', status: 'mild', reason: `Fasting glucose ${value} mg/dL is in prediabetes range (100-125 mg/dL)` }];
  }
  if (value < baselines.labRanges.glucose_fasting.normal.min) {
    return [{ system: 'endocrine', status: 'mild', reason: `Fasting glucose ${value} mg/dL is low (hypoglycemia risk)` }];
  }
  return [];
}

function checkCholesterol(value: number): RuleResult[] {
  if (value >= baselines.labRanges.totalCholesterol.high.min) {
    return [{ system: 'circulatory', status: 'attention', reason: `Total cholesterol ${value} mg/dL is high (≥240 mg/dL) – cardiovascular risk` }];
  }
  if (value >= baselines.labRanges.totalCholesterol.borderline.min) {
    return [{ system: 'circulatory', status: 'mild', reason: `Total cholesterol ${value} mg/dL is borderline high (200-239 mg/dL)` }];
  }
  return [];
}

function checkLDL(value: number): RuleResult[] {
  if (value >= baselines.labRanges.ldl.high.min) {
    return [{ system: 'circulatory', status: 'attention', reason: `LDL cholesterol ${value} mg/dL is high (≥160 mg/dL)` }];
  }
  if (value >= baselines.labRanges.ldl.borderline.min) {
    return [{ system: 'circulatory', status: 'mild', reason: `LDL cholesterol ${value} mg/dL is borderline high (130-159 mg/dL)` }];
  }
  return [];
}

function checkHDL(value: number): RuleResult[] {
  if (value <= baselines.labRanges.hdl.low.max) {
    return [{ system: 'circulatory', status: 'mild', reason: `HDL cholesterol ${value} mg/dL is low (≤40 mg/dL) – reduced cardiovascular protection` }];
  }
  return [];
}

function checkTriglycerides(value: number): RuleResult[] {
  if (value >= baselines.labRanges.triglycerides.high.min) {
    return [{ system: 'circulatory', status: 'attention', reason: `Triglycerides ${value} mg/dL are high (≥200 mg/dL)` }];
  }
  if (value >= baselines.labRanges.triglycerides.borderline.min) {
    return [{ system: 'circulatory', status: 'mild', reason: `Triglycerides ${value} mg/dL are borderline high (150-199 mg/dL)` }];
  }
  return [];
}

function checkTSH(value: number): RuleResult[] {
  if (value > baselines.labRanges.tsh.normal.max) {
    return [{ system: 'endocrine', status: 'attention', reason: `TSH ${value} mIU/L is elevated – possible hypothyroidism (normal: 0.4-4.0 mIU/L)` }];
  }
  if (value < baselines.labRanges.tsh.normal.min) {
    return [{ system: 'endocrine', status: 'attention', reason: `TSH ${value} mIU/L is low – possible hyperthyroidism (normal: 0.4-4.0 mIU/L)` }];
  }
  return [];
}

function checkCreatinine(value: number, sex: string): RuleResult[] {
  const range = sex === 'female' ? baselines.labRanges.creatinine.female : baselines.labRanges.creatinine.male;
  if (value > range.max * 1.5) {
    return [{ system: 'urinary', status: 'attention', reason: `Creatinine ${value} mg/dL is significantly elevated – kidney function may be impaired` }];
  }
  if (value > range.max) {
    return [{ system: 'urinary', status: 'mild', reason: `Creatinine ${value} mg/dL is above normal range (${range.min}-${range.max} mg/dL)` }];
  }
  return [];
}

function checkVitaminD(value: number): RuleResult[] {
  if (value < baselines.labRanges.vitaminD.deficient.max) {
    return [
      { system: 'musculoskeletal', status: 'mild', reason: `Vitamin D ${value} ng/mL is deficient (<20 ng/mL) – affects bone/muscle health` },
      { system: 'immune', status: 'mild', reason: `Vitamin D deficiency can impair immune function` },
    ];
  }
  if (value < baselines.labRanges.vitaminD.insufficient.max) {
    return [{ system: 'musculoskeletal', status: 'mild', reason: `Vitamin D ${value} ng/mL is insufficient (20-30 ng/mL)` }];
  }
  return [];
}

function checkVitaminB12(value: number): RuleResult[] {
  if (value < baselines.labRanges.vitaminB12.deficient.max) {
    return [
      { system: 'nervous', status: 'mild', reason: `Vitamin B12 ${value} pg/mL is deficient (<200 pg/mL) – affects nerve function` },
      { system: 'circulatory', status: 'mild', reason: `B12 deficiency can cause megaloblastic anemia` },
    ];
  }
  return [];
}

function checkWBC(value: number): RuleResult[] {
  if (value > baselines.labRanges.wbc.adult.max) {
    return [{ system: 'immune', status: 'mild', reason: `WBC ${value} x10³/µL is elevated – possible infection or inflammation` }];
  }
  if (value < baselines.labRanges.wbc.adult.min) {
    return [{ system: 'immune', status: 'mild', reason: `WBC ${value} x10³/µL is low – possible immunosuppression` }];
  }
  return [];
}

function checkPlatelets(value: number): RuleResult[] {
  if (value < 50) {
    return [{ system: 'circulatory', status: 'attention', reason: `Platelets ${value} x10³/µL are critically low (<50 x10³/µL) – bleeding risk` }];
  }
  if (value < baselines.labRanges.platelets.adult.min) {
    return [{ system: 'circulatory', status: 'mild', reason: `Platelets ${value} x10³/µL are low (normal: 150-400 x10³/µL)` }];
  }
  if (value > baselines.labRanges.platelets.adult.max) {
    return [{ system: 'circulatory', status: 'mild', reason: `Platelets ${value} x10³/µL are elevated – may need investigation` }];
  }
  return [];
}

function checkUricAcid(value: number, sex: string): RuleResult[] {
  const range = sex === 'female' ? baselines.labRanges.uricAcid.female : baselines.labRanges.uricAcid.male;
  if (value > range.max) {
    return [{ system: 'musculoskeletal', status: 'mild', reason: `Uric acid ${value} mg/dL is elevated – gout risk (normal: ${range.min}-${range.max} mg/dL)` }];
  }
  return [];
}

function checkALT(value: number, sex: string): RuleResult[] {
  const range = sex === 'female' ? baselines.labRanges.alt.female : baselines.labRanges.alt.male;
  if (value > range.max * 3) {
    return [{ system: 'digestive', status: 'attention', reason: `ALT ${value} U/L is significantly elevated – liver stress indicated` }];
  }
  if (value > range.max) {
    return [{ system: 'digestive', status: 'mild', reason: `ALT ${value} U/L is above normal range – mild liver stress` }];
  }
  return [];
}

// ── Condition-based rules ──────────────────────────────────────────────────────

function checkConditions(conditions: string[]): RuleResult[] {
  const results: RuleResult[] = [];
  const lower = conditions.map((c) => c.toLowerCase());

  if (lower.some((c) => c.includes('diabetes') || c.includes('diabetic'))) {
    results.push({ system: 'endocrine', status: 'mild', reason: 'Known condition: Diabetes' });
    results.push({ system: 'urinary', status: 'mild', reason: 'Diabetes affects kidney health long-term' });
  }
  if (lower.some((c) => c.includes('hypertension') || c.includes('high blood pressure'))) {
    results.push({ system: 'circulatory', status: 'mild', reason: 'Known condition: Hypertension' });
  }
  if (lower.some((c) => c.includes('hypothyroid') || c.includes('thyroid'))) {
    results.push({ system: 'endocrine', status: 'mild', reason: 'Known condition: Thyroid disorder' });
  }
  if (lower.some((c) => c.includes('asthma') || c.includes('copd'))) {
    results.push({ system: 'respiratory', status: 'mild', reason: `Known condition: ${lower.find((c) => c.includes('asthma') || c.includes('copd'))}` });
  }
  if (lower.some((c) => c.includes('anemia'))) {
    results.push({ system: 'circulatory', status: 'mild', reason: 'Known condition: Anemia' });
  }
  if (lower.some((c) => c.includes('kidney') || c.includes('renal') || c.includes('ckd'))) {
    results.push({ system: 'urinary', status: 'attention', reason: 'Known condition: Kidney/renal disease' });
  }
  if (lower.some((c) => c.includes('arthritis') || c.includes('osteoporosis'))) {
    results.push({ system: 'musculoskeletal', status: 'mild', reason: `Known condition: ${conditions.find((c) => /arthritis|osteoporosis/i.test(c))}` });
  }
  if (lower.some((c) => c.includes('depression') || c.includes('anxiety') || c.includes('bipolar'))) {
    results.push({ system: 'nervous', status: 'mild', reason: `Known condition: Mental health – ${conditions.find((c) => /depression|anxiety|bipolar/i.test(c))}` });
  }
  if (lower.some((c) => c.includes('eczema') || c.includes('psoriasis') || c.includes('dermatitis'))) {
    results.push({ system: 'skin', status: 'mild', reason: `Known condition: Skin condition – ${conditions.find((c) => /eczema|psoriasis|dermatitis/i.test(c))}` });
  }
  if (lower.some((c) => c.includes('gerd') || c.includes('ibs') || c.includes('crohn') || c.includes('colitis'))) {
    results.push({ system: 'digestive', status: 'mild', reason: `Known condition: GI disorder – ${conditions.find((c) => /gerd|ibs|crohn|colitis/i.test(c))}` });
  }

  return results;
}

// ── Check-in rules ─────────────────────────────────────────────────────────────

function checkCheckIns(checkIns: CheckInData[]): RuleResult[] {
  if (checkIns.length === 0) return [];
  const results: RuleResult[] = [];

  const recent = checkIns.slice(0, 7); // last 7

  // Average sleep
  const sleepValues = recent.filter((c) => c.sleepHours != null).map((c) => c.sleepHours!);
  if (sleepValues.length >= 3) {
    const avgSleep = sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length;
    if (avgSleep < 5) {
      results.push({ system: 'nervous', status: 'attention', reason: `Average sleep ${avgSleep.toFixed(1)}h over last ${sleepValues.length} days is critically low (target ≥7h)` });
      results.push({ system: 'immune', status: 'mild', reason: 'Chronic sleep deprivation reduces immune function' });
    } else if (avgSleep < 6.5) {
      results.push({ system: 'nervous', status: 'mild', reason: `Average sleep ${avgSleep.toFixed(1)}h over last ${sleepValues.length} days is below recommended (7-9h)` });
    }
  }

  // Average mood/energy
  const moodValues = recent.filter((c) => c.mood != null).map((c) => c.mood!);
  if (moodValues.length >= 3) {
    const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
    if (avgMood < 2) {
      results.push({ system: 'nervous', status: 'mild', reason: `Consistently low mood (avg ${avgMood.toFixed(1)}/5) over last ${moodValues.length} days` });
    }
  }

  // Resting HR
  const hrValues = recent.filter((c) => c.restingHR != null).map((c) => c.restingHR!);
  if (hrValues.length >= 3) {
    const avgHR = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
    if (avgHR > 100) {
      results.push({ system: 'circulatory', status: 'mild', reason: `Average resting heart rate ${avgHR.toFixed(0)} bpm is elevated (normal: 60-100 bpm)` });
    }
    if (avgHR < 50) {
      results.push({ system: 'circulatory', status: 'mild', reason: `Average resting heart rate ${avgHR.toFixed(0)} bpm is low – monitor if symptomatic` });
    }
  }

  // BP
  const bpValues = recent.filter((c) => c.systolicBP != null && c.diastolicBP != null);
  if (bpValues.length >= 2) {
    const avgSys = bpValues.reduce((a, c) => a + c.systolicBP!, 0) / bpValues.length;
    const avgDia = bpValues.reduce((a, c) => a + c.diastolicBP!, 0) / bpValues.length;
    if (avgSys >= 140 || avgDia >= 90) {
      results.push({ system: 'circulatory', status: 'attention', reason: `Average BP ${avgSys.toFixed(0)}/${avgDia.toFixed(0)} mmHg is in hypertension range (≥140/90 mmHg)` });
    } else if (avgSys >= 130 || avgDia >= 80) {
      results.push({ system: 'circulatory', status: 'mild', reason: `Average BP ${avgSys.toFixed(0)}/${avgDia.toFixed(0)} mmHg is elevated (130-139/80-89 mmHg)` });
    }
  }

  // Blood sugar
  const bsValues = recent.filter((c) => c.bloodSugar != null).map((c) => c.bloodSugar!);
  if (bsValues.length >= 2) {
    const avgBS = bsValues.reduce((a, b) => a + b, 0) / bsValues.length;
    if (avgBS > 180) {
      results.push({ system: 'endocrine', status: 'attention', reason: `Average blood sugar ${avgBS.toFixed(0)} mg/dL is very high` });
    } else if (avgBS > 140) {
      results.push({ system: 'endocrine', status: 'mild', reason: `Average blood sugar ${avgBS.toFixed(0)} mg/dL is elevated` });
    }
  }

  // Symptoms
  const allSymptoms = recent.flatMap((c) => c.symptoms || []).map((s) => s.toLowerCase());
  if (allSymptoms.filter((s) => s.includes('chest')).length >= 2) {
    results.push({ system: 'circulatory', status: 'attention', reason: 'Recurring chest pain/discomfort reported in check-ins' });
  }
  if (allSymptoms.filter((s) => s.includes('breath')).length >= 2) {
    results.push({ system: 'respiratory', status: 'mild', reason: 'Recurring breathlessness reported in check-ins' });
  }
  if (allSymptoms.filter((s) => s.includes('dizzy') || s.includes('dizziness')).length >= 3) {
    results.push({ system: 'nervous', status: 'mild', reason: 'Recurring dizziness reported in check-ins' });
  }

  return results;
}

// ── BMI rule ───────────────────────────────────────────────────────────────────

function checkBMI(heightCm: number, weightKg: number): RuleResult[] {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (bmi >= 30) {
    return [{ system: 'circulatory', status: 'mild', reason: `BMI ${bmi.toFixed(1)} is in the obese range – cardiovascular and metabolic risk` }];
  }
  if (bmi >= 25) {
    return []; // just a note, not a flag
  }
  if (bmi < 18.5) {
    return [{ system: 'musculoskeletal', status: 'mild', reason: `BMI ${bmi.toFixed(1)} is below normal – possible malnutrition risk` }];
  }
  return [];
}

// ── Main export ────────────────────────────────────────────────────────────────

export function computeTwinStatus(
  profile: ProfileData,
  labValues: LabValueData[],
  checkIns: CheckInData[]
): { statuses: SystemStatusMap; reasons: SystemReasons } {
  const ruleResults: RuleResult[] = [];
  const sex = profile.sex || 'male';

  // Lab values
  for (const lv of labValues) {
    const name = lv.testName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const v = lv.value;
    if (v == null) continue;

    if (name.includes('hemoglobin') || name === 'hb' || name === 'hgb') ruleResults.push(...checkHemoglobin(v, sex));
    else if (name.includes('hba1c') || name === 'glycatedhemoglobin') ruleResults.push(...checkHbA1c(v));
    else if (name.includes('glucose') || name.includes('fbs') || name.includes('fastingblood')) ruleResults.push(...checkGlucose(v));
    else if (name.includes('totalcholesterol') || name === 'cholesterol') ruleResults.push(...checkCholesterol(v));
    else if (name === 'ldl' || name.includes('ldlcholesterol')) ruleResults.push(...checkLDL(v));
    else if (name === 'hdl' || name.includes('hdlcholesterol')) ruleResults.push(...checkHDL(v));
    else if (name.includes('triglyceride')) ruleResults.push(...checkTriglycerides(v));
    else if (name === 'tsh') ruleResults.push(...checkTSH(v));
    else if (name.includes('creatinine')) ruleResults.push(...checkCreatinine(v, sex));
    else if (name.includes('vitamind') || name.includes('25oh') || name.includes('vit.d')) ruleResults.push(...checkVitaminD(v));
    else if (name.includes('vitaminb12') || name.includes('b12') || name.includes('cobalamin')) ruleResults.push(...checkVitaminB12(v));
    else if (name === 'wbc' || name.includes('totalleukocyte') || name.includes('tlc')) ruleResults.push(...checkWBC(v));
    else if (name.includes('platelet')) ruleResults.push(...checkPlatelets(v));
    else if (name.includes('uricacid')) ruleResults.push(...checkUricAcid(v, sex));
    else if (name === 'alt' || name.includes('sgpt')) ruleResults.push(...checkALT(v, sex));
  }

  // Conditions
  ruleResults.push(...checkConditions(profile.knownConditions || []));

  // Check-ins
  ruleResults.push(...checkCheckIns(checkIns));

  // BMI
  if (profile.heightCm && profile.weightKg) {
    ruleResults.push(...checkBMI(profile.heightCm, profile.weightKg));
  }

  // Build final statuses and reasons
  const systems: SystemName[] = ['circulatory', 'respiratory', 'digestive', 'nervous', 'endocrine', 'immune', 'urinary', 'musculoskeletal', 'skin'];
  const statuses = {} as SystemStatusMap;
  const reasons: SystemReasons = {};

  for (const sys of systems) {
    statuses[sys] = 'normal';
    reasons[sys] = [];
  }

  for (const result of ruleResults) {
    statuses[result.system] = status(statuses[result.system], result.status);
    reasons[result.system].push(result.reason);
  }

  return { statuses, reasons };
}

// ── Trend detection ────────────────────────────────────────────────────────────

export interface TrendResult {
  metric: string;
  system: SystemName;
  direction: 'rising' | 'falling';
  message: string;
  severity: 'info' | 'warning';
}

export function detectTrends(checkIns: CheckInData[]): TrendResult[] {
  if (checkIns.length < 5) return [];
  const results: TrendResult[] = [];
  const sorted = [...checkIns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function trendSlope(values: number[]): number {
    // Simple linear regression slope
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    const num = values.reduce((acc, y, x) => acc + (x - xMean) * (y - yMean), 0);
    const den = values.reduce((acc, _, x) => acc + Math.pow(x - xMean, 2), 0);
    return den === 0 ? 0 : num / den;
  }

  // Sleep trend
  const sleepValues = sorted.filter((c) => c.sleepHours != null).map((c) => c.sleepHours!);
  if (sleepValues.length >= 5) {
    const slope = trendSlope(sleepValues);
    if (slope < -0.15) {
      results.push({ metric: 'Sleep', system: 'nervous', direction: 'falling', message: `Sleep has been declining over the past ${sleepValues.length} days – this affects cognitive health and immunity`, severity: 'warning' });
    }
  }

  // Resting HR trend
  const hrValues = sorted.filter((c) => c.restingHR != null).map((c) => c.restingHR!);
  if (hrValues.length >= 5) {
    const slope = trendSlope(hrValues);
    const avg = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
    if (slope > 1 && avg > 70) {
      results.push({ metric: 'Resting Heart Rate', system: 'circulatory', direction: 'rising', message: `Resting heart rate has been gradually rising – could indicate stress, deconditioning, or early illness`, severity: 'warning' });
    }
  }

  // Energy trend
  const energyValues = sorted.filter((c) => c.energy != null).map((c) => c.energy!);
  if (energyValues.length >= 5) {
    const slope = trendSlope(energyValues);
    if (slope < -0.1) {
      results.push({ metric: 'Energy', system: 'nervous', direction: 'falling', message: `Energy levels have been trending down – consider sleep, nutrition, and thyroid check`, severity: 'info' });
    }
  }

  // BP trend
  const sysBP = sorted.filter((c) => c.systolicBP != null).map((c) => c.systolicBP!);
  if (sysBP.length >= 4) {
    const slope = trendSlope(sysBP);
    if (slope > 1.5) {
      results.push({ metric: 'Blood Pressure', system: 'circulatory', direction: 'rising', message: `Systolic blood pressure has been rising – monitor closely and consult a doctor if it reaches 140 mmHg`, severity: 'warning' });
    }
  }

  return results;
}
