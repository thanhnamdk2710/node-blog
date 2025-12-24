console.log("=== process.nextTick vs setImmediate ===\n");

/*
Naming confusion:
- process.nextTick fires IMMEDIATELY after current operation
- setImmediate fires on the NEXT iteration of event loop

The names are backwards! But can't change due to backward compatibility
*/

let counter = 0;

// Dangerous: nextTick can starve event loop
const recursiveNextTick = (): void => {
  counter++;
  if (counter < 5) {
    console.log(`nextTick iteration ${counter}`);
    process.nextTick(recursiveNextTick);
  }
};

// Safe: setImmediate allows I/O to be processed
const recursiveImmediate = (): void => {
  counter++;
  if (counter < 10) {
    console.log(`setImmediate iteration ${counter}`);
    setImmediate(recursiveImmediate);
  }
};

// Demo starvation with nextTick
console.log("Starting nextTick recursion...");
process.nextTick(recursiveNextTick);

// This I/O will have to wait for all nextTick to complete
setTimeout(() => {
  console.log("Timeout executed (was waiting for nextTick to complete)");

  counter = 0;
  console.log("\nStarting setImmediate recursion...");
  setImmediate(recursiveImmediate);
}, 0);

/*
Output:
=== process.nextTick vs setImmediate ===

Starting nextTick recursion...
nextTick iteration 1
nextTick iteration 2
nextTick iteration 3
nextTick iteration 4
Timeout executed (was waiting for nextTick to complete)

Starting setImmediate recursion...
setImmediate iteration 1
setImmediate iteration 2
setImmediate iteration 3
setImmediate iteration 4
setImmediate iteration 5
setImmediate iteration 6
setImmediate iteration 7
setImmediate iteration 8
setImmediate iteration 9
*/
