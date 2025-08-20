"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from "lucide-react";
import * as XLSX from "xlsx";

interface ExcelUploadProps {
  tournamentId: string;
  onUploadSuccess: (participants: any[]) => void;
}

interface Participant {
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  phone: string;
  email: string;
  address: string;
  schoolOrEmployer: string;
  playerPhoto?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  knownAllergies: string;
  priorMedicalConditions: string;
  currentMedications: string;
  medicalReleaseConsent: boolean;
  playerSkillLevel: 'Professional' | 'Advanced' | 'Intermediate' | 'Beginner';
  pastPerformance?: string;
  waiversAcknowledged: boolean;
  mediaConsentAcknowledged: boolean;
  paymentScreenshot?: string;
  transactionId: string;
}

export default function ExcelUpload({ tournamentId, onUploadSuccess }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read CSRF token from cookie set by middleware
  useState(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )csrf-token=([^;]+)/);
      setCsrfToken(match ? decodeURIComponent(match[1]) : "");
    }
  });

  // Get session ID from localStorage
  const getSessionId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminSessionId');
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        setError('Excel file must have at least a header row and one data row');
        return;
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      // Map flexible column names to standard fields
      const columnMapping: { [key: string]: string } = {
        'full name': 'fullName',
        'fullname': 'fullName',
        'name': 'fullName',
        'first name': 'fullName',
        'firstname': 'fullName',
        'date of birth': 'dateOfBirth',
        'dateofbirth': 'dateOfBirth',
        'dob': 'dateOfBirth',
        'birth date': 'dateOfBirth',
        'birthdate': 'dateOfBirth',
        'phone': 'phone',
        'phone number': 'phone',
        'phonenumber': 'phone',
        'mobile': 'phone',
        'mobile number': 'phone',
        'mobilenumber': 'phone',
        'contact': 'phone',
        'contact number': 'phone',
        'contactnumber': 'phone',
        'school or employer': 'schoolOrEmployer',
        'schooloremployer': 'schoolOrEmployer',
        'school': 'schoolOrEmployer',
        'employer': 'schoolOrEmployer',
        'organization': 'schoolOrEmployer',
        'company': 'schoolOrEmployer',
        'emergency contact name': 'emergencyContactName',
        'emergencycontactname': 'emergencyContactName',
        'emergency name': 'emergencyContactName',
        'emergencyname': 'emergencyContactName',
        'emergency contact': 'emergencyContactName',
        'emergencycontact': 'emergencyContactName',
        'emergency contact relationship': 'emergencyContactRelationship',
        'emergencycontactrelationship': 'emergencyContactRelationship',
        'emergency relationship': 'emergencyContactRelationship',
        'emergencyrelationship': 'emergencyContactRelationship',
        'relationship': 'emergencyContactRelationship',
        'emergency contact phone': 'emergencyContactPhone',
        'emergencycontactphone': 'emergencyContactPhone',
        'emergency phone': 'emergencyContactPhone',
        'emergencyphone': 'emergencyContactPhone',
        'emergency contact number': 'emergencyContactPhone',
        'emergencycontactnumber': 'emergencyContactPhone',
        'known allergies': 'knownAllergies',
        'knownallergies': 'knownAllergies',
        'allergies': 'knownAllergies',
        'prior medical conditions': 'priorMedicalConditions',
        'priormedicalconditions': 'priorMedicalConditions',
        'medical conditions': 'priorMedicalConditions',
        'medicalconditions': 'priorMedicalConditions',
        'current medications': 'currentMedications',
        'currentmedications': 'currentMedications',
        'medications': 'currentMedications',
        'medical release consent': 'medicalReleaseConsent',
        'medicalreleaseconsent': 'medicalReleaseConsent',
        'medical consent': 'medicalReleaseConsent',
        'medicalconsent': 'medicalReleaseConsent',
        'player skill level': 'playerSkillLevel',
        'playerskilllevel': 'playerSkillLevel',
        'skill level': 'playerSkillLevel',
        'skilllevel': 'playerSkillLevel',
        'level': 'playerSkillLevel',
        'past performance': 'pastPerformance',
        'pastperformance': 'pastPerformance',
        'performance': 'pastPerformance',
        'waivers acknowledged': 'waiversAcknowledged',
        'waiversacknowledged': 'waiversAcknowledged',
        'waivers': 'waiversAcknowledged',
        'media consent acknowledged': 'mediaConsentAcknowledged',
        'mediaconsentacknowledged': 'mediaConsentAcknowledged',
        'media consent': 'mediaConsentAcknowledged',
        'mediaconsent': 'mediaConsentAcknowledged',
        'payment screenshot': 'paymentScreenshot',
        'paymentscreenshot': 'paymentScreenshot',
        'payment': 'paymentScreenshot',
        'screenshot': 'paymentScreenshot',
        'transaction id': 'transactionId',
        'transactionid': 'transactionId',
        'transaction': 'transactionId',
        'txn id': 'transactionId',
        'txnid': 'transactionId'
      };

      const mappedHeaders = headers.map(header => {
        const lowerHeader = header.toLowerCase().trim();
        return columnMapping[lowerHeader] || header;
      });

      const parsedParticipants: Participant[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        if (row.every(cell => !cell)) continue; // Skip empty rows

        const participant: any = {};
        
        mappedHeaders.forEach((mappedHeader, index) => {
          if (mappedHeader && row[index] !== undefined) {
            participant[mappedHeader] = row[index];
          }
        });

        // Set default values for required fields
        participant.medicalReleaseConsent = participant.medicalReleaseConsent !== false;
        participant.waiversAcknowledged = participant.waiversAcknowledged !== false;
        participant.mediaConsentAcknowledged = participant.mediaConsentAcknowledged !== false;

        // Validate required fields
        const requiredFields = ['fullName', 'dateOfBirth', 'gender', 'phone', 'email', 'address', 'schoolOrEmployer'];
        const missingFields = requiredFields.filter(field => !participant[field]);
        
        if (missingFields.length > 0) {
          setError(`Row ${i + 2}: Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        // Validate gender
        if (!['Male', 'Female'].includes(participant.gender)) {
          setError(`Row ${i + 2}: Gender must be 'Male' or 'Female'`);
          return;
        }

        // Validate player skill level
        if (participant.playerSkillLevel && !['Professional', 'Advanced', 'Intermediate', 'Beginner'].includes(participant.playerSkillLevel)) {
          setError(`Row ${i + 2}: Player skill level must be one of: Professional, Advanced, Intermediate, Beginner`);
          return;
        }

        parsedParticipants.push(participant as Participant);
      }

      if (parsedParticipants.length === 0) {
        setError('No valid participant data found in the file');
        return;
      }

      if (parsedParticipants.length > 32) {
        setError(`Maximum 32 participants allowed. Found ${parsedParticipants.length}`);
        return;
      }

      setParticipants(parsedParticipants);
      setPreviewMode(true);
      setSuccess(`Successfully parsed ${parsedParticipants.length} participants`);

    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setError('Failed to parse Excel file. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (participants.length === 0) {
      setError('No participants to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sessionId = getSessionId();
      if (!sessionId) {
        setError('No active session found. Please log in again.');
        return;
      }

      const response = await fetch('/api/admin/participants/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          tournamentId,
          participants
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully uploaded ${participants.length} participants!`);
        onUploadSuccess(participants);
        
        // Reset form
        setFile(null);
        setParticipants([]);
        setPreviewMode(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload participants');
      }
    } catch (error) {
      console.error('Error uploading participants:', error);
      setError('Failed to upload participants');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setParticipants([]);
    setPreviewMode(false);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateTemplate = () => {
    const templateData = [
      ['Full Name', 'Date of Birth', 'Gender', 'Phone', 'Email', 'Address', 'School/Employer', 'Player Skill Level'],
      ['John Doe', '1990-01-01', 'Male', '1234567890', 'john@example.com', '123 Main St', 'ABC School', 'Intermediate'],
      ['Jane Smith', '1992-05-15', 'Female', '0987654321', 'jane@example.com', '456 Oak Ave', 'XYZ Company', 'Advanced']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    
    XLSX.writeFile(wb, 'participants-template.xlsx');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewMode ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Excel File:</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: .xlsx, .xls, .csv (Max size: 5MB)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={parseExcelFile}
                  disabled={!file || loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Parse File
                </Button>
                <Button
                  onClick={generateTemplate}
                  variant="outline"
                  className="flex-1"
                >
                  Download Template
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Preview ({participants.length} participants)</h3>
                  <Badge variant="secondary">{participants.length}/32</Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Phone</th>
                        <th className="p-2 text-left">Skill Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.slice(0, 10).map((participant, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{participant.fullName}</td>
                          <td className="p-2">{participant.email}</td>
                          <td className="p-2">{participant.phone}</td>
                          <td className="p-2">{participant.playerSkillLevel || 'Not specified'}</td>
                        </tr>
                      ))}
                      {participants.length > 10 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-gray-500">
                            ... and {participants.length - 10} more participants
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Upload {participants.length} Participants
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
