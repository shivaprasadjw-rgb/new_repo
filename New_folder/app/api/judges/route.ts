import { NextRequest, NextResponse } from "next/server";
import { addJudge, readAllJudges } from "@/lib/judgeStorage";
import type { Judge } from "@/lib/types";
import { SecurityValidator } from "@/lib/security";
import { sendEmail, sendWhatsApp } from "@/lib/notify";

export const revalidate = 0;

export async function GET() {
  const judges = readAllJudges().filter(j => j.status === "approved");
  return NextResponse.json({ success: true, judges });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = SecurityValidator.sanitizeText(String(body.fullName || ""));
    const gender = SecurityValidator.sanitizeText(String(body.gender || ""));
    const email = SecurityValidator.sanitizeText(String(body.email || ""));
    const phone = SecurityValidator.sanitizeText(String(body.phone || ""));
    const judgeType = SecurityValidator.sanitizeText(String(body.judgeType || ""));
    const schoolOrEmployer = SecurityValidator.sanitizeText(String(body.schoolOrEmployer || ""));
    const experience = SecurityValidator.sanitizeText(String(body.experience || ""));
    const tournaments = Array.isArray(body.tournaments) ? body.tournaments.map((t: any) => SecurityValidator.sanitizeText(String(t))) : [];

    if (!fullName || !email || !phone || !judgeType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!SecurityValidator.isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }
    if (!SecurityValidator.isValidPhone(phone)) {
      return NextResponse.json({ success: false, error: "Invalid phone" }, { status: 400 });
    }
    const judge: Judge = {
      id: `J-${Date.now()}`,
      fullName,
      gender: (gender as any) || "Other",
      email,
      phone,
      judgeType,
      schoolOrEmployer: schoolOrEmployer || undefined,
      experience: experience || undefined,
      tournaments,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    addJudge(judge);
    // Notifications to judge and admin (stubbed)
    const tournamentName = judge.tournaments?.[0] ? judge.tournaments[0] : "the selected tournament";
    const msg = `Thank you ${judge.fullName}, you have registered as a judge for ${tournamentName}. Awaiting admin approval.`;
    await sendEmail({ to: judge.email, subject: "Judge Registration - ChallengeHub.in", html: `<p>${msg}</p>` });
    await sendWhatsApp({ to: judge.phone, text: msg });
    // Admin notification (replace with real admin contacts)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPhone = process.env.ADMIN_PHONE || "+911234567890";
    await sendEmail({ to: adminEmail, subject: "New Judge Registration", html: `<p>${judge.fullName} applied as ${judge.judgeType}.</p>` });
    await sendWhatsApp({ to: adminPhone, text: `New judge: ${judge.fullName} (${judge.judgeType})` });
    return NextResponse.json({ success: true, judge });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Invalid input" }, { status: 400 });
  }
}


