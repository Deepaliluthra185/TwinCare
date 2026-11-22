import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const limit = parseInt(searchParams.get('limit') || '30');

  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const checkIns = await prisma.checkIn.findMany({
    where: { profileId },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    data: checkIns.map((c) => ({
      ...c,
      symptoms: c.symptoms ? JSON.parse(c.symptoms) : [],
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { profileId, sleepHours, mood, energy, waterLiters, symptoms, restingHR, steps, systolicBP, diastolicBP, bloodSugar, notes } = body;

  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const checkIn = await prisma.checkIn.create({
    data: {
      profileId,
      sleepHours: sleepHours ?? null,
      mood: mood ?? null,
      energy: energy ?? null,
      waterLiters: waterLiters ?? null,
      symptoms: JSON.stringify(symptoms || []),
      restingHR: restingHR ?? null,
      steps: steps ?? null,
      systolicBP: systolicBP ?? null,
      diastolicBP: diastolicBP ?? null,
      bloodSugar: bloodSugar ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({
    data: { ...checkIn, symptoms: JSON.parse(checkIn.symptoms || '[]') },
  });
}
