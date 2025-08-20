import { NextRequest, NextResponse } from "next/server";
import { readAllJudges, addJudge } from "@/lib/judgeStorage";
import { requireAdminAuth } from "@/lib/auth";
import type { Judge } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const judges = readAllJudges();
  return NextResponse.json({ success: true, judges });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const judge: Judge = { ...body, id: `J-${Date.now()}`, status: body.status || "pending", createdAt: new Date().toISOString() };
  addJudge(judge);
  return NextResponse.json({ success: true, judge });
}


