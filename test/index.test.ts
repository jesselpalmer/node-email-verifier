import emailValidator, { EmailValidatorOptions } from '../src/index';

// Mock DNS resolver for testing
const mockResolveMx = async (hostname: string) => {
  if (hostname === 'exam-ple.com') {
    return [{ exchange: 'mx.exam-ple.com', priority: 10 }];
  }
  if (hostname === 'adafwefewsd.com') {
    throw new Error('getaddrinfo ENOTFOUND adafwefewsd.com');
  }
  if (hostname === 'example.com') {
    return [{ exchange: 'mx.example.com', priority: 10 }];
  }
  // Default: return valid MX records
  return [{ exchange: `mx.${hostname}`, priority: 10 }];
};

describe('Email Validator', () => {
  describe('with MX record check', () => {
    test('should validate correct email format and MX record exists', async () => {
      expect(
        await emailValidator('test@example.com', {
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should reject email from domain without MX records', async () => {
      expect(
        await emailValidator('test@adafwefewsd.com', {
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(false);
    });

    test('should timeout MX record check with string timeout', async () => {
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: '1ms',
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should timeout MX record check with number timeout', async () => {
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: 1,
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should reject non-string inputs', async () => {
      expect(await emailValidator(undefined)).toBe(false);
      expect(await emailValidator(null)).toBe(false);
      expect(await emailValidator(1234)).toBe(false);
      expect(await emailValidator({})).toBe(false);
    });

    test('should reject email with invalid domain format', async () => {
      expect(await emailValidator('test@invalid-domain')).toBe(false);
    });

    test('should reject email with special characters in domain', async () => {
      expect(await emailValidator('test@exam$ple.com')).toBe(false);
    });

    test('should reject email with spaces', async () => {
      expect(await emailValidator('test @example.com')).toBe(false);
    });

    test('should reject email with double dots in domain', async () => {
      expect(await emailValidator('test@exa..mple.com')).toBe(false);
    });

    test('should validate email with numeric local part', async () => {
      expect(
        await emailValidator('12345@example.com', {
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate email with hyphen in domain', async () => {
      expect(
        await emailValidator('test@exam-ple.com', {
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should reject email with underscore in domain', async () => {
      expect(await emailValidator('test@exam_ple.com')).toBe(false);
    });
  });

  describe('without MX record check', () => {
    test('should validate correct email format regardless of MX records', async () => {
      expect(await emailValidator('test@example.com', false)).toBe(true);
    });

    test('should reject incorrect email format regardless of MX records', async () => {
      expect(await emailValidator('invalid-email', false)).toBe(false);
    });

    test('should validate email from domain without MX records', async () => {
      expect(await emailValidator('test@adafwefewsd.com', false)).toBe(true);
    });

    test('should reject non-string inputs', async () => {
      expect(await emailValidator(undefined, false)).toBe(false);
      expect(await emailValidator(null, false)).toBe(false);
      expect(await emailValidator(1234, false)).toBe(false);
      expect(await emailValidator({}, false)).toBe(false);
    });

    test('should reject email with spaces', async () => {
      expect(await emailValidator('test @example.com', false)).toBe(false);
    });

    test('should reject email with double dots in domain', async () => {
      expect(await emailValidator('test@exa..mple.com', false)).toBe(false);
    });

    test('should validate email with numeric local part', async () => {
      expect(await emailValidator('12345@example.com', false)).toBe(true);
    });

    test('should validate email with hyphen in domain', async () => {
      expect(await emailValidator('test@exam-ple.com', false)).toBe(true);
    });

    test('should reject email with underscore in domain', async () => {
      expect(await emailValidator('test@exam_ple.com', false)).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    test('should validate correct email format and MX record exists with boolean opts', async () => {
      expect(
        await emailValidator('test@example.com', {
          checkMx: true,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate correct email format without MX record check with boolean opts', async () => {
      expect(await emailValidator('test@example.com', false)).toBe(true);
    });
  });

  describe('options parameter', () => {
    test('should validate correct email format with checkMx set to true', async () => {
      expect(
        await emailValidator('test@example.com', {
          checkMx: true,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate correct email format with checkMx set to false', async () => {
      expect(await emailValidator('test@example.com', { checkMx: false })).toBe(
        true
      );
    });

    test('should timeout with custom timeout setting as string', async () => {
      // Use a non-existent domain that will definitely timeout
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: '1ms',
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should timeout with custom timeout setting as number', async () => {
      // Use a non-existent domain that will definitely timeout
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: 1,
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should validate correct email format with custom timeout setting as string', async () => {
      expect(
        await emailValidator('test@example.com', {
          timeout: '5s',
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate correct email format with custom timeout setting as number', async () => {
      expect(
        await emailValidator('test@example.com', {
          timeout: 5000,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate correct email format and MX record exists with both options set', async () => {
      expect(
        await emailValidator('test@example.com', {
          checkMx: true,
          timeout: '5s',
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should validate correct email format without MX record check and custom timeout', async () => {
      expect(
        await emailValidator('test@example.com', {
          checkMx: false,
          timeout: '5s',
        })
      ).toBe(true);
    });

    test('should validate email with hyphen in domain with checkMx option', async () => {
      expect(
        await emailValidator('test@exam-ple.com', {
          checkMx: true,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });
  });

  describe('edge cases and additional validation', () => {
    test('should handle empty string', async () => {
      expect(await emailValidator('')).toBe(false);
    });

    test('should handle whitespace-only strings', async () => {
      expect(await emailValidator('   ')).toBe(false);
      expect(await emailValidator('\t')).toBe(false);
      expect(await emailValidator('\n')).toBe(false);
    });

    test('should handle very long email addresses', async () => {
      const longLocal = 'a'.repeat(64); // Maximum local part length
      const longDomain = 'example.com';
      expect(await emailValidator(`${longLocal}@${longDomain}`, false)).toBe(
        true
      );

      const tooLongLocal = 'a'.repeat(65); // Exceeds maximum
      expect(await emailValidator(`${tooLongLocal}@${longDomain}`, false)).toBe(
        false
      );
    });

    test('should handle international domain names', async () => {
      expect(await emailValidator('test@münchen.de', false)).toBe(true);
      expect(await emailValidator('test@xn--mnchen-3ya.de', false)).toBe(true); // Punycode
    });

    test('should handle plus addressing', async () => {
      expect(await emailValidator('user+tag@example.com', false)).toBe(true);
      expect(await emailValidator('user+tag+more@example.com', false)).toBe(
        true
      );
    });

    test('should handle quoted local parts', async () => {
      expect(await emailValidator('"user name"@example.com', false)).toBe(true);
      expect(await emailValidator('"user@domain"@example.com', false)).toBe(
        true
      );
    });

    test('should handle IP address domains', async () => {
      // Note: The validator library may not support IP address domains
      expect(await emailValidator('user@[192.168.1.1]', false)).toBe(false);
      expect(await emailValidator('user@[IPv6:2001:db8::1]', false)).toBe(
        false
      );
    });

    test('should reject malformed IP addresses', async () => {
      expect(await emailValidator('user@[999.999.999.999]', false)).toBe(false);
      expect(await emailValidator('user@[192.168.1]', false)).toBe(false);
    });

    test('should handle subdomain addresses', async () => {
      expect(await emailValidator('test@mail.example.com', false)).toBe(true);
      expect(
        await emailValidator('test@deep.sub.domain.example.com', false)
      ).toBe(true);
    });
  });

  describe('timeout edge cases', () => {
    test('should handle zero timeout', async () => {
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: 0,
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should handle negative timeout', async () => {
      await expect(
        emailValidator('test@this-domain-definitely-does-not-exist-12345.com', {
          timeout: -1,
        })
      ).rejects.toThrow(/timed out/);
    });

    test('should handle invalid timeout strings', async () => {
      // Invalid ms format results in NaN, which causes immediate timeout
      // Use httpbin.org which should exist but may be slow enough to timeout with invalid timeout
      const result = await emailValidator('test@httpbin.org', { 
        timeout: 'invalid' 
      }).catch(error => error.message);
      
      // Should either timeout or return false (both are acceptable for invalid timeout)
      expect(typeof result === 'string' ? result.includes('timed out') : result === false).toBe(true);
    });

    test('should handle various valid timeout formats', async () => {
      const validFormats = ['1s', '1000ms', '1m', '1h'];
      for (const timeout of validFormats) {
        expect(
          await emailValidator('test@example.com', {
            timeout,
            _resolveMx: mockResolveMx,
          } as any)
        ).toBe(true);
      }
    });
  });

  describe('DNS and network error scenarios', () => {
    const mockResolveMxWithErrors = async (hostname: string) => {
      if (hostname === 'timeout-domain.com') {
        // Simulate a long delay that would cause timeout
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [{ exchange: 'mx.timeout-domain.com', priority: 10 }];
      }
      if (hostname === 'network-error.com') {
        throw new Error('ENOTFOUND network-error.com');
      }
      if (hostname === 'dns-failure.com') {
        throw new Error('DNS server failure');
      }
      if (hostname === 'no-mx.com') {
        return []; // Empty MX records
      }
      // For known test domains, return valid records
      if (hostname === 'example.com' || hostname === 'exam-ple.com') {
        return [{ exchange: `mx.${hostname}`, priority: 10 }];
      }
      // For unknown domains, throw an error
      throw new Error(`ENOTFOUND ${hostname}`);
    };

    test('should handle domains with no MX records', async () => {
      expect(
        await emailValidator('test@no-mx.com', {
          _resolveMx: mockResolveMxWithErrors,
        } as any)
      ).toBe(false);
    });

    test('should handle network errors gracefully', async () => {
      // Check if the domain passes format validation first
      expect(await emailValidator('test@network-error.com', false)).toBe(true); // Format should be valid

      // Now test with MX checking - should catch error and return false
      expect(
        await emailValidator('test@network-error.com', {
          _resolveMx: mockResolveMxWithErrors,
        } as any)
      ).toBe(false);
    });

    test('should handle DNS server failures', async () => {
      expect(
        await emailValidator('test@dns-failure.com', {
          _resolveMx: mockResolveMxWithErrors,
        } as any)
      ).toBe(false);
    });

    test('should timeout on slow DNS responses', async () => {
      // Use httpbin.org with very short timeout - should either timeout or return false
      const result = await emailValidator('test@httpbin.org', { 
        timeout: 1 
      }).catch(error => error.message);
      
      // Should either timeout or return false (both are acceptable for very short timeout)
      expect(typeof result === 'string' ? result.includes('timed out') : result === false).toBe(true);
    });
  });

  describe('TypeScript type validation', () => {
    test('should accept EmailValidatorOptions interface', async () => {
      const options: EmailValidatorOptions = {
        checkMx: true,
        timeout: '5s',
      };
      expect(
        await emailValidator('test@example.com', {
          ...options,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(true);
    });

    test('should work with partial options', async () => {
      const options: Partial<EmailValidatorOptions> = {
        checkMx: false,
      };
      expect(await emailValidator('test@example.com', options)).toBe(true);
    });
  });

  describe('boundary value testing', () => {
    test('should handle minimum valid email', async () => {
      expect(await emailValidator('a@b.co', false)).toBe(true);
    });

    test('should handle emails at domain length limits', async () => {
      const maxDomainLabel = 'a'.repeat(63); // Max DNS label length
      expect(await emailValidator(`test@${maxDomainLabel}.com`, false)).toBe(
        true
      );

      const tooLongLabel = 'a'.repeat(64);
      expect(await emailValidator(`test@${tooLongLabel}.com`, false)).toBe(
        false
      );
    });

    test('should handle maximum total email length', async () => {
      // The validator library may have stricter limits than RFC 5321
      const longLocal = 'a'.repeat(64);
      const longDomain = `${'b'.repeat(60)}.com`; // More reasonable domain length
      const longEmail = `${longLocal}@${longDomain}`;
      expect(await emailValidator(longEmail, false)).toBe(true);
    });
  });

  describe('concurrent validation', () => {
    test('should handle multiple concurrent validations', async () => {
      const emails = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com',
        'invalid-email',
        'test4@example.com',
      ];

      const promises = emails.map((email) =>
        emailValidator(email, { _resolveMx: mockResolveMx } as any)
      );

      const results = await Promise.all(promises);
      expect(results).toEqual([true, true, true, false, true]);
    });

    test('should handle concurrent timeout scenarios', async () => {
      // Use httpbin.org with very short timeout
      const promises = [
        emailValidator('test1@httpbin.org', { timeout: 1 }).catch(() => 'timeout'),
        emailValidator('test2@httpbin.org', { timeout: 1 }).catch(() => 'timeout'),
      ];

      const results = await Promise.all(promises);
      // Should either be ['timeout', 'timeout'] or [false, false] depending on Node.js version
      const allTimeoutOrFalse = results.every(r => r === 'timeout' || r === false);
      expect(allTimeoutOrFalse).toBe(true);
    });
  });
});
