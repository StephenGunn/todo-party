export type Message = {
  type: "add" | "remove" | "update";
  todo: Todo;
};

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
};
