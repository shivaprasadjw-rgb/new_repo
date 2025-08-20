import { NextRequest, NextResponse } from "next/server";
import { readAllTournaments, writeAllTournaments } from "@/lib/tournamentStorage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { tid, date, time } = await req.json();

    if (!tid || !date) {
      return NextResponse.json({ error: 'Tournament ID and date are required' }, { status: 400 });
    }

    const tournaments = await readAllTournaments();
    const tournamentIndex = tournaments.findIndex(t => t.id === tid);

    if (tournamentIndex === -1) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Update tournament date
    tournaments[tournamentIndex].date = date;
    
    // If time is provided, update it too
    if (time) {
      if (!tournaments[tournamentIndex].schedule) {
        tournaments[tournamentIndex].schedule = [];
      }
      
      // Update schedule entries to apply the new date
      tournaments[tournamentIndex].schedule = tournaments[tournamentIndex].schedule.map(slot => ({
        ...slot,
        date
      }));
    }

    await writeAllTournaments(tournaments);

    // Log the action
    await appendAudit({
      action: 'UPDATE',
      resourceType: 'tournament',
      resourceId: tid,
      adminUser: auth.username!,
      tournamentId: tid,
      details: { action: 'schedule_date', date, time: time || null }
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament date scheduled successfully',
      tournament: tournaments[tournamentIndex]
    });
  } catch (error: any) {
    console.error('Error scheduling tournament date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { tid } = await req.json();

    if (!tid) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const tournaments = await readAllTournaments();
    const tournamentIndex = tournaments.findIndex(t => t.id === tid);

    if (tournamentIndex === -1) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Remove tournament date
    tournaments[tournamentIndex].date = undefined;
    
    // Remove from schedule if exists
    if (tournaments[tournamentIndex].schedule) {
      // Clear schedule entries since date is removed
      tournaments[tournamentIndex].schedule = [];
    }

    await writeAllTournaments(tournaments);

    // Log the action
    await appendAudit({
      action: 'UPDATE',
      resourceType: 'tournament',
      resourceId: tid,
      adminUser: auth.username!,
      tournamentId: tid,
      details: { action: 'unschedule_date' }
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament date unscheduled successfully'
    });
  } catch (error: any) {
    console.error('Error unscheduling tournament date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
