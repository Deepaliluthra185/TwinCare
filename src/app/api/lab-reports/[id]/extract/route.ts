import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import baselines from '@/config/baselines.json';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  if (!report.rawText) {
    return NextResponse.json({ error: 'No text to extract from' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  const prompt = `You are a medical lab report parser. Extract all test results from the following lab report text.

Return a JSON array of objects with this exact shape:
[
  {
    "testName": "string (standardized name, e.g. 'Hemoglobin', 'HbA1c', 'Fasting Glucose')",
    "value": number or null (numeric value only),
    "valueText": "string (original value as text, e.g. '12.5' or 'Reactive')",
    "unit": "string (e.g. 'g/dL', '%', 'mg/dL') or null",
    "reportDate": "ISO date string or null"
  }
]

Rules:
- Extract only measurable test results, not patient info or doctor notes
- Normalize test names (e.g., 'Hb' -> 'Hemoglobin', 'FBS' -> 'Fasting Glucose', 'Sr. Creatinine' -> 'Creatinine')
- If a value is non-numeric (like 'Reactive'), set value to null and put the text in valueText
- Do not include reference ranges in the value field
- Return ONLY the JSON array, no other text

Lab report text:
${report.rawText.slice(0, 8000)}`;

  let extracted: Array<{
    testName: string;
    value: number | null;
    valueText: string | null;
    unit: string | null;
    reportDate: string | null;
  }> = [];

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      extracted = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[extract]', err);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }

  const sex = report.profile.sex || 'male';
  const flagged = extracted.map((item) => {
    let flag = 'normal';
    if (item.value != null) {
      const name = item.testName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ranges = baselines.labRanges as Record<string, Record<string, { min: number; max: number; unit: string }>>;

      let range: { min: number; max: number } | null = null;
      if (name.includes('hemoglobin') || name === 'hb' || name === 'hgb') {
        range = sex === 'female' ? ranges.hemoglobin.female : ranges.hemoglobin.male;
      } else if (name.includes('creatinine')) {
        range = sex === 'female' ? ranges.creatinine.female : ranges.creatinine.male;
      } else if (name.includes('hba1c')) {
        if (item.value >= 6.5) flag = 'high';
        else if (item.value >= 5.7) flag = 'borderline';
      } else if (name.includes('glucose') || name.includes('fbs')) {
        if (item.value >= 126) flag = 'high';
        else if (item.value >= 100) flag = 'borderline';
        else if (item.value < 70) flag = 'low';
      } else if (name === 'tsh') {
        if (item.value > 4.0) flag = 'high';
        else if (item.value < 0.4) flag = 'low';
      }

      if (range) {
        if (item.value < range.min) flag = 'low';
        else if (item.value > range.max) flag = 'high';
      }
    }
    return { ...item, flag };
  });

  return NextResponse.json({ data: { reportId: id, values: flagged } });
}
