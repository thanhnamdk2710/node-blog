console.log("=== Classic Interview Question ===\n");

async function async1(): Promise<void> {
  console.log("2. async1 start");
  await async2();
  console.log("6. async1 end");
}

async function async2(): Promise<void> {
  console.log("3. async2");
}

console.log("1. script start");

setTimeout(() => {
  console.log("8. setTimeout");
}, 0);

async1();

new Promise<void>((resolve) => {
  console.log("4. promise1");
  resolve();
}).then(() => {
  console.log("7. promise2");
});

console.log("5. script end");

/*
Output:
1. script start
2. async1 start
3. async2
4. promise1
5. script end
6. async1 end
7. promise2
8. setTimeout

Analysis:
1-5: Synchronous code (Promise constructor is sync!)
6-7: Microtasks (await = implicit Promise.then)
8: Macrotask (setTimeout)
*/
