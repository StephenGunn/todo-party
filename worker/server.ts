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

export class TodoParty extends Server<Env> {
  todos: Map<string, Todo> = new Map();

  // function to serialize and stringify our todos map
  private serializeTodos() {
    return JSON.stringify([...this.todos.values()]);
  }

  addTodo(todo: Todo) {
    this.todos.set(todo.id, todo);
    this.broadcast(this.serializeTodos());
  }

  removeTodo(id: string) {
    this.todos.delete(id);
    this.broadcast(this.serializeTodos());
  }

  updateTodo(id: string, todo: Todo) {
    this.todos.set(id, todo);
    this.broadcast(this.serializeTodos());
  }

  onConnect(
    connection: Connection,
    _ctx: ConnectionContext,
  ): void | Promise<void> {
    connection.send(this.serializeTodos());
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
