#!/usr/bin/env node

/**
 * Security Testing Script for Badminton Tournament Website
 * Tests all security measures implemented in Feature #45
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

class SecurityTester {
  constructor() {
    this.results = [];
    this.sessionId = null;
    this.cookieJar = {}; // simple cookie jar
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: { ...(options.headers || {}) },
        ...options
      };

      // Attach cookies from jar
      const cookieHeader = Object.entries(this.cookieJar)
        .map(([k,v]) => `${k}=${encodeURIComponent(v)}`)
        .join('; ');
      if (cookieHeader) {
        requestOptions.headers['Cookie'] = cookieHeader;
      }

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          // Capture Set-Cookie headers into jar
          const setCookie = res.headers['set-cookie'];
          if (Array.isArray(setCookie)) {
            for (const c of setCookie) {
              const [pair] = c.split(';');
              const [name, value] = pair.split('=');
              if (name && value !== undefined) this.cookieJar[name.trim()] = decodeURIComponent(value);
            }
          }
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async testAuthentication() {
    this.log('Testing Authentication & Authorization...', 'TEST');
    
    // Prefetch base page to get CSRF cookie
    try {
      await this.makeRequest(`${BASE_URL}/`);
    } catch {}

    // Test 1: Admin login with valid credentials
    try {
      const csrf = this.cookieJar['csrf-token'] || '';
      const loginResponse = await this.makeRequest(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: ADMIN_CREDENTIALS
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        // Prefer cookie-based session; also store header value for legacy header tests
        const cookie = loginResponse.headers['set-cookie']?.find(c => c.startsWith('admin-session='));
        this.sessionId = cookie ? cookie.split(';')[0].split('=')[1] : null;
        this.log('✓ Admin login successful', 'PASS');
        this.results.push({ test: 'Admin Login', status: 'PASS', details: 'Valid credentials accepted' });
      } else {
        this.log('✗ Admin login failed', 'FAIL');
        this.results.push({ test: 'Admin Login', status: 'FAIL', details: 'Login failed' });
      }
    } catch (error) {
      this.log(`✗ Admin login error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'Admin Login', status: 'FAIL', details: error.message });
    }

    // Test 2: Access admin endpoint without authentication
    try {
      const noAuthResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`);
      
      if (noAuthResponse.status === 401) {
        this.log('✓ Unauthenticated access blocked', 'PASS');
        this.results.push({ test: 'Unauthenticated Access', status: 'PASS', details: 'Properly blocked' });
      } else {
        this.log('✗ Unauthenticated access allowed', 'FAIL');
        this.results.push({ test: 'Unauthenticated Access', status: 'FAIL', details: 'Should be blocked' });
      }
    } catch (error) {
      this.log(`✗ Unauthenticated access test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'Unauthenticated Access', status: 'FAIL', details: error.message });
    }

    // Test 3: Access admin endpoint with valid session
    if (this.sessionId) {
      try {
        const authResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`, {
          headers: { 'x-session-id': this.sessionId }
        });
        
        if (authResponse.status === 200) {
          this.log('✓ Authenticated access allowed', 'PASS');
          this.results.push({ test: 'Authenticated Access', status: 'PASS', details: 'Properly allowed' });
        } else {
          this.log('✗ Authenticated access blocked', 'FAIL');
          this.results.push({ test: 'Authenticated Access', status: 'FAIL', details: 'Should be allowed' });
        }
      } catch (error) {
        this.log(`✗ Authenticated access test error: ${error.message}`, 'FAIL');
        this.results.push({ test: 'Authenticated Access', status: 'FAIL', details: error.message });
      }
    }
  }

  async testInputValidation() {
    this.log('Testing Input Validation & Sanitization...', 'TEST');
    
    // Test 1: SQL Injection attempt
    try {
      const sqlInjectionResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId || 'fake-session'
        },
        body: {
          name: "'; DROP TABLE tournaments; --",
          sport: "'; DELETE FROM users; --",
          format: "'; UPDATE passwords SET hash='hacked'; --"
        }
      });
      
      if (sqlInjectionResponse.status === 400 || sqlInjectionResponse.status === 401) {
        this.log('✓ SQL Injection blocked', 'PASS');
        this.results.push({ test: 'SQL Injection Prevention', status: 'PASS', details: 'Malicious input blocked' });
      } else {
        this.log('✗ SQL Injection allowed', 'FAIL');
        this.results.push({ test: 'SQL Injection Prevention', status: 'FAIL', details: 'Malicious input accepted' });
      }
    } catch (error) {
      this.log(`✗ SQL Injection test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'SQL Injection Prevention', status: 'FAIL', details: error.message });
    }

    // Test 2: XSS attempt
    try {
      const xssResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId || 'fake-session'
        },
        body: {
          name: "<script>alert('XSS')</script>",
          sport: "<img src=x onerror=alert('XSS')>",
          format: "javascript:alert('XSS')"
        }
      });
      
      if (xssResponse.status === 400 || xssResponse.status === 401) {
        this.log('✓ XSS blocked', 'PASS');
        this.results.push({ test: 'XSS Prevention', status: 'PASS', details: 'Malicious input blocked' });
      } else {
        this.log('✗ XSS allowed', 'FAIL');
        this.results.push({ test: 'XSS Prevention', status: 'FAIL', details: 'Malicious input accepted' });
      }
    } catch (error) {
      this.log(`✗ XSS test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'XSS Prevention', status: 'FAIL', details: error.message });
    }

    // Test 3: Path Traversal attempt
    try {
      const pathTraversalResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId || 'fake-session'
        },
        body: {
          name: "../../../etc/passwd",
          sport: "..\\..\\..\\windows\\system32\\config\\sam",
          format: "....//....//....//etc/shadow"
        }
      });
      
      if (pathTraversalResponse.status === 400 || pathTraversalResponse.status === 401) {
        this.log('✓ Path Traversal blocked', 'PASS');
        this.results.push({ test: 'Path Traversal Prevention', status: 'PASS', details: 'Malicious input blocked' });
      } else {
        this.log('✗ Path Traversal allowed', 'FAIL');
        this.results.push({ test: 'Path Traversal Prevention', status: 'FAIL', details: 'Malicious input accepted' });
      }
    } catch (error) {
      this.log(`✗ Path Traversal test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'Path Traversal Prevention', status: 'FAIL', details: error.message });
    }
  }

  async testRateLimiting() {
    this.log('Testing Rate Limiting...', 'TEST');
    
    // Test rapid requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(this.makeRequest(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ADMIN_CREDENTIALS
      }));
    }
    
    try {
      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(r => r.status === 429).length;
      
      if (blockedRequests > 0) {
        this.log('✓ Rate limiting working', 'PASS');
        this.results.push({ test: 'Rate Limiting', status: 'PASS', details: `${blockedRequests} requests blocked` });
      } else {
        this.log('✗ Rate limiting not working', 'FAIL');
        this.results.push({ test: 'Rate Limiting', status: 'FAIL', details: 'No requests blocked' });
      }
    } catch (error) {
      this.log(`✗ Rate limiting test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'Rate Limiting', status: 'FAIL', details: error.message });
    }
  }

  async testCSRFProtection() {
    this.log('Testing CSRF Protection...', 'TEST');
    
    // Test without CSRF token
    try {
      const noCsrfResponse = await this.makeRequest(`${BASE_URL}/api/admin/tournaments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId || 'fake-session'
        },
        body: { name: 'Test Tournament' }
      });
      
      if (noCsrfResponse.status === 400 || noCsrfResponse.status === 401) {
        this.log('✓ CSRF protection working', 'PASS');
        this.results.push({ test: 'CSRF Protection', status: 'PASS', details: 'Request without CSRF token blocked' });
      } else {
        this.log('✗ CSRF protection not working', 'FAIL');
        this.results.push({ test: 'CSRF Protection', status: 'FAIL', details: 'Request without CSRF token accepted' });
      }
    } catch (error) {
      this.log(`✗ CSRF test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'CSRF Protection', status: 'FAIL', details: error.message });
    }
  }

  async testFileUploadSecurity() {
    this.log('Testing File Upload Security...', 'TEST');
    
    // Test malicious file upload
    try {
      const maliciousFileResponse = await this.makeRequest(`${BASE_URL}/api/admin/participants/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId || 'fake-session'
        },
        body: {
          tournamentId: 'TID-0001',
          participants: [{
            fullName: 'Test User',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            phone: '1234567890',
            email: 'test@example.com',
            address: 'Test Address',
            schoolOrEmployer: 'Test School',
            playerPhoto: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoJ1hTUycpPjwvc3ZnPg==', // XSS in SVG
            emergencyContactName: 'Emergency Contact',
            emergencyContactRelationship: 'Parent',
            emergencyContactPhone: '0987654321',
            knownAllergies: 'None',
            priorMedicalConditions: 'None',
            currentMedications: 'None',
            medicalReleaseConsent: true,
            playerSkillLevel: 'Beginner',
            pastPerformance: 'None',
            waiversAcknowledged: true,
            mediaConsentAcknowledged: true,
            paymentScreenshot: 'malicious.php', // PHP file
            transactionId: 'TXN-001'
          }]
        }
      });
      
      if (maliciousFileResponse.status === 400 || maliciousFileResponse.status === 401) {
        this.log('✓ Malicious file upload blocked', 'PASS');
        this.results.push({ test: 'File Upload Security', status: 'PASS', details: 'Malicious file blocked' });
      } else {
        this.log('✗ Malicious file upload allowed', 'FAIL');
        this.results.push({ test: 'File Upload Security', status: 'FAIL', details: 'Malicious file accepted' });
      }
    } catch (error) {
      this.log(`✗ File upload security test error: ${error.message}`, 'FAIL');
      this.results.push({ test: 'File Upload Security', status: 'FAIL', details: error.message });
    }
  }

  async runAllTests() {
    this.log('Starting Security Test Suite...', 'START');
    
    await this.testAuthentication();
    await this.testInputValidation();
    await this.testRateLimiting();
    await this.testCSRFProtection();
    await this.testFileUploadSecurity();
    
    this.generateReport();
  }

  generateReport() {
    this.log('Generating Security Test Report...', 'REPORT');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${passRate}%)`);
    console.log(`Failed: ${failedTests}`);
    console.log('='.repeat(60));
    
    this.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✓' : '✗';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
    });
    
    console.log('='.repeat(60));
    
    if (failedTests === 0) {
      this.log('🎉 All security tests passed! Website is secure.', 'SUCCESS');
    } else {
      this.log(`⚠️  ${failedTests} security tests failed. Please review and fix.`, 'WARNING');
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SecurityTester;
