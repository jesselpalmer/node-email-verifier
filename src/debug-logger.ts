/**
 * Debug logger module for AI-assisted debugging and observability.
 * Provides structured JSON logging with timing and memory usage information.
 */

import { performance } from 'node:perf_hooks';

export const DEBUG_LOG_TYPE = 'email-validator-debug';

export interface DebugLogEntry {
  timestamp: string;
  phase: string;
  email?: string;
  data?: Record<string, unknown>;
  timing?: {
    start: number;
    end?: number;
    duration?: number;
  };
  memory?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
}

/**
 * Interface for structured debug logging throughout email validation.
 * Provides methods to track validation phases with timing and memory metrics.
 */
export interface DebugLogger {
  /**
   * Logs a debug entry with optional partial data.
   * Core fields (timestamp, phase, email) are automatically added.
   * @param entry - Partial debug log entry to be merged with defaults
   */
  log(entry: Partial<DebugLogEntry>): void;

  /**
   * Starts a new validation phase and returns a function to end it.
   * Automatically logs phase start with timing and memory snapshot.
   * @param phase - Name of the validation phase (e.g., 'format_validation')
   * @param data - Optional additional data to log with the phase
   * @returns Function to call when the phase completes
   */
  startPhase(phase: string, data?: Record<string, unknown>): () => void;

  /**
   * Logs an error that occurred during a validation phase.
   * @param phase - Name of the phase where the error occurred
   * @param error - The error object to log
   */
  logError(phase: string, error: Error): void;
}

/**
 * Creates a debug logger instance for structured logging.
 * @param enabled Whether debug logging is enabled
 * @param email The email being validated (optional)
 * @returns A debug logger instance
 */
export function createDebugLogger(
  enabled: boolean,
  email?: string
): DebugLogger {
  if (!enabled) {
    // Return no-op logger when disabled
    return {
      log: () => {},
      startPhase: () => () => {},
      logError: () => {},
    };
  }

  const log = (entry: Partial<DebugLogEntry>): void => {
    const fullEntry: DebugLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      phase: entry.phase || 'unknown',
      email,
    };

    // Add memory usage if not provided
    if (!fullEntry.memory) {
      const memUsage = process.memoryUsage();
      fullEntry.memory = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      };
    }

    // Output as structured JSON for AI/MCP compatibility
    console.log(
      JSON.stringify({
        type: DEBUG_LOG_TYPE,
        ...fullEntry,
      })
    );
  };

  const startPhase = (
    phase: string,
    data?: Record<string, unknown>
  ): (() => void) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    log({
      phase,
      data,
      timing: { start: startTime },
      memory: {
        heapUsed: startMemory.heapUsed,
        heapTotal: startMemory.heapTotal,
        rss: startMemory.rss,
        external: startMemory.external,
      },
    });

    // Return a function to end the phase
    return () => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      log({
        phase: `${phase}_complete`,
        data,
        timing: {
          start: startTime,
          end: endTime,
          duration,
        },
        memory: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          rss: endMemory.rss,
          external: endMemory.external,
        },
      });
    };
  };

  const logError = (phase: string, error: Error): void => {
    log({
      phase: `${phase}_error`,
      error: {
        code:
          (error as { code?: string | number }).code !== undefined
            ? String((error as { code?: string | number }).code)
            : undefined,
        message: error.message,
        stack: error.stack,
      },
    });
  };

  return {
    log,
    startPhase,
    logError,
  };
}
