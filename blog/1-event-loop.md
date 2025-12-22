# Deep Dive: Node.js Event Loop - From Basics to Advanced

> Goal: After reading this article, you'll understand how Node.js handles async operations, predict code execution order, and debug timing-related issues.

## Table of Contents

1. Why Understanding the Event Loop Matters
2. Architecture Overview
3. Event Loop Phases
4. Microtask vs Macrotask
5. Real-world Examples and Analysis
6. Common Pitfalls
7. Best Practices

## 1. Why Understanding the Event Loop Matters

Node.js is single-threaded yet can handle thousands of concurrent connections. The secret lies in the Event Loop - the mechanism that that allows Node.js to perform non-blocking I/O operations.

Understanding the Event Loop helps you:

- Debug timing issues an race conditions
- Optimize application performance
- Avoid blocking the main thread
- Write async code correctly

## 2. Architecture Overview

```
   ┌───────────────────────────────────────────────────────────────┐
   │                        Node.js Runtime                        │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │                    V8 JavaScript Engine                 │  │
   │  │              (Call Stack, Heap, Garbage Collection)     │  │
   │  └─────────────────────────────────────────────────────────┘  │
   │                              │                                │
   │                              ▼                                │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │                        libuv                            │  │
   │  │                    (Event Loop)                         │  │
   │  │                                                         │  │
   │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
   │  │   │ Timers  │→ │  Poll   │→ │  Check  │→ │  Close  │    │  │
   │  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
   │  │         ↑                                      │        │  │
   │  │         └──────────────────────────────────────┘        │  │
   │  └─────────────────────────────────────────────────────────┘  │
   │                              │                                │
   │                              ▼                                │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │                    Thread Pool (4 threads)              │  │
   │  │           (File I/O, DNS, Crypto, Compression)          │  │
   │  └─────────────────────────────────────────────────────────┘  │
   └───────────────────────────────────────────────────────────────┘
```

### Event Loop Phases in Detail

```
   ┌───────────────────────────┐
   │         timers            │  ← setTimeout, setInterval callbacks
   └─────────────┬─────────────┘
                 │
   ┌─────────────▼─────────────┐
   │     pending callbacks     │  ← I/O callbacks deferred from previous loop
   └─────────────┬─────────────┘
                 │
   ┌─────────────▼─────────────┐
   │       idle, prepare       │  ← internal use only
   └─────────────┬─────────────┘
                 │
   ┌─────────────▼─────────────┐
   │          poll             │  ← retrieve new I/O events
   └─────────────┬─────────────┘     execute I/O related callbacks
                 │
   ┌─────────────▼─────────────┐
   │          check            │  ← setImmediate callbacks
   └─────────────┬─────────────┘
                 │
   ┌─────────────▼─────────────┐
   │     close callbacks       │  ← socket.on('close', ...)
   └───────────────────────────┘
```

**Important:** Between each phase, Node.js checks and executes the microtask queue (process.nextTick and Promises).

## 3. Event Loop Phases

### 3.1. Timers Phases

This phase executes callbacks scheduled by `setTimeout()` and `setInterval()`

```ts
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
```

**Important notes:**

- `setTimeout(fn, 0)` doesn't mean execute immediately
- Timers only guarantee the callback will not run before the specified time
- If main thread is blocked, timers will be delayed

### 3.2. Pending Callbacks Phase

This phase executes I/O callbacks deferred from the previous loop iteration (e.g., some TCP errors).

```ts
import * as net from "net";

console.log("=== Pending Callbacks Demo ===\n");

// Create connection to non-existent port
// Error callback will be queued in pending callbacks phase
const socket = net.connect(9999, "localhost");

socket.on("error", (err: AggregateError) => {
  const message = err.errors?.[0]?.message ?? err.message;
  console.log(`Connection error (pending callback): ${message}`);
});

console.log("Connection attempt initiated");

/*
Output:
=== Pending Callbacks Demo ===

Connection attempt initiated
Connection error (pending callback): connect ECONNREFUSED 127.0.0.1:9999
*/
```

### 3.3. Poll Phase

This is the most important phase. The poll phase has 2 main functions:

1. Calculate how long to block and poll for I/O
2. Process events in the poll queue

```ts
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
```

Poll Phase Behavior:

```ts
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
```

### 3.4. Check Phase

This phase executes callbacks from `setImmediate()`.

```ts
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
```

When does `setImmediate` definitely run before `setTimeout`?

```ts
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
```

### 3.5. Close Callbacks Phase

This phase handles close events, like `socket.on('close', ...)`.

```ts
import * as net from "net";

console.log("=== Close Callbacks Demo ===\n");

// Create server
const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("close", () => {
    console.log("Socket closed (close callbacks phase)");
  });

  // Close socket immediately
  socket.destroy();
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");

  // Create client connection
  const client = net.connect(3000);

  client.on("close", () => {
    console.log("Client connection closed");
    server.close();
  });
});

/*
Output:
=== Close Callbacks Demo ===

Server listening on port 3000
Client connected
Socket closed (close callbacks phase)
Client connection closed
*/
```

## 4. Microtask vs Macrotask

This is the most important part for understanding execution order in Node.js

### 4.1. Definitions

```
┌─────────────────────────────────────────────────────────────────┐
│                        MACROTASKS                               │
│  (Task Queue - one callback per event loop iteration)           │
│                                                                 │
│  • setTimeout                                                   │
│  • setInterval                                                  │
│  • setImmediate                                                 │
│  • I/O callbacks                                                │
│  • UI rendering (browser)                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        MICROTASKS                               │
│  (Processed completely after each macrotask and between phases) │
│                                                                 │
│  • process.nextTick    ← Highest priority                       │
│  • Promise.then/catch/finally                                   │
│  • queueMicrotask                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2. Priority Order

```ts
console.log("=== Microtask Priority ===\n");

// Macrotask
setTimeout(() => console.log("5. setTimeout"), 0);
setImmediate(() => console.log("6. setImmediate"));

// Microtask - processed before macrotasks
Promise.resolve().then(() => console.log("3. Promise.then"));
queueMicrotask(() => console.log("4. queueMicrotask"));

// process.nextTick - highest priority among microtasks
process.nextTick(() => console.log("2. process.nextTick"));

console.log("1. Sync code");

/*
Output:
=== Microtask Priority ===

1. Sync code
2. process.nextTick
3. Promise.then
4. queueMicrotask
5. setTimeout (or 6)
6. setImmediate (or 5)

Priority order:
1. Synchronous code
2. process.nextTick queue
3. Promise microtask queue
4. Macrotask queues (timers, check, etc.)
**** TypeScript can cause incorrect execution order because 
it runs during ESM/module execution timing.
*/
```

### 4.3. Microtasks Between Phase

```ts
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
```

### 4.4. process.nextTick vs setImmediate

```ts

```
