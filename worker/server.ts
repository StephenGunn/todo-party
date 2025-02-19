import {
  Server,
  type Connection,
  routePartykitRequest,
  ConnectionContext,
  WSMessage,
} from "partyserver";

import type { Todo, Message } from "../src/types";

type Env = {
  TodoParty: DurableObjectNamespace<TodoParty>;
};

type TodoStore = Map<string, Todo>;

export class TodoParty extends Server<Env> {
  todos: Map<string, Todo> = new Map();

  private serialize = (type: "sync", todos: TodoStore) => {
    return JSON.stringify({
      type,
      todos: [...todos.values()],
    });
  };

  addTodo(todo: Todo) {
    this.todos.set(todo.id, todo);
    this.broadcast(this.serialize("sync", this.todos));
  }

  removeTodo(id: string) {
    this.todos.delete(id);
    this.broadcast(this.serialize("sync", this.todos));
  }

  updateTodo(id: string, todo: Todo) {
    this.todos.set(id, todo);
    this.broadcast(this.serialize("sync", this.todos));
  }

  onConnect(
    connection: Connection,
    _ctx: ConnectionContext,
  ): void | Promise<void> {
    connection.send(this.serialize("sync", this.todos));
  }

  onMessage(_conn: Connection, message: WSMessage) {
    const msg: Message = JSON.parse(message.toString());
    switch (msg.type) {
      case "add":
        this.addTodo(msg.todo);
        break;
      case "remove":
        this.removeTodo(msg.todo.id);
        break;
      case "update":
        this.updateTodo(msg.todo.id, msg.todo);
        break;
      default:
        console.log("Unknown message type", msg.type);
        break;
    }
  }

  onError(connection: Connection, error: unknown): void | Promise<void> {
    console.log("Error", error);
    connection.send("There was an error in your durable object.");
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
