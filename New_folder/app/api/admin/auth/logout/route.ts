import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, invalidateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = requireAdminAuth(req);
    if (!auth.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Get session ID from cookie (preferred) or header (legacy)
    const sessionId = req.cookies.get('admin-session')?.value || req.headers.get('x-session-id');
    if (sessionId) {
      // Invalidate server-side session
      invalidateSession(sessionId);
    }

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: "Logout successful" 
    });

    // Clear session and CSRF cookies
    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
    response.cookies.set('csrf-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
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
