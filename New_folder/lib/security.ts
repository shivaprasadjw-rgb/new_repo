import crypto from 'crypto';

// Input validation and sanitization
export class SecurityValidator {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
      .slice(0, 10000); // Max length
  }

  // Sanitize plain text
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 1000);
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate phone number (basic)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Validate URL
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate file type for uploads
  static isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  // Validate file size
  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  // Generate CSRF token
  static generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate CSRF token
  static validateCsrfToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length === 64;
  }

  // Rate limiting helper
  static generateRateLimitKey(ip: string, action: string): string {
    return `${ip}:${action}`;
  }

  // Input length validation
  static validateLength(input: string, min: number, max: number): boolean {
    return input.length >= min && input.length <= max;
  }

  // SQL injection prevention (basic)
  static containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,
      /(--|\/\*|\*\/)/,
      /(\b(WAITFOR|DELAY)\b)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS prevention
  static containsXss(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Path traversal prevention
  static containsPathTraversal(input: string): boolean {
    const pathPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /\/etc\/passwd/,
      /\/windows\/system32/,
      /\/proc\/version/
    ];
    
    return pathPatterns.some(pattern => pattern.test(input));
  }

  // Comprehensive input validation
  static validateInput(input: any, rules: ValidationRules): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      sanitized: input
    };

    if (input === null || input === undefined) {
      result.isValid = false;
      result.errors.push('Input is required');
      return result;
    }

    const stringInput = String(input);

    // Check for malicious patterns
    if (this.containsSqlInjection(stringInput)) {
      result.isValid = false;
      result.errors.push('Input contains potentially malicious SQL patterns');
    }

    if (this.containsXss(stringInput)) {
      result.isValid = false;
      result.errors.push('Input contains potentially malicious XSS patterns');
    }

    if (this.containsPathTraversal(stringInput)) {
      result.isValid = false;
      result.errors.push('Input contains potentially malicious path patterns');
    }

    // Length validation
    if (rules.minLength && !this.validateLength(stringInput, rules.minLength, rules.maxLength || 1000)) {
      result.isValid = false;
      result.errors.push(`Input length must be between ${rules.minLength} and ${rules.maxLength || 1000} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringInput)) {
      result.isValid = false;
      result.errors.push('Input format is invalid');
    }

    // Type-specific validation
    if (rules.type === 'email' && !this.isValidEmail(stringInput)) {
      result.isValid = false;
      result.errors.push('Invalid email format');
    }

    if (rules.type === 'phone' && !this.isValidPhone(stringInput)) {
      result.isValid = false;
      result.errors.push('Invalid phone number format');
    }

    if (rules.type === 'url' && !this.isValidUrl(stringInput)) {
      result.isValid = false;
      result.errors.push('Invalid URL format');
    }

    // Sanitize if valid
    if (result.isValid) {
      if (rules.sanitize === 'html') {
        result.sanitized = this.sanitizeHtml(stringInput);
      } else if (rules.sanitize === 'text') {
        result.sanitized = this.sanitizeText(stringInput);
      }
    }

    return result;
  }
}

// Validation rules interface
export interface ValidationRules {
  type?: 'text' | 'email' | 'phone' | 'url' | 'number';
  sanitize?: 'html' | 'text' | 'none';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: any;
}

// File upload security
export class FileSecurity {
  static readonly ALLOWED_EXTENSIONS = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    document: ['.pdf', '.doc', '.docx', '.txt'],
    spreadsheet: ['.xlsx', '.xls', '.csv']
  };

  static readonly MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    spreadsheet: 5 * 1024 * 1024 // 5MB
  };

  static validateFile(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      sanitized: file
    };

    // Check file size
    if (!this.isValidFileSize(file.size, maxSize)) {
      result.isValid = false;
      result.errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file extension
    if (!this.isValidFileType(file.name, allowedTypes)) {
      result.isValid = false;
      result.errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file name for malicious patterns
    if (SecurityValidator.containsPathTraversal(file.name)) {
      result.isValid = false;
      result.errors.push('File name contains potentially malicious patterns');
    }

    return result;
  }

  static isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(`.${extension}`) : false;
  }

  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

