/**
 * Seed script – creates a demo user with realistic health data:
 * 20-year-old female with mild anemia and poor sleep over 3 months.
 * Run with: npm run seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TwinCare demo data…');

  // Clean existing demo user
  await prisma.user.deleteMany({ where: { email: 'demo@twincare.health' } });

  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@twincare.health',
      passwordHash,
      profiles: {
        create: {
          name: 'Priya Sharma',
          age: 20,
          sex: 'female',
          heightCm: 162,
          weightKg: 54,
          bloodGroup: 'B+',
          knownConditions: JSON.stringify(['Mild anemia (iron deficiency)']),
          currentMedicines: JSON.stringify(['Ferrous Sulfate 100mg', 'Vitamin D3 1000IU']),
          allergies: JSON.stringify(['Penicillin']),
          emergencyContact: JSON.stringify({ name: 'Rajesh Sharma', phone: '+91 98765 43210', relation: 'Father' }),
          isDefault: true,
        },
      },
    },
    include: { profiles: true },
  });

  const profile = user.profiles[0];
  console.log(`✓ Created user: ${user.email} / password: demo1234`);
  console.log(`✓ Profile: ${profile.name}`);

  // ── Lab reports (3 months apart) ──────────────────────────────────────────

  const report1 = await prisma.labReport.create({
    data: {
      profileId: profile.id,
      fileName: 'CBC_Report_Aug2026.pdf',
      reportDate: new Date('2026-08-15'),
      status: 'saved',
      labValues: {
        create: [
          { testName: 'Hemoglobin', value: 11.2, valueText: '11.2', unit: 'g/dL', flag: 'low', reportDate: new Date('2026-08-15') },
          { testName: 'WBC', value: 7.2, valueText: '7.2', unit: 'x10³/µL', flag: 'normal', reportDate: new Date('2026-08-15') },
          { testName: 'Platelets', value: 220, valueText: '220', unit: 'x10³/µL', flag: 'normal', reportDate: new Date('2026-08-15') },
          { testName: 'Ferritin', value: 8, valueText: '8', unit: 'ng/mL', flag: 'low', reportDate: new Date('2026-08-15') },
          { testName: 'Vitamin D', value: 18, valueText: '18', unit: 'ng/mL', flag: 'low', reportDate: new Date('2026-08-15') },
          { testName: 'Vitamin B12', value: 310, valueText: '310', unit: 'pg/mL', flag: 'normal', reportDate: new Date('2026-08-15') },
          { testName: 'TSH', value: 2.1, valueText: '2.1', unit: 'mIU/L', flag: 'normal', reportDate: new Date('2026-08-15') },
        ],
      },
    },
  });

  const report2 = await prisma.labReport.create({
    data: {
      profileId: profile.id,
      fileName: 'CBC_Followup_Oct2026.pdf',
      reportDate: new Date('2026-10-20'),
      status: 'saved',
      labValues: {
        create: [
          { testName: 'Hemoglobin', value: 11.8, valueText: '11.8', unit: 'g/dL', flag: 'low', reportDate: new Date('2026-10-20') },
          { testName: 'Ferritin', value: 14, valueText: '14', unit: 'ng/mL', flag: 'low', reportDate: new Date('2026-10-20') },
          { testName: 'Vitamin D', value: 22, valueText: '22', unit: 'ng/mL', flag: 'normal', reportDate: new Date('2026-10-20') },
          { testName: 'Fasting Glucose', value: 88, valueText: '88', unit: 'mg/dL', flag: 'normal', reportDate: new Date('2026-10-20') },
          { testName: 'Total Cholesterol', value: 165, valueText: '165', unit: 'mg/dL', flag: 'normal', reportDate: new Date('2026-10-20') },
        ],
      },
    },
  });

  console.log(`✓ Created ${2} lab reports`);

  // ── 90 days of check-ins ──────────────────────────────────────────────────

  const checkIns = [];
  const baseDate = new Date('2026-08-24');

  for (let i = 89; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    // Simulate declining sleep over time (from 7h → 5.5h), then improving
    const progress = i / 89; // 1 = oldest, 0 = newest
    const sleepBase = i > 45 ? 7.0 - (45 - (i - 45)) * 0.03 : 5.5 + (45 - i) * 0.015;
    const sleepHours = Math.max(4.5, Math.min(8.5, sleepBase + (Math.random() - 0.5)));

    // Energy tracks sleep with lag
    const energy = sleepHours < 6 ? Math.floor(1 + Math.random() * 2) : Math.floor(2 + Math.random() * 3);

    // Mood
    const mood = sleepHours < 5.5 ? Math.floor(1 + Math.random() * 2) : Math.floor(2 + Math.random() * 3);

    // Resting HR – slightly elevated due to anemia
    const restingHR = Math.floor(78 + Math.random() * 12 + (sleepHours < 6 ? 5 : 0));

    // Symptoms
    const symptoms: string[] = [];
    if (sleepHours < 6 && Math.random() > 0.5) symptoms.push('Fatigue');
    if (sleepHours < 5.5 && Math.random() > 0.6) symptoms.push('Headache');
    if (Math.random() > 0.85) symptoms.push('Dizziness');

    checkIns.push({
      profileId: profile.id,
      date,
      sleepHours: parseFloat(sleepHours.toFixed(1)),
      mood,
      energy,
      waterLiters: parseFloat((1.5 + Math.random() * 1.5).toFixed(1)),
      symptoms: JSON.stringify(symptoms),
      restingHR,
      steps: Math.floor(3000 + Math.random() * 7000),
      systolicBP: null,
      diastolicBP: null,
      bloodSugar: null,
      notes: null,
    });
  }

  await prisma.checkIn.createMany({ data: checkIns });
  console.log(`✓ Created ${checkIns.length} check-ins (3 months)`);

  // ── Medicines ──────────────────────────────────────────────────────────────

  await prisma.medicine.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'Ferrous Sulfate',
        dosage: '100mg',
        frequency: JSON.stringify({ label: 'Once daily' }),
        startDate: new Date('2026-08-20'),
        isActive: true,
      },
      {
        profileId: profile.id,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: JSON.stringify({ label: 'Once daily' }),
        startDate: new Date('2026-08-20'),
        isActive: true,
      },
      {
        profileId: profile.id,
        name: 'Folic Acid',
        dosage: '5mg',
        frequency: JSON.stringify({ label: 'Once daily' }),
        startDate: new Date('2026-08-20'),
        isActive: true,
      },
    ],
  });
  console.log(`✓ Created 3 medicines`);

  // ── Chat history ───────────────────────────────────────────────────────────

  await prisma.chatMessage.createMany({
    data: [
      { profileId: profile.id, role: 'user', content: 'Why am I always feeling tired?', language: 'en' },
      { profileId: profile.id, role: 'assistant', content: '**Based on your health twin data**, your fatigue is likely related to two overlapping factors:\n\n1. **Low hemoglobin (11.2 g/dL)** — Your August report showed iron-deficiency anemia. Normal for a 20-year-old woman is 12.0-15.5 g/dL. This reduces oxygen delivery to tissues, causing fatigue.\n\n2. **Declining sleep** — Your check-ins show average sleep has dropped to about 5.5h over the past few weeks (target: 7-9h).\n\n**What can help:**\n- Continue Ferrous Sulfate as prescribed (take with Vitamin C for better absorption)\n- Prioritize 7-8h sleep — even 1 extra hour should improve energy significantly\n- Eat iron-rich foods: leafy greens, lentils, lean meat\n\nIf fatigue persists despite iron supplementation and better sleep, see your doctor to rule out thyroid issues. *(Your TSH at 2.1 is normal.)*\n\n⚕️ This is health information, not a medical diagnosis.', language: 'en' },
    ],
  });

  // Trigger twin status computation
  const { computeTwinStatus } = await import('../src/lib/rulesEngine');
  const labValues = await prisma.labValue.findMany({
    where: { report: { profileId: profile.id } },
  });
  const recentCheckIns = await prisma.checkIn.findMany({
    where: { profileId: profile.id },
    orderBy: { date: 'desc' },
    take: 14,
  });

  const profileData = {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bloodGroup: profile.bloodGroup,
    knownConditions: JSON.parse(profile.knownConditions || '[]'),
    currentMedicines: JSON.parse(profile.currentMedicines || '[]'),
    allergies: JSON.parse(profile.allergies || '[]'),
    emergencyContact: profile.emergencyContact ? JSON.parse(profile.emergencyContact) : null,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  const checkInsData = recentCheckIns.map((c) => ({
    id: c.id,
    profileId: c.profileId,
    date: c.date,
    sleepHours: c.sleepHours,
    mood: c.mood,
    energy: c.energy,
    waterLiters: c.waterLiters,
    symptoms: c.symptoms ? JSON.parse(c.symptoms) : [],
    restingHR: c.restingHR,
    steps: c.steps,
    systolicBP: c.systolicBP,
    diastolicBP: c.diastolicBP,
    bloodSugar: c.bloodSugar,
    notes: c.notes,
  }));

  const labValuesData = labValues.map((lv) => ({
    id: lv.id,
    reportId: lv.reportId,
    testName: lv.testName,
    value: lv.value,
    valueText: lv.valueText,
    unit: lv.unit,
    reportDate: lv.reportDate,
    flag: lv.flag,
  }));

  const { statuses, reasons } = computeTwinStatus(profileData, labValuesData, checkInsData);

  await prisma.twinStatus.create({
    data: {
      profileId: profile.id,
      ...statuses,
      reasons: JSON.stringify(reasons),
    },
  });

  console.log(`✓ Computed and saved twin status`);
  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@twincare.health / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
