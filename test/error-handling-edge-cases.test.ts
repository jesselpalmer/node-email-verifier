import { ErrorCode } from '../src/errors.js';
import emailValidator from '../src/index.js';
import type { MxRecord } from 'dns';

describe('Error Handling Edge Cases', () => {
  describe('DNS Server Connection Errors', () => {
    test('should handle ECONNREFUSED when DNS server is down', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('connect ECONNREFUSED 8.8.8.8:53') as any;
        error.code = 'ECONNREFUSED';
        error.errno = -61;
        error.syscall = 'connect';
        error.address = '8.8.8.8';
        error.port = 53;
        throw error;
      };

      const result = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('DNS lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should handle ECONNREFUSED with custom DNS server', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('connect ECONNREFUSED 192.168.1.1:53') as any;
        error.code = 'ECONNREFUSED';
        error.errno = -61;
        error.syscall = 'connect';
        error.address = '192.168.1.1';
        error.port = 53;
        throw error;
      };

      const result = await emailValidator('test@customdns.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('DNS lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });
  });

  describe('Timeout vs Not Found Differentiation', () => {
    test('should differentiate ETIMEDOUT from ENOTFOUND', async () => {
      // Test ETIMEDOUT
      const timeoutMock = async (/* hostname: string */) => {
        const error = new Error('queryA ETIMEDOUT example.com') as any;
        error.code = 'ETIMEDOUT';
        error.errno = -60;
        error.syscall = 'queryA';
        error.hostname = 'example.com';
        throw error;
      };

      const timeoutResult = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: timeoutMock,
      } as any);

      expect(timeoutResult.valid).toBe(false);
      expect(timeoutResult.mx?.reason).toContain('DNS lookup failed');
      expect(timeoutResult.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);

      // Test ENOTFOUND
      const notFoundMock = async (/* hostname: string */) => {
        const error = new Error(
          'getaddrinfo ENOTFOUND nonexistent.domain'
        ) as any;
        error.code = 'ENOTFOUND';
        error.errno = -3008;
        error.syscall = 'getaddrinfo';
        error.hostname = 'nonexistent.domain';
        throw error;
      };

      const notFoundResult = await emailValidator('test@nonexistent.domain', {
        checkMx: true,
        detailed: true,
        _resolveMx: notFoundMock,
      } as any);

      expect(notFoundResult.valid).toBe(false);
      expect(notFoundResult.mx?.reason).toContain('DNS lookup failed');
      expect(notFoundResult.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should handle network unreachable errors', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('getaddrinfo ENETUNREACH') as any;
        error.code = 'ENETUNREACH';
        error.errno = -101;
        error.syscall = 'getaddrinfo';
        throw error;
      };

      const result = await emailValidator('test@unreachable.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });
  });

  describe('Malformed DNS Responses', () => {
    test('should handle empty DNS response gracefully', async () => {
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        return [];
      };

      const result = await emailValidator('test@empty-mx.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('No MX records found');
      expect(result.mx?.errorCode).toBe(ErrorCode.NO_MX_RECORDS);
    });

    test('should handle malformed MX record data', async () => {
      const mockResolveMx = async (/* hostname: string */): Promise<
        MxRecord[]
      > => {
        return [
          { priority: NaN, exchange: 'mail.example.com' },
          { priority: -1, exchange: '' },
          { priority: 10, exchange: null as any },
        ] as MxRecord[];
      };

      const result = await emailValidator('test@malformed.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      // Should still consider valid as long as array has items
      expect(result.valid).toBe(true);
      expect(result.mx?.records).toHaveLength(3);
    });

    test('should handle DNS response with undefined', async () => {
      const mockResolveMx = async (/* hostname: string */): Promise<any> => {
        return undefined;
      };

      const result = await emailValidator('test@undefined-response.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('No MX records found');
      expect(result.mx?.errorCode).toBe(ErrorCode.NO_MX_RECORDS);
    });

    test('should handle DNS response with null', async () => {
      const mockResolveMx = async (/* hostname: string */): Promise<any> => {
        return null;
      };

      const result = await emailValidator('test@null-response.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('No MX records found');
      expect(result.mx?.errorCode).toBe(ErrorCode.NO_MX_RECORDS);
    });
  });

  describe('Concurrent Request Error Handling', () => {
    test('should handle errors in concurrent validations', async () => {
      const errorMessages = [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
      ];

      const emails = errorMessages.map((_, i) => `test${i}@concurrent.com`);

      const mockResolvers = errorMessages.map(
        (msg) => async (/* hostname: string */) => {
          throw new Error(msg);
        }
      );

      const promises = emails.map((email, i) =>
        emailValidator(email, {
          checkMx: true,
          detailed: true,
          _resolveMx: mockResolvers[i],
        } as any).catch((error) => ({ error }))
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).not.toHaveProperty('error');
        expect((result as any).valid).toBe(false);
      });

      // Verify DNS errors are properly categorized
      expect((results[0] as any).mx?.errorCode).toBe(
        ErrorCode.DNS_LOOKUP_FAILED
      ); // ECONNREFUSED
      expect((results[1] as any).mx?.errorCode).toBe(
        ErrorCode.DNS_LOOKUP_FAILED
      ); // ETIMEDOUT
      expect((results[2] as any).mx?.errorCode).toBe(
        ErrorCode.DNS_LOOKUP_FAILED
      ); // ENOTFOUND
      expect((results[3] as any).mx?.errorCode).toBe(
        ErrorCode.MX_LOOKUP_FAILED
      ); // ENETUNREACH
    });
  });

  describe('DNS Server Timeout Scenarios', () => {
    test('should handle DNS query timeout', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('queryMx ETIMEOUT example.com') as any;
        error.code = 'ETIMEOUT';
        error.errno = -4039;
        error.syscall = 'queryMx';
        error.hostname = 'example.com';
        throw error;
      };

      const result = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });

    test('should handle DNS server not responding', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('queryA ESERVFAIL example.com') as any;
        error.code = 'ESERVFAIL';
        error.errno = -4040;
        error.syscall = 'queryA';
        error.hostname = 'example.com';
        throw error;
      };

      const result = await emailValidator('test@servfail.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });
  });

  describe('Special DNS Error Cases', () => {
    test('should handle NXDOMAIN errors', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('queryMx ENOTFOUND nonexistent.tld') as any;
        error.code = 'ENOTFOUND';
        error.errno = -3003;
        error.syscall = 'queryMx';
        error.hostname = 'nonexistent.tld';
        throw error;
      };

      const result = await emailValidator('test@nonexistent.tld', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('DNS lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should handle NODATA errors (domain exists but no MX)', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error('queryMx ENODATA example.com') as any;
        error.code = 'ENODATA';
        error.errno = -3007;
        error.syscall = 'queryMx';
        error.hostname = 'example.com';
        throw error;
      };

      const result = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('DNS lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should handle circular CNAME references', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        const error = new Error(
          'queryMx ECIRCULAR circular.example.com'
        ) as any;
        error.code = 'ECIRCULAR';
        throw error;
      };

      const result = await emailValidator('test@circular.example.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toContain('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });
  });

  describe('Non-DNS Error Scenarios', () => {
    test('should handle generic errors differently from DNS errors', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        throw new Error('Something went wrong');
      };

      const result = await emailValidator('test@generic-error.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toBe('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });

    test('should handle non-Error objects thrown', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        throw 'String error';
      };

      const result = await emailValidator('test@string-error.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toBe('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });

    test('should handle null/undefined errors', async () => {
      const mockResolveMx = async (/* hostname: string */) => {
        throw null;
      };

      const result = await emailValidator('test@null-error.com', {
        checkMx: true,
        detailed: true,
        _resolveMx: mockResolveMx,
      } as any);

      expect(result.valid).toBe(false);
      expect(result.mx?.reason).toBe('MX lookup failed');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_LOOKUP_FAILED);
    });
  });
});
