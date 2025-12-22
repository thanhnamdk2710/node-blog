console.log("=== Check Phase Demo ===\n");

// setImmediate is designed to execute after poll phase
setImmediate(() => {
  console.log("2. setImmediate callback");
});

// setTimeout with delay 0
setTimeout(() => {
  console.log("3. setTimeout callback");
}, 0);

console.log("1. Sync code");

/*
Output (order between 2 and 3 may vary):
=== Check Phase Demo ===

1. Sync code
2. setImmediate callback
3. setTimeout callback

Reason: In main module, order between setTimeout(0) and setImmediate  
is non-deterministic, depends on process performance.
*/
