import { NextRequest, NextResponse } from "next/server";
import { readAllRegistrations } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    // In a real app, you'd check admin authentication here
    // For now, we'll allow access to this endpoint
    
    const registrations = readAllRegistrations();
    
    return NextResponse.json({
      success: true,
      registrations: registrations
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch registrations" 
      },
      { status: 500 }
    );
  }
}
