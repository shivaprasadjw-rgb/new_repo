import { NextRequest, NextResponse } from "next/server";
import { addVenue, readAllVenues, updateVenueById, deleteVenueById, generateVenueId } from "@/lib/venueStorage";
import { appendAudit } from "@/lib/audit";
import { requireAdminAuth } from "@/lib/auth";
import { SecurityValidator, type ValidationRules } from "@/lib/security";
import type { Venue } from "@/lib/types";

// Validate venue data with security checks
function validateVenueData(data: any): { isValid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  
  // Required fields validation with security rules
  const requiredFields: Record<string, ValidationRules> = {
    name: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    locality: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    city: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    state: { type: 'text', minLength: 2, maxLength: 100, sanitize: 'text' },
    pincode: { type: 'text', minLength: 6, maxLength: 10, sanitize: 'text' }
  };

  for (const [field, rules] of Object.entries(requiredFields)) {
    const validation = SecurityValidator.validateInput(data[field], rules);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `${field}: ${e}`));
    }
  }

  // Validate pincode format (basic Indian pincode validation)
  if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
    errors.push("Pincode must be exactly 6 digits");
  }

  // Validate coordinates if provided
  if (data.lat) {
    const lat = parseFloat(data.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("Latitude must be a valid number between -90 and 90");
    }
  }

  if (data.lng) {
    const lng = parseFloat(data.lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("Longitude must be a valid number between -180 and 180");
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Sanitize and prepare data
  const sanitized = {
    name: SecurityValidator.sanitizeText(data.name),
    locality: SecurityValidator.sanitizeText(data.locality),
    city: SecurityValidator.sanitizeText(data.city),
    state: SecurityValidator.sanitizeText(data.state),
    pincode: SecurityValidator.sanitizeText(data.pincode),
    lat: data.lat ? parseFloat(data.lat) : undefined,
    lng: data.lng ? parseFloat(data.lng) : undefined
  };
  
  return { isValid: true, errors: [], sanitized };
}

export async function GET(req: NextRequest) {
  try {
    const venues = readAllVenues();
    return NextResponse.json({ success: true, venues });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch venues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const payload = await req.json();
    const validation = validateVenueData(payload);
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const venueData = validation.sanitized!;
    const venueId = generateVenueId(venueData.city);
    
    const venue: Venue = {
      id: venueId,
      ...venueData,
    };
    
    addVenue(venue);
    
    appendAudit({
      adminUser: auth.username!,
      action: "ADD",
      resourceType: "tournament",
      resourceId: venueId,
      tournamentId: venueId,
      details: { name: venue.name, city: venue.city, state: venue.state, entity: 'venue' }
    });
    
    return NextResponse.json({ success: true, venue });
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json({ success: false, error: "Failed to create venue" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing venue id" }, { status: 400 });
    
    // Validate venue ID
    const idValidation = SecurityValidator.validateInput(id, { 
      type: 'text', 
      minLength: 1, 
      maxLength: 50, 
      sanitize: 'text' 
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 });
    }
    
    const payload = await req.json();
    const validation = validateVenueData(payload);
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const venueData = validation.sanitized!;
    const updated = updateVenueById(id, venueData);
    
    if (!updated) {
      return NextResponse.json({ success: false, error: "Venue not found" }, { status: 404 });
    }
    
    appendAudit({
      adminUser: auth.username!,
      action: "UPDATE",
      resourceType: "tournament",
      resourceId: id,
      tournamentId: id,
      details: { name: updated.name, city: updated.city, state: updated.state, entity: 'venue' }
    });
    
    return NextResponse.json({ success: true, venue: updated });
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json({ success: false, error: "Failed to update venue" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Verify admin authentication
  const auth = requireAdminAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing venue id" }, { status: 400 });
    
    // Validate venue ID
    const idValidation = SecurityValidator.validateInput(id, { 
      type: 'text', 
      minLength: 1, 
      maxLength: 50, 
      sanitize: 'text' 
    });
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, error: "Invalid venue ID" }, { status: 400 });
    }
    
    const ok = deleteVenueById(id);
    if (!ok) return NextResponse.json({ success: false, error: "Venue not found" }, { status: 404 });
    
    appendAudit({
      adminUser: auth.username!,
      action: "DELETE",
      resourceType: "tournament",
      resourceId: id,
      tournamentId: id,
      details: { archived: true, entity: 'venue' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json({ success: false, error: "Failed to delete venue" }, { status: 500 });
  }
}
