import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
    include: {
      twinStatus: true,
      labReports: { include: { labValues: true } },
      checkIns: { orderBy: { date: 'desc' }, take: 90 },
      medicines: true,
    },
  });

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      bloodGroup: profile.bloodGroup,
      knownConditions: profile.knownConditions ? JSON.parse(profile.knownConditions) : [],
      currentMedicines: profile.currentMedicines ? JSON.parse(profile.currentMedicines) : [],
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
      emergencyContact: profile.emergencyContact ? JSON.parse(profile.emergencyContact) : null,
    },
    twinStatus: profile.twinStatus,
    labReports: profile.labReports,
    checkIns: profile.checkIns.map((c) => ({
      ...c,
      symptoms: c.symptoms ? JSON.parse(c.symptoms) : [],
    })),
    medicines: profile.medicines,
  };

  return NextResponse.json({ data: exportData });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete all user data
  await prisma.user.delete({ where: { id: user.id } });
  const response = NextResponse.json({ data: { message: 'All data deleted' } });
  response.cookies.set('tc_token', '', { maxAge: 0, path: '/' });
  return response;
}
