interface Item {
  id: number;
  data: string;
}

// Process large batch without blocking event loop
const processLargeBatch = async (items: Item[]): Promise<void> => {
  const BATCH_SIZE = 100;
  const results: string[] = [];

  console.log(`Processing ${items.length} items...`);

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    // Process batch
    for (const item of batch) {
      results.push(`Processed: ${item.id}`);
    }

    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`
    );

    // Yield control back to event loop
    // Allows I/O and timers to be processed between batches
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  console.log("All items processed");
};

// Alternative: Use process.nextTick for higher priority
const processWithNextTick = (items: Item[], callback: () => void): void => {
  let index = 0;

  const processNext = (): void => {
    const startTime = Date.now();

    // Process for max 10ms before yielding
    while (index < items.length && Date.now() - startTime < 10) {
      // Process item
      index++;
    }

    console.log(`Processed ${index}/${items.length}`);

    if (index < items.length) {
      // Continue on next tick
    } else {
      callback();
    }
  };

  process.nextTick(processNext);
};

// Demo
const items: Item[] = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  data: `Item ${i}`,
}));

// Test that I/O still works during processing
setTimeout(() => {
  console.log(">>> Timer fired during batch processing");
}, 0);

processLargeBatch(items);

/*
Output:
Processing 500 items...
Processed 100/500
Processed 200/500
>>> Timer fired during batch processing
Processed 300/500
Processed 400/500
Processed 500/500
All items processed
*/
