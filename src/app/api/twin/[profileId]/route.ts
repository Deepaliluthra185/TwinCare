import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { computeTwinStatus } from '@/lib/rulesEngine';
import { ProfileData, LabValueData, CheckInData } from '@/types';

type Params = Promise<{ profileId: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { profileId } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
    include: {
      twinStatus: true,
      labReports: {
        include: { labValues: true },
        orderBy: { reportDate: 'desc' },
        take: 5,
      },
      checkIns: {
        orderBy: { date: 'desc' },
        take: 14,
      },
    },
  });

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const profileData: ProfileData = {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bloodGroup: profile.bloodGroup,
    knownConditions: profile.knownConditions ? JSON.parse(profile.knownConditions) : [],
    currentMedicines: profile.currentMedicines ? JSON.parse(profile.currentMedicines) : [],
    allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
    emergencyContact: profile.emergencyContact ? JSON.parse(profile.emergencyContact) : null,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  const labValues: LabValueData[] = profile.labReports.flatMap((r) =>
    r.labValues.map((lv) => ({
      id: lv.id,
      reportId: lv.reportId,
      testName: lv.testName,
      value: lv.value,
      valueText: lv.valueText,
      unit: lv.unit,
      reportDate: lv.reportDate,
      flag: lv.flag,
    }))
  );

  const checkIns: CheckInData[] = profile.checkIns.map((c) => ({
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

  const { statuses, reasons } = computeTwinStatus(profileData, labValues, checkIns);

  const twinStatus = await prisma.twinStatus.upsert({
    where: { profileId },
    create: {
      profileId,
      ...statuses,
      reasons: JSON.stringify(reasons),
    },
    update: {
      ...statuses,
      reasons: JSON.stringify(reasons),
    },
  });

  return NextResponse.json({
    data: {
      ...twinStatus,
      reasons,
    },
  });
}
