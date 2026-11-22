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

  const reports = await prisma.labReport.findMany({
    where: { profileId },
    include: { labValues: true },
    orderBy: { reportDate: 'desc' },
  });

  return NextResponse.json({ data: reports });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const profileId = formData.get('profileId') as string;
  const file = formData.get('file') as File | null;
  const reportDateStr = formData.get('reportDate') as string | null;

  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let rawText: string | null = null;
  let fileName: string | null = null;

  if (file) {
    fileName = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (file.name.endsWith('.pdf')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfModule = await import('pdf-parse') as any;
        const pdfParse = pdfModule.default || pdfModule;
        const data = await pdfParse(buffer);
        rawText = data.text;
      } catch {
        // PDF parse failed; will use LLM with base64
        rawText = `[PDF binary – ${file.size} bytes]`;
      }
    } else {
      // Image – we'll send to LLM as base64
      rawText = `[Image: ${file.name}, ${file.size} bytes, type: ${file.type}]`;
    }
  }

  const report = await prisma.labReport.create({
    data: {
      profileId,
      fileName,
      reportDate: reportDateStr ? new Date(reportDateStr) : null,
      rawText,
      status: 'pending',
    },
  });

  // If we have text, trigger extraction
  if (rawText && !rawText.startsWith('[')) {
    // Return report and let client call /api/lab-reports/[id]/extract
  }

  return NextResponse.json({ data: { ...report, labValues: [] } });
}
