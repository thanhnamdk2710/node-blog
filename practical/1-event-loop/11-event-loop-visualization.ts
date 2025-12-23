console.log("=== Complete Event Loop Visualization ===\n");

// To track order
const order: string[] = [];
const log = (msg: string): void => {
  order.push(msg);
  console.log(msg);
};

// Synchronous
log("1. Script start");

// Macrotask: Timers phase
setTimeout(() => {
  log("7. setTimeout 1");

  process.nextTick(() => {
    log("8. nextTick inside setTimeout");
  });
  Promise.resolve().then(() => {
    log("9. Promise inside setTimeout");
  });
}, 0);

setTimeout(() => {
  log("10. setTimeout 2");
}, 0);

// Macrotask: Check phase
setImmediate(() => {
  log("11. setImmediate 1");

  process.nextTick(() => {
    log("12. nextTick inside setImmediate");
  });
});

setImmediate(() => {
  log("13. setImmediate 2");
});

// Microtask: Promise
Promise.resolve()
  .then(() => {
    log("4. Promise 1");
    return Promise.resolve();
  })
  .then(() => {
    log("6. Promise 2 (chained)");
  });

// Microtask: queueMicrotask
queueMicrotask(() => {
  log("5. queueMicrotask");
});

// Microtask: nextTick (highest priority)
process.nextTick(() => {
  log("3. nextTick 1");
});

process.nextTick(() => {
  log("3.5 nextTick 2");
});

log("2. Script end");

// Final result
setTimeout(() => {
  console.log("\n=== Execution Order Summary ===");
  console.log(order.join("\n"));
}, 100);

/*
Expected Output:
1. Script start
2. Script end
3. nextTick 1
3.5. nextTick 2
4. Promise 1
5. queueMicrotask
6. Promise 2 (chained)
7. setTimeout 1
8. nextTick inside setTimeout
9. Promise inside setTimeout
10. setTimeout 2
11. setImmediate 1
12. nextTick inside setImmediate
13. setImmediate 2
*/
