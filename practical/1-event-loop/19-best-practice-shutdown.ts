import * as http from "http";

class GracefulServer {
  private server: http.Server;
  private connections = new Set<any>();
  private isShuttingDown = false;

  constructor() {
    this.server = http.createServer((req, res) => {
      // Simulate slow request
      setTimeout(() => {
        res.end("Hello World");
      }, 100);
    });

    this.server.on("connection", (conn) => {
      this.connections.add(conn);
      conn.on("close", () => {
        this.connections.delete(conn);
      });
    });
  }

  start(port: number): void {
    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    // Handle shutdown signals
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("SIGINT", () => this.shutdown("SIGINT"));
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    this.server.close(() => {
      console.log("Server closed");
    });

    // Given in-flight requests time to complete
    const timeout = setTimeout(() => {
      console.log("Forcing shutdown...");
      this.connections.forEach((conn) => conn.destroy());
    }, 10000);

    // Use setImmediate to allow pending I/O to complete
    setImmediate(() => {
      // Cleanup resources
      console.log("Cleaning up...");

      // Use nextTick for final logging
      process.nextTick(() => {
        console.log("Shutdown complete");
        clearTimeout(timeout);
        process.exit(0);
      });
    });
  }
}

// Usage
const server = new GracefulServer();
server.start(3000);

/*
Server listening on port 3000
SIGINT received. Starting graceful shutdown...
Server closed
Cleaning up...
Shutdown complete
*/
