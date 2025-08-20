import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid session" 
      }, { status: 401 });
    }

    const { username } = await req.json();

    // Verify username matches session
    if (auth.username !== username) {
      return NextResponse.json({ 
        success: false, 
        error: "Session mismatch" 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      username: auth.username,
      message: "Session valid" 
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: "Method not allowed" 
  }, { status: 405 });
}
