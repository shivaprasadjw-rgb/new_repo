import { NextRequest, NextResponse } from "next/server";
import { readAllTournaments, updateTournamentById } from "@/lib/tournamentStorage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator } from "@/lib/security";
import type { Tournament } from "@/lib/types";

export async function PUT(req: NextRequest, { params }: { params: { tid: string } }) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    const { date, time } = await req.json();
    
    // Validate date input
    const dateValidation = SecurityValidator.validateInput(date, {
      type: 'text',
      minLength: 8,
      maxLength: 20,
      sanitize: 'text'
    });
    if (!dateValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid date format" 
      }, { status: 400 });
    }

    // Validate time input if provided
    if (time) {
      const timeValidation = SecurityValidator.validateInput(time, {
        type: 'text',
        minLength: 4,
        maxLength: 10,
        sanitize: 'text'
      });
      if (!timeValidation.isValid) {
        return NextResponse.json({ 
          success: false, 
          error: "Invalid time format" 
        }, { status: 400 });
      }
    }

    // Parse and validate the date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid date value" 
      }, { status: 400 });
    }

    // Check if date is in the future
    const now = new Date();
    if (parsedDate <= now) {
      return NextResponse.json({ 
        success: false, 
        error: "Tournament date must be in the future" 
      }, { status: 400 });
    }

    // Find and update the tournament
    const tournaments = readAllTournaments();
    const tournamentIndex = tournaments.findIndex(t => t.id === params.tid);
    
    if (tournamentIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: "Tournament not found" 
      }, { status: 404 });
    }

    const tournament = tournaments[tournamentIndex];
    
    // Update tournament with new date and metadata
    const updatedTournament: Tournament = {
      ...tournament,
      date: date,
      isDateScheduled: true,
      scheduledBy: auth.username!,
      scheduledAt: new Date().toISOString()
    };

    // Update the tournament
    const success = updateTournamentById(params.tid, updatedTournament);
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to update tournament" 
      }, { status: 500 });
    }

    // Log the audit
    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "tournament",
      resourceId: params.tid,
      tournamentId: params.tid,
      details: { 
        action: "schedule_date_set",
        date: date,
        time: time,
        scheduledBy: auth.username!,
        scheduledAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: true, 
      tournament: updatedTournament,
      message: "Tournament date scheduled successfully"
    });

  } catch (error) {
    console.error('Error scheduling tournament date:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to schedule tournament date" 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { tid: string } }) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate tournament ID from params
    const tidValidation = SecurityValidator.validateInput(params.tid, {
      type: 'text',
      minLength: 1,
      maxLength: 50,
      sanitize: 'text'
    });
    if (!tidValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid tournament ID" }, { status: 400 });
    }

    // Find and update the tournament
    const tournaments = readAllTournaments();
    const tournamentIndex = tournaments.findIndex(t => t.id === params.tid);
    
    if (tournamentIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: "Tournament not found" 
      }, { status: 404 });
    }

    const tournament = tournaments[tournamentIndex];
    
    // Update tournament to remove scheduled date
    const updatedTournament: Tournament = {
      ...tournament,
      date: undefined,
      isDateScheduled: false,
      scheduledBy: undefined,
      scheduledAt: undefined
    };

    // Update the tournament
    const success = updateTournamentById(params.tid, updatedTournament);
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to update tournament" 
      }, { status: 500 });
    }

    // Log the audit
    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "tournament",
      resourceId: params.tid,
      tournamentId: params.tid,
      details: { 
        action: "schedule_date_removed",
        removedBy: auth.username!,
        removedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: true, 
      tournament: updatedTournament,
      message: "Tournament date removed successfully"
    });

  } catch (error) {
    console.error('Error removing tournament date:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to remove tournament date" 
    }, { status: 500 });
  }
}

