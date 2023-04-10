import { ChatCompletionRequestMessage } from "openai";
import { ActionIt } from "../../dist/index";
import * as dotenv from "dotenv";
dotenv.config();

interface Task {
  title: string;
  description: string;
  dueDate: Date;
}

const run = async () => {
  const taskGroups: {
    [key: string]: Task[];
  } = {};
  let tasks: Task[] = [];

  const addTask = (task: Task) => {
    if (!task.title) {
      throw new Error("Missing task title");
    }

    tasks.push(task);
  };

  const removeTask = ({ taskName }: { taskName: string }) => {
    const taskIndex = tasks.findIndex((e) => e.title === taskName);

    if (taskIndex !== -1) {
      tasks.splice(taskIndex, 1);
    }
  };

  const getTasks = () => {
    console.log(tasks);
  };

  const updateTask = ({
    taskName,
    newTitle,
    newDescription,
    newDueDate,
  }: {
    taskName: string;
    newTitle: string;
    newDescription: string;
    newDueDate: Date;
  }) => {
    const taskIndex = tasks.findIndex((e) => e.title === taskName);

    if (taskIndex !== -1) {
      if (newTitle) {
        tasks[taskIndex].title = newTitle;
      }

      if (newDescription) {
        tasks[taskIndex].description = newDescription;
      }

      if (newDueDate) {
        tasks[taskIndex].dueDate = newDueDate;
      }
    }
  };

  const actionIt = new ActionIt({
    open_ai_api_key: process.env.OPEN_AI_API_KEY || "",
    on_response: (response: string) => {
      console.log(response);
      console.log(tasks);
    },
  });

  actionIt.addFunction({
    name: "addTask",
    function: addTask,
    description: "Adds a new task",
    parameters: {
      title: { type: "string", required: true },
      description: { type: "string", required: false },
      dueDate: { type: "Date", required: false },
    },
  });

  actionIt.addFunction({
    name: "removeTask",
    function: removeTask,
    description: "Removes a task by name",
    parameters: {
      taskName: { type: "string", required: true },
    },
  });

  actionIt.addFunction({
    name: "getTasks",
    function: getTasks,
    description: "Gets all tasks",
    parameters: {},
  });

  actionIt.addFunction({
    name: "updateTask",
    function: updateTask,
    description: "Updates a task by name",
    parameters: {
      taskName: { type: "string", required: true },
      newTitle: { type: "string", required: false },
      newDescription: { type: "string", required: false },
      newDueDate: { type: "string", required: false },
    },
  });

  const messages: ChatCompletionRequestMessage[] = [];

  const [userMessage, assistantMessage] = await actionIt.handleSingleInput(
    "task get food for 10th may 2023",
    `Task list: ${JSON.stringify(tasks)}`
  );

  messages.push(userMessage);
  messages.push(assistantMessage);

  const [userMessage2, assistantMessage2] = await actionIt.handleMessagesInput(
    messages,
    "I meant add",
    `Task list: ${JSON.stringify(tasks)}`
  );

  messages.push(userMessage2);
  messages.push(assistantMessage2);

  await actionIt.handleMessagesInput(
    messages,
    "Great thanks, task is to get food by 2/2/2023. I need to get milk, cheese and beef",
    `Task list: ${JSON.stringify(tasks)}`
  );
};

run();
