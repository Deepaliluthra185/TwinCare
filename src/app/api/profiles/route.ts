import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: 'desc' },
  });

  return NextResponse.json({
    data: profiles.map((p) => ({
      ...p,
      knownConditions: p.knownConditions ? JSON.parse(p.knownConditions) : [],
      currentMedicines: p.currentMedicines ? JSON.parse(p.currentMedicines) : [],
      allergies: p.allergies ? JSON.parse(p.allergies) : [],
      emergencyContact: p.emergencyContact ? JSON.parse(p.emergencyContact) : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    name, age, sex, heightCm, weightKg, bloodGroup,
    knownConditions, currentMedicines, allergies, emergencyContact,
  } = body;

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      name: name || 'New Profile',
      age: age ? parseInt(age) : null,
      sex: sex || null,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      bloodGroup: bloodGroup || null,
      knownConditions: JSON.stringify(knownConditions || []),
      currentMedicines: JSON.stringify(currentMedicines || []),
      allergies: JSON.stringify(allergies || []),
      emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
      isDefault: false,
    },
  });

  return NextResponse.json({
    data: {
      ...profile,
      knownConditions: JSON.parse(profile.knownConditions || '[]'),
      currentMedicines: JSON.parse(profile.currentMedicines || '[]'),
      allergies: JSON.parse(profile.allergies || '[]'),
      emergencyContact: profile.emergencyContact ? JSON.parse(profile.emergencyContact) : null,
    },
  });
}
