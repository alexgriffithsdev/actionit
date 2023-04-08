import { ActionIt } from "../../dist/index";
import * as dotenv from "dotenv";
dotenv.config();

interface Task {
  title: string;
  description: string;
  dueDate: Date;
}

const run = async () => {
  let tasks: Task[] = [];

  const addTask = (task: Task) => {
    tasks.push(task);
    console.log("Added task");
  };

  const removeTask = (taskName: string) => {
    const taskIndex = tasks.findIndex((e) => e.title === taskName);

    if (taskIndex !== -1) {
      tasks = tasks.splice(taskIndex, 1);
      console.log("Removed task");
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

      console.log("Updated task");
    }
  };

  const actionIt = new ActionIt({
    open_ai_api_key: process.env.OPEN_AI_API_KEY || "",
  });

  actionIt.addFunction({
    name: "addTask",
    function: addTask,
    description: "Adds a new task",
    parameters: {
      title: "string",
      description: "string",
      dueDate: "Date",
    },
  });

  actionIt.addFunction({
    name: "removeTask",
    function: removeTask,
    description: "Removes a task by name",
    parameters: {
      taskName: "string",
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
      taskName: "string",
      newTitle: "string",
      newDescription: "string",
      newDueDate: "Date",
    },
  });

  await actionIt.handleNewInput(
    "Create a task called get food, basically I need to go and buy food by monday 21st april 2023"
  );

  console.log("Tasks: ", tasks);

  await actionIt.handleNewInput(
    "Create a task called email Dave, Need to wish Dave happy birthday for Tomorrow (29/1/2023)"
  );

  console.log("Tasks: ", tasks);

  await actionIt.handleNewInput(
    "Actually I need to delete the email dave task."
  );

  console.log("Tasks: ", tasks);

  await actionIt.handleNewInput("Update the 'get food' task to be 5/5/2023");

  console.log("Tasks: ", tasks);
};

run();
