import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await prisma.labReport.findFirst({
    where: { id },
    include: { profile: true },
  });

  if (!report || report.profile.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { values } = await req.json();

  if (!Array.isArray(values)) {
    return NextResponse.json({ error: 'values array required' }, { status: 400 });
  }

  await prisma.labValue.deleteMany({ where: { reportId: id } });

  const created = await prisma.labValue.createMany({
    data: values.map((v: {
      testName: string;
      value?: number | null;
      valueText?: string | null;
      unit?: string | null;
      reportDate?: string | null;
      flag?: string | null;
    }) => ({
      reportId: id,
      testName: v.testName,
      value: v.value ?? null,
      valueText: v.valueText ?? null,
      unit: v.unit ?? null,
      reportDate: v.reportDate ? new Date(v.reportDate) : null,
      flag: v.flag ?? null,
    })),
  });

  await prisma.labReport.update({
    where: { id },
    data: { status: 'saved' },
  });

  return NextResponse.json({ data: { saved: created.count } });
}
