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
