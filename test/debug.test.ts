import { jest } from '@jest/globals';
import emailValidator from '../src/index.js';
import { DEBUG_LOG_TYPE } from '../src/debug-logger.js';

describe('Debug Mode', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let debugLogs: any[] = [];

  beforeEach(() => {
    debugLogs = [];
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((message: any) => {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === DEBUG_LOG_TYPE) {
            debugLogs.push(parsed);
          }
        } catch {
          // Not JSON, ignore
        }
      });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should not log when debug is false', async () => {
    await emailValidator('test@example.com', { debug: false, checkMx: false });
    expect(debugLogs).toHaveLength(0);
  });

  it('should not log when debug is not specified', async () => {
    await emailValidator('test@example.com', { checkMx: false });
    expect(debugLogs).toHaveLength(0);
  });

  it('should log structured data when debug is true', async () => {
    await emailValidator('test@example.com', { debug: true, checkMx: false });

    expect(debugLogs.length).toBeGreaterThan(0);

    // Check for validation start
    const startLog = debugLogs.find((log) => log.phase === 'validation_start');
    expect(startLog).toBeDefined();
    expect(startLog.email).toBe('test@example.com');
    expect(startLog.data).toMatchObject({
      checkMx: false,
      checkDisposable: false,
      detailed: false,
    });

    // Check for format validation
    const formatLog = debugLogs.find(
      (log) => log.phase === 'format_validation'
    );
    expect(formatLog).toBeDefined();
    expect(formatLog.email).toBe('test@example.com');

    // Check for validation complete
    const completeLog = debugLogs.find(
      (log) => log.phase === 'validation_complete'
    );
    expect(completeLog).toBeDefined();
    expect(completeLog.data.valid).toBe(true);
  });

  it('should include timing information', async () => {
    await emailValidator('test@example.com', { debug: true, checkMx: false });

    const formatLog = debugLogs.find(
      (log) => log.phase === 'format_validation'
    );
    const formatCompleteLog = debugLogs.find(
      (log) => log.phase === 'format_validation_complete'
    );

    expect(formatLog.timing.start).toBeDefined();
    expect(formatCompleteLog.timing.duration).toBeGreaterThan(0);
    expect(formatCompleteLog.timing.end).toBeGreaterThan(
      formatCompleteLog.timing.start
    );
  });

  it('should include memory usage', async () => {
    await emailValidator('test@example.com', { debug: true, checkMx: false });

    const startLog = debugLogs.find((log) => log.phase === 'validation_start');
    expect(startLog.memory).toBeDefined();
    expect(startLog.memory.heapUsed).toBeGreaterThan(0);
    expect(startLog.memory.heapTotal).toBeGreaterThan(0);
    expect(startLog.memory.rss).toBeGreaterThan(0);
  });

  it('should log disposable check when enabled', async () => {
    await emailValidator('test@tempmail.com', {
      debug: true,
      checkMx: false,
      checkDisposable: true,
    });

    const disposableLog = debugLogs.find(
      (log) => log.phase === 'disposable_check'
    );
    expect(disposableLog).toBeDefined();
    expect(disposableLog.data.domain).toBe('tempmail.com');
  });

  it('should log format validation failure', async () => {
    await emailValidator('invalid-email', {
      debug: true,
      checkMx: false,
      detailed: true,
    });

    const failureLog = debugLogs.find(
      (log) => log.phase === 'format_validation_failed'
    );
    expect(failureLog).toBeDefined();
    expect(failureLog.data.reason).toBeDefined();
    expect(failureLog.data.errorCode).toBeDefined();
  });

  it('should log errors properly', async () => {
    await expect(
      emailValidator('test@example.com', { debug: true, timeout: -1 })
    ).rejects.toThrow();

    const errorLog = debugLogs.find(
      (log) => log.phase === 'timeout_validation_error'
    );
    expect(errorLog).toBeDefined();
    expect(errorLog.error).toBeDefined();
    expect(errorLog.error.message).toContain('Invalid timeout value');
  });

  it('should work with detailed mode', async () => {
    const result = await emailValidator('test@example.com', {
      debug: true,
      detailed: true,
      checkMx: false,
      checkDisposable: true,
    });

    expect(result).toHaveProperty('valid', true);
    expect(debugLogs.length).toBeGreaterThan(0);

    const completeLog = debugLogs.find(
      (log) => log.phase === 'validation_complete'
    );
    expect(completeLog.data.valid).toBe(true);
  });

  it('should log MX record check phases', async () => {
    // Mock the MX check to avoid actual DNS lookups
    const mockResult = {
      valid: true,
      mxRecords: [{ exchange: 'mail.example.com', priority: 10 }],
    };

    await emailValidator('test@example.com', {
      debug: true,
      checkMx: true,
      _resolveMx: jest.fn().mockResolvedValue(mockResult.mxRecords),
    } as any);

    const mxStartLog = debugLogs.find((log) => log.phase === 'mx_record_check');
    expect(mxStartLog).toBeDefined();
    expect(mxStartLog.data.domain).toBe('example.com');

    const mxFoundLog = debugLogs.find(
      (log) => log.phase === 'mx_records_found'
    );
    expect(mxFoundLog).toBeDefined();
    expect(mxFoundLog.data.valid).toBe(true);
    expect(mxFoundLog.data.recordCount).toBe(1);
  });
});
