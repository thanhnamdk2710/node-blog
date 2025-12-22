console.log("=== Timers Phase Demo ===\n");

// Timer is scheduled but timing is not guaranteed to be exact
const start = Date.now();

setTimeout(() => {
  const delay = Date.now() - start;
  console.log(`Timer 1: Expected 100ms, Actual ${delay}ms`);
}, 100);

setTimeout(() => {
  const delay = Date.now() - start;
  console.log(`Timer 2: Expected 0ms, Actual ${delay}ms`);
}, 0);

// Simulate blocking operation
// Timer callbacks will be delayed if main thread is blocked
const blockFor = (ms: number): void => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Blocking main thread
  }
};

// Uncomment to see timer delay
// blockFor(200);

console.log("Timers scheduled");

/*
Output (without blockFor):
=== Timers Phase Demo ===

Timers scheduled
Timer 2: Expected 0ms, Actual 1ms
Timer 1: Expected 100ms, Actual 101ms

==============================
Output (with blockFor):
=== Timers Phase Demo ===

Timers scheduled
Timer 2: Expected 0ms, Actual 200ms
Timer 1: Expected 100ms, Actual 200ms
 */
