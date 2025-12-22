import * as fs from "fs";

console.log("=== Microtasks Between Phases ===\n");

// Phase: Timers
setTimeout(() => {
  console.log("1. Timer callback");

  // Microtask is queued
  process.nextTick(() => {
    console.log("  1a. nextTick after timer");
  });

  Promise.resolve().then(() => {
    console.log("  1b. Promise after timer");
  });
}, 0);

// Phase: Check
setImmediate(() => {
  console.log("2. Immediate callback");

  process.nextTick(() => {
    console.log("  2a. nextTick after immediate");
  });

  Promise.resolve().then(() => {
    console.log("  2b. Promise after immediate");
  });
});

// Phase: Poll (I/O)
fs.readFile(__filename, () => {
  console.log("3. I/O callback");

  process.nextTick(() => {
    console.log("  3a. nextTick after I/O");
  });

  Promise.resolve().then(() => {
    console.log("  3b. Promise after I/O");
  });

  setImmediate(() => {
    console.log("4. Immediate after I/O");
  });
});

/*
Output (may vary between 1 and 2):
=== Microtasks Between Phases ===

1. Timer callback         (or 2 first)
   1a. nextTick after timer
   1b. Promise after timer
2. Immediate callback     (or 1 first)
   2a. nextTick after immediate
   2b. Promise after immediate
3. I/O callback
   3a. nextTick after I/O
   3b. Promise after I/O
4. Immediate after I/O

Key insight: Microtasks are drained COMPLETELY after each callback
*/
