console.log("=== Pitfall: nextTick Starvation ===\n");

const MAX_ITERATIONS = 10;

// BAD: This will starve I/O indefinitely
const badRecursion = (): void => {
  let iterations = 0;

  const recurse = (): void => {
    iterations++;
    console.log(`[nextTick] Iteration: ${iterations}`);
    if (iterations < MAX_ITERATIONS) {
      process.nextTick(recurse);
    }
  };

  process.nextTick(recurse);
};

// GOOD: Use setImmediate for recursive operation
const goodRecursion = (): void => {
  let iterations = 0;

  const recurse = (): void => {
    iterations++;
    console.log(`[setImmediate] Iteration: ${iterations}`);
    if (iterations < MAX_ITERATIONS) {
      setImmediate(recurse);
    }
  };

  setImmediate(recurse);
};

// Demo: Prove nextTick starves timers
// console.log("--- Demo: nextTick starves setTimeout ---");
// setTimeout(() => console.log(">>> Timer fired!"), 0);
// badRecursion();

// Uncomment to compare:
console.log("\n--- Demo: setImmediate allows timer to fire ---");
setTimeout(() => console.log(">>> Timer fired!"), 0);
goodRecursion();
