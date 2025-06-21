#!/usr/bin/env node

/**
 * Bulk Email Validation Example
 *
 * This example demonstrates how to efficiently validate multiple email addresses,
 * including batch processing, concurrency control, and progress tracking.
 */

import emailValidator from 'node-email-verifier';
import { performance } from 'perf_hooks';

// Utility function to chunk an array
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Example 1: Sequential validation with progress
async function sequentialValidation(emails) {
  console.log('=== Sequential Validation ===\n');
  const startTime = performance.now();
  const results = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    process.stdout.write(
      `\rValidating ${i + 1}/${emails.length}: ${email.padEnd(30)}`
    );

    try {
      const isValid = await emailValidator(email, {
        checkMx: true,
        timeout: 3000,
      });
      results.push({ email, valid: isValid, error: null });
    } catch (error) {
      results.push({ email, valid: false, error: error.message });
    }
  }

  const endTime = performance.now();
  console.log(`\n\nCompleted in ${((endTime - startTime) / 1000).toFixed(2)}s`);

  return results;
}

// Example 2: Concurrent validation with concurrency limit
async function concurrentValidation(emails, concurrencyLimit = 5) {
  console.log(`\n=== Concurrent Validation (limit: ${concurrencyLimit}) ===\n`);
  const startTime = performance.now();
  const results = [];

  // Create chunks based on concurrency limit
  const chunks = chunkArray(emails, concurrencyLimit);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);

    // Process chunk concurrently
    const chunkPromises = chunk.map(async (email) => {
      try {
        const result = await emailValidator(email, {
          detailed: true,
          checkMx: true,
          checkDisposable: true,
          timeout: 3000,
        });
        return { email, ...result };
      } catch (error) {
        return {
          email,
          valid: false,
          error: error.message,
          errorCode: error.code,
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  const endTime = performance.now();
  console.log(`\nCompleted in ${((endTime - startTime) / 1000).toFixed(2)}s`);

  return results;
}

// Example 3: Streaming validation with callback
async function* streamingValidation(emails, options = {}) {
  for (const email of emails) {
    try {
      const result = await emailValidator(email, {
        detailed: true,
        ...options,
      });
      yield { email, ...result };
    } catch (error) {
      yield {
        email,
        valid: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }
}

// Example 4: Validation with statistics
class BulkValidator {
  constructor(options = {}) {
    this.options = {
      checkMx: true,
      checkDisposable: true,
      timeout: 5000,
      detailed: true,
      ...options,
    };
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      errors: 0,
      disposable: 0,
      noMxRecords: 0,
      startTime: null,
      endTime: null,
    };
  }

  async validate(emails) {
    this.stats.total = emails.length;
    this.stats.startTime = Date.now();

    const results = [];

    for (const email of emails) {
      const result = await this.validateSingle(email);
      results.push(result);
      this.updateStats(result);
    }

    this.stats.endTime = Date.now();
    return results;
  }

  async validateSingle(email) {
    try {
      const result = await emailValidator(email, this.options);
      return { email, ...result };
    } catch (error) {
      this.stats.errors++;
      return {
        email,
        valid: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  updateStats(result) {
    if (result.valid) {
      this.stats.valid++;
    } else {
      this.stats.invalid++;

      if (result.errorCode === 'DISPOSABLE_EMAIL') {
        this.stats.disposable++;
      } else if (result.errorCode === 'NO_MX_RECORDS') {
        this.stats.noMxRecords++;
      }
    }
  }

  getReport() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const rate = this.stats.total / duration;

    return {
      ...this.stats,
      duration: `${duration.toFixed(2)}s`,
      validationRate: `${rate.toFixed(2)} emails/second`,
      successRate: `${((this.stats.valid / this.stats.total) * 100).toFixed(2)}%`,
    };
  }
}

// Example 5: CSV processing simulation
async function processEmailList() {
  console.log('\n=== Bulk Validation with Statistics ===\n');

  // Simulate a list of emails (in real use, this might come from a CSV file)
  const emailList = [
    'valid@gmail.com',
    'another@yahoo.com',
    'test@hotmail.com',
    'invalid-email',
    'user@nonexistent-domain.com',
    'disposable@tempmail.com',
    'john.doe@company.com',
    'admin@example.org',
    'info@website.net',
    'contact@business.co',
  ];

  const validator = new BulkValidator({
    checkMx: true,
    checkDisposable: true,
    timeout: 3000,
  });

  console.log(`Validating ${emailList.length} emails...\n`);
  const results = await validator.validate(emailList);

  // Display results
  console.log('Results:');
  console.log('--------');
  results.forEach((result) => {
    const status = result.valid ? '✅' : '❌';
    const reason = result.reason || result.error || '';
    console.log(`${status} ${result.email.padEnd(30)} ${reason}`);
  });

  // Display statistics
  console.log('\nStatistics:');
  console.log('-----------');
  const report = validator.getReport();
  console.log(`Total emails: ${report.total}`);
  console.log(`Valid: ${report.valid} (${report.successRate})`);
  console.log(`Invalid: ${report.invalid}`);
  console.log(`Disposable: ${report.disposable}`);
  console.log(`No MX records: ${report.noMxRecords}`);
  console.log(`Errors: ${report.errors}`);
  console.log(`Duration: ${report.duration}`);
  console.log(`Rate: ${report.validationRate}`);
}

// Main execution
async function main() {
  // Small set for demonstration
  const testEmails = [
    'test1@gmail.com',
    'test2@yahoo.com',
    'invalid@fake-domain.com',
    'not-an-email',
    'disposable@temp-mail.org',
  ];

  // Run different validation methods
  await sequentialValidation(testEmails);
  await concurrentValidation(testEmails, 3);

  // Streaming example
  console.log('\n=== Streaming Validation ===\n');
  const stream = streamingValidation(testEmails);
  for await (const result of stream) {
    console.log(`${result.valid ? '✅' : '❌'} ${result.email}`);
  }

  // Full example with statistics
  await processEmailList();
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
