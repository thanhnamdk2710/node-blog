console.log("=== Pitfall: Timer Drift ===\n");

const INTERVAL = 100; // Target: fire every 100ms
const ITERATIONS = 5;
const WORK_TIME = 20; // Simulate 20ms of blocking work

// Helper: simulate blocking work
const doWork = (ms: number): void => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Block thread
  }
};

// BAD: setInterval drift accumulates
// Expected total time: 5 × 100ms = 500ms
// Actual: 500ms + (5 × 20ms work) = ~600ms due to drift
const runBadTimer = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("--- BAD: setInterval (drift accumulates) ---");
    const startTime = Date.now();
    let count = 0;

    const interval = setInterval(() => {
      count++;
      const elapsed = Date.now() - startTime;
      const expected = count * INTERVAL;
      const drift = elapsed - expected;

      doWork(WORK_TIME); // Blocking work causes next interval to delay

      console.log(
        `  #${count}: elapsed=${elapsed}ms, expected=${expected}ms, drift=+${drift}ms`
      );

      if (count >= ITERATIONS) {
        clearInterval(interval);
        console.log(`  Total drift: +${drift}ms\n`);
        resolve();
      }
    }, INTERVAL);
  });
};

// GOOD: Self-correcting timer compensates for drift
// Adjusts next timeout based on how late/early we fired
const runGoodTimer = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log("--- GOOD: Self-correcting setTimeout ---");
    const startTime = Date.now();
    let count = 0;
    let nextExpected = startTime + INTERVAL;

    const tick = (): void => {
      count++;
      const elapsed = Date.now() - startTime;
      const expected = count * INTERVAL;
      const drift = elapsed - expected;

      doWork(WORK_TIME); // Same blocking work

      console.log(
        `  #${count}: elapsed=${elapsed}ms, expected=${expected}ms, drift=+${drift}ms`
      );

      if (count >= ITERATIONS) {
        console.log(`  Total drift: +${drift}ms`);
        resolve();
        return;
      }

      // Compensate: subtract drift from next interval
      nextExpected += INTERVAL;
      const delay = Math.max(0, nextExpected - Date.now());
      setTimeout(tick, delay);
    };

    setTimeout(tick, INTERVAL);
  });
};

// Run demos sequentially for clear comparison
(async () => {
  await runBadTimer();
  await runGoodTimer();
})();

/*
=== Pitfall: Timer Drift ===

--- BAD: setInterval (drift accumulates) ---
  #1: elapsed=101ms, expected=100ms, drift=+1ms
  #2: elapsed=202ms, expected=200ms, drift=+2ms
  #3: elapsed=303ms, expected=300ms, drift=+3ms
  #4: elapsed=404ms, expected=400ms, drift=+4ms
  #5: elapsed=504ms, expected=500ms, drift=+4ms
  Total drift: +4ms

--- GOOD: Self-correcting setTimeout ---
  #1: elapsed=102ms, expected=100ms, drift=+2ms
  #2: elapsed=201ms, expected=200ms, drift=+1ms
  #3: elapsed=301ms, expected=300ms, drift=+1ms
  #4: elapsed=401ms, expected=400ms, drift=+1ms
  #5: elapsed=501ms, expected=500ms, drift=+1ms
  Total drift: +1ms
*/
