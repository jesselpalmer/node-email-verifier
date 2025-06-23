import emailValidator, {
  EmailValidatorOptions,
  ValidationResult,
  ErrorCode,
  globalMxCache,
} from '../src/index.js';
import { EmailValidationError } from '../src/errors.js';

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

// Slow mock resolver for timeout testing
const slowMockResolveMx = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
  return [{ exchange: 'mx.example.com', priority: 10 }];
};

// Helper function to assert error codes and validation results
const expectValidationError = (
  result: ValidationResult,
  expectedErrorCode: ErrorCode,
  section?: 'format' | 'mx' | 'disposable'
) => {
  expect(result.valid).toBe(false);
  expect(result.errorCode).toBe(expectedErrorCode);

  if (section) {
    expect(result[section]?.valid).toBe(false);
    expect(result[section]?.errorCode).toBe(expectedErrorCode);
  }
};

describe('Email Validator', () => {
  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    globalMxCache.flush();
    globalMxCache.resetStatistics();
  });

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

    test('should timeout MX record check with string timeout and throw EmailValidationError', async () => {
      expect.assertions(3);
      try {
        await emailValidator('test@example.com', {
          timeout: '1ms',
          _resolveMx: slowMockResolveMx,
        } as any);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailValidationError);
        expect(error.message).toBe('DNS lookup timed out');
        expect(error).toMatchObject({
          code: ErrorCode.DNS_LOOKUP_TIMEOUT,
        });
      }
    });

    test('should timeout MX record check with number timeout and throw EmailValidationError', async () => {
      expect.assertions(3);
      try {
        await emailValidator('test@example.com', {
          timeout: 1,
          _resolveMx: slowMockResolveMx,
        } as any);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EmailValidationError);
        expect(error.message).toBe('DNS lookup timed out');
        expect(error).toMatchObject({
          code: ErrorCode.DNS_LOOKUP_TIMEOUT,
        });
      }
    });

    test('should accept various valid ms.StringValue timeout formats', async () => {
      // Test various valid string formats
      const validTimeouts = [
        '100', // plain number string
        '2s', // seconds
        '100ms', // milliseconds
        '1m', // minutes
        '1h', // hours
        '1d', // days
        '1 second', // with space and unit name
        '2 minutes', // plural
        '100 ms', // with space
      ];

      for (const timeout of validTimeouts) {
        await expect(
          emailValidator('test@example.com', {
            checkMx: false,
            timeout,
          })
        ).resolves.toBe(true);
      }
    });

    test('should handle timeout with mixed case units', async () => {
      const mixedCaseTimeouts = ['100MS', '2S', '1M', '1H', '1D'];

      for (const timeout of mixedCaseTimeouts) {
        await expect(
          emailValidator('test@example.com', {
            checkMx: false,
            timeout,
          })
        ).resolves.toBe(true);
      }
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
      // Use httpbin.org with very short timeout - should either timeout or return false
      const result = await emailValidator('test@httpbin.org', {
        timeout: '1ms',
      }).catch((error) => error.message);

      // Should either timeout or return false (both are acceptable for very short timeout)
      expect(
        typeof result === 'string'
          ? result.includes('timed out')
          : result === false
      ).toBe(true);
    });

    test('should timeout with custom timeout setting as number', async () => {
      // Use httpbin.org with very short timeout - should either timeout or return false
      const result = await emailValidator('test@httpbin.org', {
        timeout: 1,
      }).catch((error) => error.message);

      // Should either timeout or return false (both are acceptable for very short timeout)
      expect(
        typeof result === 'string'
          ? result.includes('timed out')
          : result === false
      ).toBe(true);
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
    test.each([
      { timeout: 0, expectedMessage: 'Invalid timeout value: 0' },
      { timeout: -1, expectedMessage: 'Invalid timeout value: -1' },
      { timeout: 'invalid', expectedMessage: 'Invalid timeout value: invalid' },
    ])(
      'should throw EmailValidationError with INVALID_TIMEOUT_VALUE code for $timeout timeout',
      async ({ timeout, expectedMessage }) => {
        await expect(
          emailValidator('test@httpbin.org', {
            timeout: timeout as any,
          })
        ).rejects.toMatchObject({
          name: 'EmailValidationError',
          code: ErrorCode.INVALID_TIMEOUT_VALUE,
          message: expectedMessage,
        });
      }
    );
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
        timeout: 1,
      }).catch((error) => error.message);

      // Should either timeout or return false (both are acceptable for very short timeout)
      expect(
        typeof result === 'string'
          ? result.includes('timed out')
          : result === false
      ).toBe(true);
    });

    test.each([
      {
        timeout: 'invalid-timeout',
        expectedError: 'Invalid timeout value: invalid-timeout',
      },
      { timeout: 'abc', expectedError: 'Invalid timeout value: abc' },
      { timeout: '5x', expectedError: 'Invalid timeout value: 5x' },
      {
        timeout: 'notanumber',
        expectedError: 'Invalid timeout value: notanumber',
      },
      { timeout: 'timeout', expectedError: 'Invalid timeout value: timeout' },
      { timeout: '1.5s.5', expectedError: 'Invalid timeout value: 1.5s.5' },
      { timeout: '-5s', expectedError: 'Invalid timeout value: -5s' },
      { timeout: -100, expectedError: 'Invalid timeout value: -100' },
      { timeout: 0, expectedError: 'Invalid timeout value: 0' },
    ])(
      'should throw error for invalid timeout value: $timeout',
      async ({ timeout, expectedError }) => {
        await expect(
          emailValidator('test@example.com', { timeout: timeout as any })
        ).rejects.toThrow(expectedError);
      }
    );
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
        emailValidator('test1@httpbin.org', { timeout: 1 }).catch(
          () => 'timeout'
        ),
        emailValidator('test2@httpbin.org', { timeout: 1 }).catch(
          () => 'timeout'
        ),
      ];

      const results = await Promise.all(promises);
      // Should either be ['timeout', 'timeout'] or [false, false] depending on Node.js version
      const allTimeoutOrFalse = results.every(
        (r) => r === 'timeout' || r === false
      );
      expect(allTimeoutOrFalse).toBe(true);
    });
  });

  describe('new features: disposable email detection', () => {
    test('should reject disposable email from 10minutemail.com', async () => {
      expect(
        await emailValidator('test@10minutemail.com', {
          checkDisposable: true,
          checkMx: false,
        })
      ).toBe(false);
    });

    test('should reject disposable email from guerrillamail.com', async () => {
      expect(
        await emailValidator('test@guerrillamail.com', {
          checkDisposable: true,
          checkMx: false,
        })
      ).toBe(false);
    });

    test('should reject disposable email from yopmail.com', async () => {
      expect(
        await emailValidator('test@yopmail.com', {
          checkDisposable: true,
          checkMx: false,
        })
      ).toBe(false);
    });

    test('should accept non-disposable email when checkDisposable is true', async () => {
      expect(
        await emailValidator('test@gmail.com', {
          checkDisposable: true,
          checkMx: false,
        })
      ).toBe(true);
    });

    test('should accept disposable email when checkDisposable is false (default)', async () => {
      expect(
        await emailValidator('test@10minutemail.com', {
          checkDisposable: false,
          checkMx: false,
        })
      ).toBe(true);
    });

    test('should work with MX checking and disposable checking combined', async () => {
      expect(
        await emailValidator('test@10minutemail.com', {
          checkDisposable: true,
          checkMx: true,
          _resolveMx: mockResolveMx,
        } as any)
      ).toBe(false);
    });
  });

  describe('new features: detailed validation results', () => {
    test('should return detailed results when detailed=true', async () => {
      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: false,
      })) as ValidationResult;

      expect(result).toMatchObject({
        valid: true,
        email: 'test@example.com',
        format: { valid: true },
      });
      expect(result.errorCode).toBeUndefined();
    });

    test('should return detailed results for invalid format', async () => {
      const result = (await emailValidator('invalid-email', {
        detailed: true,
      })) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'invalid-email',
        format: {
          valid: false,
          reason: 'Invalid email format',
          errorCode: ErrorCode.INVALID_EMAIL_FORMAT,
        },
        errorCode: ErrorCode.INVALID_EMAIL_FORMAT,
      });
    });

    test('should return detailed results for disposable email', async () => {
      const result = (await emailValidator('test@10minutemail.com', {
        detailed: true,
        checkDisposable: true,
        checkMx: false,
      })) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'test@10minutemail.com',
        format: { valid: true },
        disposable: {
          valid: false,
          provider: '10minutemail.com',
          reason: 'Email from disposable provider',
          errorCode: ErrorCode.DISPOSABLE_EMAIL,
        },
        errorCode: ErrorCode.DISPOSABLE_EMAIL,
      });
    });

    test('should return detailed results for MX record validation', async () => {
      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: true,
        email: 'test@example.com',
        format: { valid: true },
        mx: {
          valid: true,
          records: [{ exchange: 'mx.example.com', priority: 10 }],
        },
      });
    });

    test('should return detailed results for failed MX record validation', async () => {
      const result = (await emailValidator('test@adafwefewsd.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'test@adafwefewsd.com',
        format: { valid: true },
        mx: {
          valid: false,
          reason: expect.stringContaining('DNS lookup failed'),
          errorCode: ErrorCode.DNS_LOOKUP_FAILED,
        },
        errorCode: ErrorCode.DNS_LOOKUP_FAILED,
      });
    });

    test('should return detailed results for non-string input', async () => {
      const result = (await emailValidator(123, {
        detailed: true,
      })) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: '123',
        format: {
          valid: false,
          reason: 'Email must be a string',
          errorCode: ErrorCode.EMAIL_MUST_BE_STRING,
        },
        errorCode: ErrorCode.EMAIL_MUST_BE_STRING,
      });
    });

    test('should return detailed results for empty string', async () => {
      const result = (await emailValidator('', {
        detailed: true,
      })) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: '',
        format: {
          valid: false,
          reason: 'Email cannot be empty',
          errorCode: ErrorCode.EMAIL_CANNOT_BE_EMPTY,
        },
        errorCode: ErrorCode.EMAIL_CANNOT_BE_EMPTY,
      });
    });

    test('should return detailed results with all validations enabled', async () => {
      const result = (await emailValidator('test@gmail.com', {
        detailed: true,
        checkMx: true,
        checkDisposable: true,
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: true,
        email: 'test@gmail.com',
        format: { valid: true },
        mx: {
          valid: true,
          records: [{ exchange: 'mx.gmail.com', priority: 10 }],
        },
        disposable: {
          valid: true,
          provider: null,
        },
      });
    });

    test('should skip MX check for disposable email and include error code', async () => {
      const result = (await emailValidator('test@10minutemail.com', {
        detailed: true,
        checkMx: true,
        checkDisposable: true,
        _resolveMx: mockResolveMx,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'test@10minutemail.com',
        format: { valid: true },
        disposable: {
          valid: false,
          provider: '10minutemail.com',
          reason: 'Email from disposable provider',
          errorCode: ErrorCode.DISPOSABLE_EMAIL,
        },
        mx: {
          valid: false,
          reason: 'Skipped due to disposable email',
          errorCode: ErrorCode.MX_SKIPPED_DISPOSABLE,
        },
      });
    });

    test('should return NO_MX_RECORDS error code for domains without MX records', async () => {
      const mockNoMxResolver = async (hostname: string) => {
        if (hostname === 'no-mx-domain.com') {
          return []; // Empty MX records
        }
        return [{ exchange: `mx.${hostname}`, priority: 10 }];
      };

      const result = (await emailValidator('test@no-mx-domain.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockNoMxResolver,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'test@no-mx-domain.com',
        format: { valid: true },
        mx: {
          valid: false,
          reason: 'No MX records found',
          errorCode: ErrorCode.NO_MX_RECORDS,
        },
      });
    });

    test('should return DNS_LOOKUP_TIMEOUT error code on timeout', async () => {
      const slowResolver = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [{ exchange: 'mx.example.com', priority: 10 }];
      };

      await expect(
        emailValidator('test@example.com', {
          detailed: true,
          checkMx: true,
          timeout: '1ms',
          _resolveMx: slowResolver,
        } as any)
      ).rejects.toThrow('DNS lookup timed out');
    });

    test('should return INVALID_TIMEOUT_VALUE error code for invalid timeout', async () => {
      // Test invalid string timeout
      await expect(
        emailValidator('test@example.com', {
          detailed: true,
          timeout: 'invalid',
        })
      ).rejects.toMatchObject({
        message: 'Invalid timeout value: invalid',
        code: ErrorCode.INVALID_TIMEOUT_VALUE,
      });

      // Test zero timeout
      await expect(
        emailValidator('test@example.com', {
          detailed: true,
          timeout: 0,
        })
      ).rejects.toMatchObject({
        message: 'Invalid timeout value: 0',
        code: ErrorCode.INVALID_TIMEOUT_VALUE,
      });
    });

    test('should handle UNKNOWN_ERROR cases', async () => {
      const mockErrorResolver = async () => {
        // Throw a non-Error object to trigger unknown error handling
        throw 'string error';
      };

      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockErrorResolver,
      } as any)) as ValidationResult;

      expect(result).toMatchObject({
        valid: false,
        email: 'test@example.com',
        format: { valid: true },
        mx: {
          valid: false,
          reason: 'MX lookup failed',
          errorCode: ErrorCode.MX_LOOKUP_FAILED,
        },
      });
    });

    test('should return boolean when detailed=false (default)', async () => {
      const result = await emailValidator('test@example.com', {
        detailed: false,
        checkMx: false,
      });

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('backward compatibility with new features', () => {
    test('should maintain backward compatibility - boolean return by default', async () => {
      const result = await emailValidator('test@example.com');
      expect(typeof result).toBe('boolean');
    });

    test('should maintain backward compatibility - boolean parameter still works', async () => {
      const result = await emailValidator('test@example.com', true);
      expect(typeof result).toBe('boolean');
    });

    test('should maintain backward compatibility - existing options work', async () => {
      const result = await emailValidator('test@example.com', {
        checkMx: false,
        timeout: '5s',
      });
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('edge cases with new features', () => {
    test('should handle case-insensitive disposable domain check', async () => {
      expect(
        await emailValidator('test@10MinuteMail.com', {
          checkDisposable: true,
          checkMx: false,
        })
      ).toBe(false);
    });

    test('should handle exceptions thrown outside checkMxRecords in non-detailed mode', async () => {
      // Create a mock that simulates an unexpected error during the Promise.race
      const mockErrorResolveMx = async () => {
        // Return a promise that rejects after being called
        return Promise.reject(new Error('Unexpected error'));
      };

      const result = await emailValidator('test@example.com', {
        checkMx: true,
        detailed: false,
        timeout: '10s',
        _resolveMx: mockErrorResolveMx,
      } as any).catch(() => false);

      expect(result).toBe(false);
    });

    test('should handle exceptions thrown outside checkMxRecords in detailed mode', async () => {
      // Create a mock that simulates an unexpected error during the Promise.race
      const mockErrorResolveMx = async () => {
        // Return a promise that rejects after being called
        return Promise.reject(new Error('Unexpected error'));
      };

      const result = (await emailValidator('test@example.com', {
        checkMx: true,
        detailed: true,
        timeout: '10s',
        _resolveMx: mockErrorResolveMx,
      } as any)) as ValidationResult;

      expect(result.valid).toBe(false);
      expect(result.mx?.valid).toBe(false);
      expect(result.mx?.reason).toBe('MX lookup failed');
    });

    test('should handle detailed results with timeout', async () => {
      await expect(
        emailValidator('test@example.com', {
          detailed: true,
          timeout: '1ms',
          _resolveMx: slowMockResolveMx,
        } as any)
      ).rejects.toThrow('DNS lookup timed out');
    });

    test('should include disposable check only when enabled in detailed results', async () => {
      const result = (await emailValidator('test@gmail.com', {
        detailed: true,
        checkDisposable: false,
        checkMx: false,
      })) as ValidationResult;

      expect(result.disposable).toBeUndefined();
    });

    test('should include MX check only when enabled in detailed results', async () => {
      const result = (await emailValidator('test@gmail.com', {
        detailed: true,
        checkMx: false,
      })) as ValidationResult;

      expect(result.mx).toBeUndefined();
    });

    test('should short-circuit MX lookup when disposable email detected in detailed mode', async () => {
      const result = (await emailValidator('test@10minutemail.com', {
        detailed: true,
        checkMx: true,
        checkDisposable: true,
      })) as ValidationResult;

      expect(result.valid).toBe(false);
      expect(result.disposable?.valid).toBe(false);
      expect(result.mx?.valid).toBe(false);
      expect(result.mx?.reason).toBe('Skipped due to disposable email');
      expect(result.mx?.errorCode).toBe(ErrorCode.MX_SKIPPED_DISPOSABLE);
    });
  });

  describe('error codes comprehensive testing', () => {
    test('should return NO_MX_RECORDS error code when no MX records found', async () => {
      const mockNoMxRecords = async () => [];
      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockNoMxRecords,
      } as any)) as ValidationResult;

      expectValidationError(result, ErrorCode.NO_MX_RECORDS, 'mx');
    });

    test('should handle all error codes for invalid timeouts', async () => {
      const invalidTimeouts = [
        { value: 'abc', expected: 'Invalid timeout value: abc' },
        { value: '5x', expected: 'Invalid timeout value: 5x' },
        { value: -100, expected: 'Invalid timeout value: -100' },
        { value: 0, expected: 'Invalid timeout value: 0' },
      ];

      expect.assertions(12); // 3 assertions × 4 test cases

      for (const { value, expected } of invalidTimeouts) {
        try {
          await emailValidator('test@example.com', { timeout: value as any });
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(EmailValidationError);
          expect((error as EmailValidationError).code).toBe(
            ErrorCode.INVALID_TIMEOUT_VALUE
          );
          expect((error as EmailValidationError).message).toBe(expected);
        }
      }
    });

    test('should return correct error codes for all format validation failures', async () => {
      const testCases = [
        { email: 123, errorCode: ErrorCode.EMAIL_MUST_BE_STRING },
        { email: null, errorCode: ErrorCode.EMAIL_MUST_BE_STRING },
        { email: undefined, errorCode: ErrorCode.EMAIL_MUST_BE_STRING },
        { email: {}, errorCode: ErrorCode.EMAIL_MUST_BE_STRING },
        { email: [], errorCode: ErrorCode.EMAIL_MUST_BE_STRING },
        { email: '', errorCode: ErrorCode.EMAIL_CANNOT_BE_EMPTY },
        { email: 'invalid-email', errorCode: ErrorCode.INVALID_EMAIL_FORMAT },
        { email: 'test@', errorCode: ErrorCode.INVALID_EMAIL_FORMAT },
        { email: '@example.com', errorCode: ErrorCode.INVALID_EMAIL_FORMAT },
      ];

      for (const { email, errorCode } of testCases) {
        const result = (await emailValidator(email, {
          detailed: true,
        })) as ValidationResult;

        expectValidationError(result, errorCode, 'format');
      }
    });

    test('should propagate error codes through validation chain', async () => {
      // Test that the most specific error code is returned at the top level
      const result1 = (await emailValidator('test@10minutemail.com', {
        detailed: true,
        checkDisposable: true,
        checkMx: true,
      })) as ValidationResult;

      expect(result1.errorCode).toBe(ErrorCode.DISPOSABLE_EMAIL);

      const result2 = (await emailValidator('invalid-email', {
        detailed: true,
        checkDisposable: true,
        checkMx: true,
      })) as ValidationResult;

      expect(result2.errorCode).toBe(ErrorCode.INVALID_EMAIL_FORMAT);
    });

    test('should handle DNS_LOOKUP_FAILED error code', async () => {
      const mockDnsFailure = async () => {
        throw new Error('ENOTFOUND example.com');
      };

      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockDnsFailure,
      } as any)) as ValidationResult;

      expectValidationError(result, ErrorCode.DNS_LOOKUP_FAILED, 'mx');
      expect(result.mx?.reason).toContain('DNS lookup failed');
    });

    test('should handle MX_LOOKUP_FAILED for unexpected errors', async () => {
      const mockUnexpectedError = async () => {
        throw new Error('Unexpected error');
      };

      const result = (await emailValidator('test@example.com', {
        detailed: true,
        checkMx: true,
        _resolveMx: mockUnexpectedError,
      } as any)) as ValidationResult;

      expectValidationError(result, ErrorCode.MX_LOOKUP_FAILED, 'mx');
    });
  });
});
