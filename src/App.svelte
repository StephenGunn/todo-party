<script lang="ts">
  import PartySocket from "partysocket";
  import type { Todo } from "./types";

  const ws = new PartySocket({
    host: window.location.host,
    room: "main",
    party: "todo-party",
  });

  let todos: Todo[] = $state([]);

  function onMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "sync":
          todos = data.todos;
          break;
        default:
          console.log("Unknown message type", data.type);
          break;
      }
      console.log(data);
    } catch (e) {
      console.error(e);
    }
  }

  const createHash = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  let newTodo: {
    text: string | undefined;
    completed: false;
  } = $state({
    text: undefined,
    completed: false,
  });

  const handleAdd = () => {
    const toAdd = {
      type: "add",
      todo: {
        id: createHash(),
        text: newTodo.text,
        completed: false,
      },
    };

    try {
      ws.send(JSON.stringify(toAdd));
      newTodo.text = undefined;
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = (todo: Todo) => {
    const toUpdate = {
      type: "update",
      todo,
    };
    try {
      ws.send(JSON.stringify(toUpdate));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = (id: string) => {
    const toRemove = {
      type: "remove",
      todo: {
        id,
      },
    };
    try {
      ws.send(JSON.stringify(toRemove));
    } catch (e) {
      console.error(e);
    }
  };

  ws.onmessage = onMessage;
</script>

{#snippet todo(id: string, text: string, completed: boolean)}
  <div class="todo">
    <div class="text">
      {text}
    </div>
    <div class="buttons">
      <button
        onclick={() => {
          handleUpdate({
            id,
            text,
            completed: !completed,
          });
        }}
      >
        {#if completed}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
            ><rect width="256" height="256" fill="none" /><polyline
              points="88 136 112 160 168 104"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            /><circle
              cx="128"
              cy="128"
              r="96"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            /></svg
          >
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
            ><rect width="256" height="256" fill="none" /><circle
              cx="128"
              cy="128"
              r="96"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            /></svg
          >
        {/if}
        completed
      </button>

      <button
        onclick={() => {
          handleRemove(id);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
          ><rect width="256" height="256" fill="none" /><line
            x1="216"
            y1="56"
            x2="40"
            y2="56"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          /><line
            x1="104"
            y1="104"
            x2="104"
            y2="168"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          /><line
            x1="152"
            y1="104"
            x2="152"
            y2="168"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          /><path
            d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          /><path
            d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="16"
          /></svg
        >

        remove
      </button>
    </div>
  </div>
{/snippet}

<main>
  <h1>Todo Party</h1>
  <div class="add">
    <input type="text" bind:value={newTodo.text} placeholder="Add a todo" />
    <button onclick={handleAdd}>Add</button>
  </div>

  <div class="grid">
    {#each todos as t}
      {@render todo(t.id, t.text, t.completed)}
    {/each}
  </div>
</main>

<style>
  .text {
    font-size: 1.5rem;
    font-weight: bold;
    padding: 1rem;
    text-align: left;
  }

  .buttons,
  .add {
    display: flex;
    gap: 1rem;
  }

  .add {
    margin-bottom: 1rem;
  }

  .add input {
    width: 100%;
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  button {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .todo {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
