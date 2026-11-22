import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findFirst({
    where: { id, userId: user.id },
  });
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    data: {
      ...profile,
      knownConditions: profile.knownConditions ? JSON.parse(profile.knownConditions) : [],
      currentMedicines: profile.currentMedicines ? JSON.parse(profile.currentMedicines) : [],
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
      emergencyContact: profile.emergencyContact ? JSON.parse(profile.emergencyContact) : null,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.profile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    name, age, sex, heightCm, weightKg, bloodGroup,
    knownConditions, currentMedicines, allergies, emergencyContact,
  } = body;

  const updated = await prisma.profile.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      age: age !== undefined ? (age ? parseInt(age) : null) : existing.age,
      sex: sex !== undefined ? sex : existing.sex,
      heightCm: heightCm !== undefined ? (heightCm ? parseFloat(heightCm) : null) : existing.heightCm,
      weightKg: weightKg !== undefined ? (weightKg ? parseFloat(weightKg) : null) : existing.weightKg,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : existing.bloodGroup,
      knownConditions: knownConditions !== undefined ? JSON.stringify(knownConditions) : existing.knownConditions,
      currentMedicines: currentMedicines !== undefined ? JSON.stringify(currentMedicines) : existing.currentMedicines,
      allergies: allergies !== undefined ? JSON.stringify(allergies) : existing.allergies,
      emergencyContact: emergencyContact !== undefined ? JSON.stringify(emergencyContact) : existing.emergencyContact,
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      knownConditions: JSON.parse(updated.knownConditions || '[]'),
      currentMedicines: JSON.parse(updated.currentMedicines || '[]'),
      allergies: JSON.parse(updated.allergies || '[]'),
      emergencyContact: updated.emergencyContact ? JSON.parse(updated.emergencyContact) : null,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findFirst({ where: { id, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (profile.isDefault) return NextResponse.json({ error: 'Cannot delete default profile' }, { status: 400 });

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ data: { message: 'Deleted' } });
}
