import { NextRequest, NextResponse } from "next/server";
import { checkAndUpdateTournamentStatus } from "@/lib/tournamentProgression";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { tid: string } }
) {
  try {
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'checkCompletion') {
      const ok = await checkAndUpdateTournamentStatus(params.tid);
      
      if (ok) {
        // Log the action
        await appendAudit({
          action: 'UPDATE',
          resourceType: 'tournament',
          resourceId: params.tid,
          adminUser: auth.username!,
          tournamentId: params.tid,
          details: { action: 'check_completion', message: 'Completion status checked and updated if applicable' }
        });

        return NextResponse.json({
          success: true,
          message: 'Completion status check executed'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'No status change performed'
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in tournament status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
