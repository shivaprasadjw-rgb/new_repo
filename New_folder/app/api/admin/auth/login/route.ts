import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, checkRateLimit } from "@/lib/auth";
import { SecurityValidator } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: max 5 attempts per IP per 15 minutes
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 'login', 5, 15 * 60 * 1000)) {
      return NextResponse.json({ 
        success: false, 
        error: "Too many login attempts. Please try again later." 
      }, { status: 429 });
    }

    // CSRF protection (double-submit cookie pattern)
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get('csrf-token')?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || csrfHeader.length !== 64) {
      return NextResponse.json({ success: false, error: "Invalid CSRF token" }, { status: 400 });
    }

    const { username, password } = await req.json();

    // Input validation
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and password are required" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedUsername = SecurityValidator.sanitizeText(username.toString()).slice(0, 50);
    const sanitizedPassword = password.toString().slice(0, 128);

    // Authenticate admin
    const authResult = authenticateAdmin(sanitizedUsername, sanitizedPassword, req);

    if (authResult.success) {
      // Set secure session cookie and refresh CSRF cookie
      const response = NextResponse.json({ 
        success: true, 
        sessionId: authResult.sessionId,
        message: "Login successful"
      });

      // Set secure HTTP-only cookie
      response.cookies.set('admin-session', authResult.sessionId!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      // Rotate CSRF token after login
      const newCsrf = SecurityValidator.generateCsrfToken();
      response.cookies.set('csrf-token', newCsrf, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      return response;
    } else {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
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
