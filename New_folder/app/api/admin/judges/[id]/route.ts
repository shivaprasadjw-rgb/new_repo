import { NextRequest, NextResponse } from "next/server";
import { getJudgeById, updateJudgeById, deleteJudgeById } from "@/lib/judgeStorage";
import { requireAdminAuth } from "@/lib/auth";
import { sendEmail, sendWhatsApp } from "@/lib/notify";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const judge = getJudgeById(params.id);
  if (!judge) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, judge });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const updated = updateJudgeById(params.id, body);
  if (!updated) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Send notifications if status changed
  if (body.status === "approved" || body.status === "rejected") {
    const subj = body.status === "approved" ? "Judge Approval - ChallengeHub.in" : "Judge Application Update - ChallengeHub.in";
    const msg = body.status === "approved"
      ? `Congratulations ${updated.fullName}, you are approved as a judge${updated.tournaments && updated.tournaments[0] ? ` for ${updated.tournaments[0]}` : ""}.`
      : `Dear ${updated.fullName}, unfortunately your judge registration${updated.tournaments && updated.tournaments[0] ? ` for ${updated.tournaments[0]}` : ""} was not approved.`;
    await sendEmail({ to: updated.email, subject: subj, html: `<p>${msg}</p>` });
    await sendWhatsApp({ to: updated.phone, text: msg });
  }

  return NextResponse.json({ success: true, judge: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const ok = deleteJudgeById(params.id);
  return NextResponse.json({ success: ok });
}


