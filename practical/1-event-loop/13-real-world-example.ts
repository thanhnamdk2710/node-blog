interface User {
  id: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  userId: string;
  total: number;
}

// Simulated async operations
const fetchUser = (id: string): Promise<User> => {
  return new Promise((resolve) => {
    // Simulating database query
    setTimeout(() => {
      resolve({ id, name: "Nam Nguyen", email: "namnguyen@example.com" });
    }, 100);
  });
};

const fetchOrders = (userId: string): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "order-1", userId, total: 99.99 },
        { id: "order-2", userId, total: 149.99 },
      ]);
    }, 50);
  });
};

const sendNotification = (userId: string): void => {
  // Fire-and-forget with setImmediate to not block response
  setImmediate(() => {
    console.log(`Notification sent to user ${userId}`);
  });
};

const logAnalytics = (event: string): void => {
  // Use nextTick for critical logging
  process.nextTick(() => {
    console.log(`Analytics: ${event}`);
  });
};

// API Handler simulation
const handleRequest = async (userId: string): Promise<void> => {
  console.log("1. Request received");

  logAnalytics("request_started");

  try {
    console.log("2. Fetching user...");
    const user = await fetchUser(userId);
    console.log(`3. User fetched: ${user.name}`);

    console.log("4. Fetching orders...");
    const orders = await fetchOrders(userId);
    console.log(`5. Orders fetched: ${orders.length} orders`);

    // Non-blocking notification
    sendNotification(userId);

    console.log("6. Request sent");
    logAnalytics("request_completed");
  } catch (error) {
    console.error("Error:", error);
    logAnalytics("request_failed");
  }
};

// Execute
handleRequest("user-123");
console.log("0. Handler called (sync)");

/*
Output:
1. Request received
2. Fetching user...
0. Handler called (sync)
Analytics: request_started
3. User fetched: Nam Nguyen
4. Fetching orders...
5. Orders fetched: 2 orders
6. Request sent
Analytics: request_completed
Notification sent to user user-123
*/
