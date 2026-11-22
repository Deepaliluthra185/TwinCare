import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const med = await prisma.medicine.findFirst({
    where: { id },
    include: { profile: true },
  });
  if (!med || med.profile.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.medicine.update({
    where: { id },
    data: {
      name: body.name ?? med.name,
      dosage: body.dosage !== undefined ? body.dosage : med.dosage,
      frequency: body.frequency !== undefined ? JSON.stringify(body.frequency) : med.frequency,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : med.startDate,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : med.endDate,
      notes: body.notes !== undefined ? body.notes : med.notes,
      isActive: body.isActive !== undefined ? body.isActive : med.isActive,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const med = await prisma.medicine.findFirst({
    where: { id },
    include: { profile: true },
  });
  if (!med || med.profile.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.medicine.delete({ where: { id } });
  return NextResponse.json({ data: { message: 'Deleted' } });
}
