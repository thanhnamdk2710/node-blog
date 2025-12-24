import { EventEmitter } from "events";

interface DatabaseEvents {
  connected: [];
  error: [err: Error];
  query: [sql: string, duration: number];
}

class Database extends EventEmitter<DatabaseEvents> {
  constructor() {
    super();

    // GOOD: Use nextTick to emit after constructor returns
    // Allows listeners to be attached before event fires
    process.nextTick(() => {
      this.connect();
    });
  }

  private connect(): void {
    // Simulate async connection
    setTimeout(() => {
      this.emit("connected");
    }, 100);
  }

  query(sql: string): void {
    const start = Date.now();

    // Simulate query
    setTimeout(() => {
      this.emit("query", sql, Date.now() - start);
    }, 50);
  }
}

console.log("=== Event Emitter Pattern ===\n");

// Usage
const db = new Database();

// Listeners are attached BEFORE 'connected' event fires
db.on("connected", () => {
  console.log("Database connected");
  db.query("SELECT * FROM users");
});

db.on("query", (sql, duration) => {
  console.log(`Query "${sql}" took ${duration}ms`);
});

/*
=== Event Emitter Pattern ===

Database connected
Query "SELECT * FROM users" took 51ms
*/
