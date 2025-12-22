import * as fs from "fs";

console.log("=== Poll Phase Behavior ===\n");

// Case 1: Has timers scheduled - poll phase won't block forever
setTimeout(() => {
  console.log("Timer executed");
}, 100);

// Case 2: Has setImmediate - poll phase will move to check phase immeditely
setImmediate(() => {
  console.log("Immediate executed");
});

// Case 3: I/O callback
fs.readFile(__filename, () => {
  console.log("File read callback");

  // Inside I/O callback, setImmediate ALWAYS runs before setTimeout
  setTimeout(() => {
    console.log("  → Timeout inside I/O");
  }, 0);

  setImmediate(() => {
    console.log("  → Immediate inside I/O");
  });
});

console.log("Sync code done");

/*
Output:
=== Poll Phase Behavior ===

Sync code done
Immediate executed
File read callback
  → Immediate inside I/O
  → Timeout inside I/O
Timer executed
*/
