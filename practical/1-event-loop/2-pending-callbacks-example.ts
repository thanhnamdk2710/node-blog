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
