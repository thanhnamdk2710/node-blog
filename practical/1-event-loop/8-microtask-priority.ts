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
