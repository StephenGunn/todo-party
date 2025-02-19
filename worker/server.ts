import {
  Server,
  type Connection,
  routePartykitRequest,
  ConnectionContext,
  WSMessage,
} from "partyserver";

import type { Todo } from "../src/types";

type Env = {
  TodoParty: DurableObjectNamespace<TodoParty>;
};

export class TodoParty extends Server<Env> {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS todos(
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      text        TEXT,
      completed   BOOLEAN DEFAULT FALSE
    );`);
  }

  private serialize(type: "sync", todos: any[]) {
    return JSON.stringify({
      type,
      todos,
    });
  }

  addTodo(todo: Todo) {
    try {
      this.sql.exec(`
        INSERT INTO todos (text, completed) 
        VALUES ('${todo.text}', ${todo.completed ? 1 : 0});
      `);

      const todos = this.sql.exec(`SELECT * FROM todos;`).toArray();
      this.broadcast(this.serialize("sync", todos));
    } catch (error) {
      console.error("Error adding todo:", error);
      throw error;
    }
  }

  removeTodo(id: number) {
    try {
      this.sql.exec(`DELETE FROM todos WHERE id = ${id};`);

      const todos = this.sql.exec(`SELECT * FROM todos;`).toArray();
      this.broadcast(this.serialize("sync", todos));
    } catch (error) {
      console.error("Error removing todo:", error);
      throw error;
    }
  }

  updateTodo(todo: Todo) {
    try {
      if (!todo.id) {
        throw new Error("Todo ID is required for update");
      }

      this.sql.exec(`
        UPDATE todos 
        SET text = '${todo.text}', completed = ${todo.completed ? 1 : 0}
        WHERE id = ${todo.id};
      `);

      const todos = this.sql.exec(`SELECT * FROM todos;`).toArray();
      this.broadcast(this.serialize("sync", todos));
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  }

  getTodos() {
    try {
      return this.sql.exec(`SELECT * FROM todos;`).toArray();
    } catch (error) {
      console.error("Error getting todos:", error);
      throw error;
    }
  }

  onConnect(connection: Connection, _ctx: ConnectionContext) {
    try {
      const todos = this.getTodos();
      connection.send(this.serialize("sync", todos));
    } catch (error) {
      console.error("Error in onConnect:", error);
      connection.send(
        JSON.stringify({
          type: "error",
          message: "Failed to load todos",
        }),
      );
    }
  }

  onMessage(connection: Connection, message: WSMessage) {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case "add":
          this.addTodo(msg.todo);
          break;
        case "remove":
          this.removeTodo(msg.todo.id);
          break;
        case "update":
          this.updateTodo(msg.todo);
          break;
        default:
          console.warn("Unknown message type:", msg.type);
      }
    } catch (error) {
      console.error("Error in onMessage:", error);
      connection.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        }),
      );
    }
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not found", {
        status: 404,
      })
    );
  },
} satisfies ExportedHandler<Env>;
