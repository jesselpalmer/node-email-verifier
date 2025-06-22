#!/usr/bin/env node

/**
 * Debug Mode Example
 *
 * This example demonstrates the AI Debug Mode feature (v3.3.0+)
 * which provides structured logging for debugging and observability.
 * Perfect for troubleshooting issues and understanding validation flow.
 */

import emailValidator from 'node-email-verifier';

// Helper to intercept and collect debug logs
function interceptDebugLogs() {
  const debugLogs = [];
  const originalLog = console.log;

  console.log = (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'email-validator-debug') {
        debugLogs.push(parsed);
      }
    } catch {
      originalLog(message);
    }
  };

  const restore = () => {
    console.log = originalLog;
  };

  return { debugLogs, restore, originalLog };
}

// Helper to format debug output
function analyzeDebugLogs(logs) {
  const phases = {};
  let totalDuration = 0;

  logs.forEach((log) => {
    if (log.phase.endsWith('_complete') && log.timing?.duration) {
      const phaseName = log.phase.replace('_complete', '');
      phases[phaseName] = {
        duration: log.timing.duration,
        memoryDelta:
          log.memory.heapUsed -
          (logs.find((l) => l.phase === phaseName)?.memory?.heapUsed || 0),
      };
      totalDuration += log.timing.duration;
    }
  });

  return { phases, totalDuration };
}

// Example 1: Basic debug mode
async function basicDebugExample() {
  console.log('=== Basic Debug Mode Example ===\n');

  // Intercept debug logs
  const { debugLogs, restore, originalLog } = interceptDebugLogs();

  // Run validation with debug enabled
  const result = await emailValidator('test@example.com', {
    debug: true,
    checkMx: true,
    checkDisposable: true,
    detailed: true,
  });

  // Restore console.log
  restore();

  // Display results
  originalLog('Validation Result:', JSON.stringify(result, null, 2));
  originalLog('\nDebug Summary:');
  originalLog(`Total debug logs: ${debugLogs.length}`);

  const { phases, totalDuration } = analyzeDebugLogs(debugLogs);
  originalLog(`\nPhase Timings:`);
  Object.entries(phases).forEach(([phase, data]) => {
    originalLog(
      `  ${phase}: ${data.duration.toFixed(2)}ms (memory: ${(
        data.memoryDelta / 1024
      ).toFixed(2)}KB)`
    );
  });
  originalLog(`  Total: ${totalDuration.toFixed(2)}ms\n`);
}

// Example 2: Debug with timeout
async function debugTimeoutExample() {
  console.log('=== Debug Mode with Timeout Example ===\n');

  const { debugLogs, restore, originalLog } = interceptDebugLogs();

  try {
    await emailValidator('test@slow-dns-server.com', {
      debug: true,
      checkMx: true,
      timeout: 100, // Very short timeout to trigger error
    });
  } catch (error) {
    restore();
    originalLog('Caught timeout error:', error.message);

    const errorLog = debugLogs.find((log) => log.phase.includes('error'));
    if (errorLog) {
      originalLog('\nError debug info:', JSON.stringify(errorLog, null, 2));
    }
    return;
  }

  restore();
}

// Example 3: Production-ready debug wrapper
class EmailValidatorDebugger {
  constructor() {
    this.debugLogs = [];
    this.originalLog = console.log;
  }

  async validateWithDebug(email, options = {}) {
    this.debugLogs = [];

    // Intercept logs
    console.log = (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'email-validator-debug') {
          this.debugLogs.push(parsed);
        }
      } catch {
        // Not JSON or not our debug log
      }
    };

    try {
      const result = await emailValidator(email, {
        ...options,
        debug: true,
      });

      return {
        result,
        debug: this.getDebugInfo(),
      };
    } finally {
      // Always restore console.log
      console.log = this.originalLog;
    }
  }

  getDebugInfo() {
    const info = {
      totalLogs: this.debugLogs.length,
      phases: [],
      totalDuration: 0,
      memoryUsage: {
        start: 0,
        end: 0,
        delta: 0,
      },
      errors: [],
    };

    // Extract phase information
    const phaseMap = new Map();
    this.debugLogs.forEach((log) => {
      if (log.phase.includes('error')) {
        info.errors.push({
          phase: log.phase,
          error: log.error,
        });
      }

      if (!log.phase.endsWith('_complete')) {
        phaseMap.set(log.phase, log);
      } else {
        const baseName = log.phase.replace('_complete', '');
        const startLog = phaseMap.get(baseName);
        if (startLog && log.timing?.duration) {
          info.phases.push({
            name: baseName,
            duration: log.timing.duration,
            memoryDelta: log.memory.heapUsed - startLog.memory.heapUsed,
          });
          info.totalDuration += log.timing.duration;
        }
      }
    });

    // Calculate memory usage
    if (this.debugLogs.length > 0) {
      info.memoryUsage.start = this.debugLogs[0].memory.heapUsed;
      info.memoryUsage.end =
        this.debugLogs[this.debugLogs.length - 1].memory.heapUsed;
      info.memoryUsage.delta = info.memoryUsage.end - info.memoryUsage.start;
    }

    return info;
  }

  getRawLogs() {
    return this.debugLogs;
  }
}

// Example 4: Using the debug wrapper
async function debugWrapperExample() {
  console.log('=== Production Debug Wrapper Example ===\n');

  const validator = new EmailValidatorDebugger();

  // Test various emails
  const emails = [
    'valid@gmail.com',
    'invalid-format',
    'test@tempmail.com',
    'user@nonexistent-domain.com',
  ];

  for (const email of emails) {
    console.log(`\nTesting: ${email}`);
    const { result, debug } = await validator.validateWithDebug(email, {
      checkMx: true,
      checkDisposable: true,
      detailed: true,
    });

    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Reason: ${result.errorCode || 'Unknown'}`);
    }

    console.log(`Performance: ${debug.totalDuration.toFixed(2)}ms`);
    console.log(
      `Memory impact: ${(debug.memoryUsage.delta / 1024).toFixed(2)}KB`
    );

    if (debug.errors.length > 0) {
      console.log(`Errors: ${debug.errors.map((e) => e.phase).join(', ')}`);
    }
  }
}

// Main execution
async function main() {
  await basicDebugExample();
  await debugTimeoutExample();
  await debugWrapperExample();

  console.log('\n=== Debug Mode Tips ===');
  console.log('1. Debug logs are written to console.log as JSON');
  console.log('2. Each log has timing and memory information');
  console.log('3. Logs are MCP-compatible for AI tooling');
  console.log('4. Use debug mode to troubleshoot slow validations');
  console.log('5. Production usage: intercept and store logs');
  console.log('6. Use the interceptDebugLogs helper to avoid code duplication');
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
