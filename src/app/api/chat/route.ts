import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import medicinesDB from '@/config/medicines.json';

// ── Red-flag detection (runs BEFORE LLM) ──────────────────────────────────────

const RED_FLAG_KEYWORDS = [
  'chest pain', 'chest pressure', 'chest tightness',
  "can't breathe", 'trouble breathing', 'difficulty breathing', 'shortness of breath severe',
  'severe bleeding', 'uncontrolled bleeding',
  'fainting', 'loss of consciousness', 'passed out',
  'confusion', 'sudden confusion', 'disoriented',
  'stroke', 'face drooping', 'arm weakness', 'speech difficulty',
  'very high fever', 'high fever 103', 'high fever 104', 'fever 103', 'fever 104', '39.4', '40 degree',
  'suicidal', 'want to die', 'end my life', 'kill myself', 'self harm', 'hurt myself',
  'severe allergic', 'anaphylaxis', 'throat swelling', "can't swallow",
  'heart attack', 'cardiac arrest',
  'seizure',
  'overdose',
];

const SELF_HARM_KEYWORDS = [
  'suicidal', 'want to die', 'end my life', 'kill myself',
  'self harm', 'hurt myself', 'not want to live',
];

function detectRedFlag(message: string): { type: 'self_harm' | 'emergency' | null; triggered: boolean } {
  const lower = message.toLowerCase();
  if (SELF_HARM_KEYWORDS.some((kw) => lower.includes(kw))) return { type: 'self_harm', triggered: true };
  if (RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw))) return { type: 'emergency', triggered: true };
  return { type: null, triggered: false };
}

function getEmergencyResponse(type: 'self_harm' | 'emergency'): string {
  if (type === 'self_harm') {
    return `💙 **I hear you, and I'm concerned about you.**

Please reach out to someone right now. You are not alone.

**India Mental Health Helplines:**
- **iCall**: 9152987821
- **Vandrevala Foundation**: 1860-2662-345 (24/7)
- **AASRA**: 9820466627

If you are in immediate danger, please call **112** (National Emergency) or go to the nearest hospital emergency.

*TwinCare is not a crisis service. Please contact a qualified mental health professional or emergency services immediately.*`;
  }
  return `🚨 **This sounds like a medical emergency. Please seek urgent care immediately.**

**India Emergency Numbers:**
- **National Emergency**: 112
- **Ambulance**: 108
- **Police**: 100

**Please do not wait** – go to the nearest hospital emergency department or call 108 for an ambulance right now.

*TwinCare cannot provide emergency medical guidance. This is an AI health assistant, not a substitute for emergency care.*`;
}

// ── Medicine lookup ────────────────────────────────────────────────────────────

async function fetchOpenFDA(drugName: string): Promise<string> {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('FDA API error');
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return '';
    return [result.purpose?.[0], result.warnings?.[0], result.drug_interactions?.[0]]
      .filter(Boolean).join('\n').slice(0, 1000);
  } catch {
    return '';
  }
}

// ── Main chat handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profileId, message, language = 'en' } = await req.json();
  if (!profileId || !message) return NextResponse.json({ error: 'profileId and message required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: user.id },
    include: {
      twinStatus: true,
      labReports: { include: { labValues: true }, orderBy: { reportDate: 'desc' }, take: 2 },
      checkIns: { orderBy: { date: 'desc' }, take: 7 },
      medicines: { where: { isActive: true } },
    },
  });

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Red-flag check — always runs, no API key needed
  const flag = detectRedFlag(message);
  if (flag.triggered && flag.type) {
    const responseText = getEmergencyResponse(flag.type);
    await prisma.chatMessage.createMany({
      data: [
        { profileId, role: 'user', content: message, language },
        { profileId, role: 'assistant', content: responseText, language },
      ],
    });
    return NextResponse.json({ data: { response: responseText, isEmergency: true, type: flag.type } });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured. Add GEMINI_API_KEY to .env' }, { status: 503 });
  }

  // Build health context
  const knownConditions = profile.knownConditions ? JSON.parse(profile.knownConditions) : [];
  const allergies = profile.allergies ? JSON.parse(profile.allergies) : [];
  const activeMeds = profile.medicines.map((m) => `${m.name} ${m.dosage || ''}`).join(', ');

  const twinSummary = profile.twinStatus
    ? Object.entries({
        circulatory: profile.twinStatus.circulatory,
        respiratory: profile.twinStatus.respiratory,
        digestive: profile.twinStatus.digestive,
        nervous: profile.twinStatus.nervous,
        endocrine: profile.twinStatus.endocrine,
        immune: profile.twinStatus.immune,
        urinary: profile.twinStatus.urinary,
        musculoskeletal: profile.twinStatus.musculoskeletal,
        skin: profile.twinStatus.skin,
      })
        .filter(([, v]) => v !== 'normal')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || 'All systems normal'
    : 'Not computed yet';

  const recentLabs = profile.labReports
    .flatMap((r) => r.labValues).slice(0, 10)
    .map((lv) => `${lv.testName}: ${lv.valueText || lv.value} ${lv.unit || ''} (${lv.flag || 'normal'})`)
    .join('\n');

  const recentCheckIns = profile.checkIns.slice(0, 3).map((c) => {
    const syms = c.symptoms ? JSON.parse(c.symptoms) : [];
    return `${new Date(c.date).toLocaleDateString()}: sleep ${c.sleepHours}h, mood ${c.mood}/5, energy ${c.energy}/5${syms.length ? ', symptoms: ' + syms.join(', ') : ''}`;
  }).join('\n');

  // Medicine context if medicine mentioned
  const medicineInMessage = medicinesDB.find((m) =>
    message.toLowerCase().includes(m.name.toLowerCase()) ||
    message.toLowerCase().includes(m.genericName.toLowerCase())
  );
  let medicineContext = '';
  if (medicineInMessage) {
    const fdaInfo = await fetchOpenFDA(medicineInMessage.name);
    medicineContext = `
MEDICINE INFORMATION (local database):
Name: ${medicineInMessage.name} (${medicineInMessage.genericName})
Category: ${medicineInMessage.category}
Uses: ${medicineInMessage.uses.join(', ')}
Side Effects: ${medicineInMessage.sideEffects.join(', ')}
Interactions: ${medicineInMessage.interactions.join(', ')}
Max Daily Dose: ${medicineInMessage.maxDailyDose}
Warnings: ${medicineInMessage.warnings.join(', ')}
${fdaInfo ? `\nFDA Additional Info:\n${fdaInfo}` : ''}`;
  }

  const langInstruction = language === 'hi'
    ? 'Please respond in Hindi (Devanagari script). Use simple, conversational Hindi.'
    : 'Please respond in English.';

  const systemPrompt = `You are TwinCare AI, a personal health assistant integrated with the user's digital health twin.

IMPORTANT RULES:
1. Answer ONLY from the provided context and retrieved medical sources. Do not make up information.
2. For every medical claim, cite the source (e.g., "According to your lab report...", "Based on your twin's status...").
3. Say "I'm not sure, please consult a doctor" when you don't have enough information.
4. NEVER diagnose a condition. NEVER prescribe dosages.
5. ALWAYS consider the user's known conditions and medicines for interactions/contraindications.
6. For mild issues, suggest non-medicine approaches first (rest, hydration, diet, sleep).
7. Always end symptom advice with: "If this persists more than [X] days, see a doctor."
8. Always end your response with: "⚕️ This is health information, not a medical diagnosis."

USER HEALTH PROFILE:
Name: ${profile.name}
Age: ${profile.age || 'Not specified'}
Sex: ${profile.sex || 'Not specified'}
Blood Group: ${profile.bloodGroup || 'Not specified'}
Known Conditions: ${knownConditions.length ? knownConditions.join(', ') : 'None reported'}
Allergies: ${allergies.length ? allergies.join(', ') : 'None reported'}
Active Medicines: ${activeMeds || 'None'}

DIGITAL TWIN STATUS:
${twinSummary}

RECENT LAB VALUES:
${recentLabs || 'No recent labs'}

RECENT CHECK-INS (last 3):
${recentCheckIns || 'No recent check-ins'}
${medicineContext}

${langInstruction}`;

  // Conversation history for multi-turn
  const history = await prisma.chatMessage.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    // Build Gemini history (excludes the current message)
    const geminiHistory = history.reverse().map((m) => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    await prisma.chatMessage.createMany({
      data: [
        { profileId, role: 'user', content: message, language },
        { profileId, role: 'assistant', content: responseText, language },
      ],
    });

    return NextResponse.json({
      data: {
        response: responseText,
        isEmergency: false,
        highlightedSystems: medicineInMessage?.systems || [],
      },
    });
  } catch (err) {
    console.error('[chat/gemini]', err);
    return NextResponse.json({ error: 'AI response failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const messages = await prisma.chatMessage.findMany({
    where: { profileId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return NextResponse.json({ data: messages });
}
