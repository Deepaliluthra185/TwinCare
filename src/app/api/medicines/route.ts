import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const medicines = await prisma.medicine.findMany({
    where: { profileId },
    orderBy: { isActive: 'desc' },
  });

  return NextResponse.json({ data: medicines });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { profileId, name, dosage, frequency, startDate, endDate, notes } = body;

  if (!profileId || !name) return NextResponse.json({ error: 'profileId and name required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const medicine = await prisma.medicine.create({
    data: {
      profileId,
      name,
      dosage: dosage || null,
      frequency: frequency ? JSON.stringify(frequency) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ data: medicine });
}
