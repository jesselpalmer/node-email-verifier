export interface RetryOptions {
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: RetryOptions = {}
): Promise<void> {
  const {
    maxAttempts = 50,
    intervalMs = 100,
    timeoutMs = maxAttempts * intervalMs,
  } = options;

  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await condition()) {
      return;
    }

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Condition not met after ${timeoutMs}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}

export async function waitForFilesToExist(
  filePaths: string[],
  maxAttempts = 50,
  intervalMs = 100
): Promise<void> {
  const fs = await import('fs');

  await waitForCondition(
    () => {
      // Check all files exist
      const allExist = filePaths.every((path) => fs.existsSync(path));
      if (!allExist) return false;

      // Also check that files have non-zero size
      try {
        return filePaths.every((path) => {
          const stats = fs.statSync(path);
          return stats.size > 0;
        });
      } catch {
        return false;
      }
    },
    {
      maxAttempts,
      intervalMs,
    }
  );
}
