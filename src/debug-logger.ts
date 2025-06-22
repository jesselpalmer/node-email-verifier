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

export interface DebugLogger {
  log(entry: Partial<DebugLogEntry>): void;
  startPhase(phase: string, data?: Record<string, unknown>): () => void;
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
      timestamp: new Date().toISOString(),
      phase: entry.phase || 'unknown',
      email,
      ...entry,
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
        code: (error as { code?: string }).code,
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
