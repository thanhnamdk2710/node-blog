import * as fs from "fs";
import * as path from "path";

console.log("=== Poll Phase Demo ===\n");

// Create file for testing
const testFile = path.join(__dirname, "test.txt");
fs.writeFileSync(testFile, "Hello, Event Loop!");

console.log("1. Script starts");

// File I/O callback is processed in poll phase
fs.readFile(testFile, "utf-8", (err, data) => {
  if (err) throw err;
  console.log(`4. File read complete: "${data}"`);

  // Cleanup
  fs.unlinkSync(testFile);
});

// setTimeout is processed in timers phase
setTimeout(() => {
  console.log("3. Timeout callback");
}, 0);

console.log("2. Script ends");

/*
Output:
=== Poll Phase Demo ===

1. Script starts
2. Script ends
3. Timeout callback
4. File read complete: "Hello, Event Loop!"

Explanation:
- Synchronous code runs first (1, 2)
- After sync code completes, event loop starts
- Timers phase: execute setTimeout callback (3)
- Poll phase: wait and execute file read callback (4)
*/
