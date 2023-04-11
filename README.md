# ActionIt 🚀

ActionIt is a text-to-action library built to make it easier to perform actions based on natural language input. It opens the way for applications that don't only retrieve information but actually interact with functions, extracting necessary parameters or asking follow-up questions where necessary.

ActionIt is paving the way for the new era of human-software interactions.

## Features

- Effortlessly call and execute functions based on user input.
- Exponential backoff with retries for seamless handling of rate limiting.
- Sliding window approach to token limit cut off.

## Installation

Install ActionIt using npm or yarn:

```
npm install actionit
```

or

```
yarn add actionit
```

## Basic Usage

```javascript
const { ActionIt } = require("actionit");

const actionIt = new ActionIt({
  open_ai_api_key: process.env.OPEN_AI_API_KEY,
  on_response: (response) => {
    console.log(response);
  },
});

const addTwoNumbers = ({ x, y }) => {
  return x + y;
};

actionIt.addFunction({
  name: "addTwoNumbers",
  function: addTwoNumbers,
  description: "Adds two numbers together and returns their sum",
  parameters: {
    x: { type: "number", required: true },
    y: { type: "number", required: true },
  },
});

const [userMessage, assistantMessage] = await actionIt.handleSingleInput(
  "Find the sum of 1 and 8"
);
```

### Notes

- Ensure that functions have named arguments, as they will be used as the function args.
- Always verify the types and null values of all variables passed to functions, as the model may miss a required function or provide it in the wrong type.
- Be prepared for prompt injections – always implement authentication and authorization on top of any function passed to the model if they access or modify any data.

### Feature requests

Feel free to suggest any features/improvements that you would consider useful for interacting with functions via natural language. I will look at implementing any requests ASAP.
