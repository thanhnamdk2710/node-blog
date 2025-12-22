import * as fs from "fs";

console.log("=== setImmediate vs setTimeout in I/O ===\n");

// Inside I/O callback, setImmediate ALWAYS runs before setTimeout
fs.readFile(__filename, () => {
  console.log("I/O callback started");

  setTimeout(() => {
    console.log("  → setTimeout");
  }, 0);

  setImmediate(() => {
    console.log("  → setImmediate (always first in I/O context)");
  });
});

/*
Output (DETERMINISTIC):
=== setImmediate vs setTimeout in I/O ===

I/O callback started
  → setImmediate (always first in I/O context)
  → setTimeout

Reason: When in poll phase (I/O callback), 
check phase (setImmediate) always runs next.
*/
