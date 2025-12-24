import * as fs from "fs";

console.log("=== Pitfall: Unhandled Promise ===\n");

// BAD: Promise rejection not caught
fs.readFile(__filename, () => {
  // Promise rejection will be swallowed
  Promise.reject(new Error("[BAD] Oops"));
});

// GOOD: Always handle rejections
fs.readFile(__filename, () => {
  Promise.reject(new Error("[GOOD] Oops")).catch((err) => {
    console.error("Caught error:", err.message);
  });
});

// BETTER: Use async/await with try-catch
fs.readFile(__filename, async () => {
  try {
    await Promise.reject(new Error("[BETTER] Oops"));
  } catch (err) {
    console.error("Caught error:", (err as Error).message);
  }
});

// Global handler (last resort)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
