import { test, expect } from "@jest/globals";
import { getMaxMessageSubset } from "../src/utils/tokenLimits";
import { ChatCompletionRequestMessage } from "openai";

const fakeSystemMessage: ChatCompletionRequestMessage = {
  role: "system",
  content: "You are an assistant!",
};
const fakeMaxTokens = 100;

test("getMaxMessageSubset works for empty arrays", () => {
  const messageSubset = getMaxMessageSubset(
    [],
    fakeSystemMessage,
    fakeMaxTokens
  );

  expect(messageSubset.length).toEqual(1);
  expect(messageSubset[0].role).toEqual(fakeSystemMessage.role);
  expect(messageSubset[0].content).toEqual(fakeSystemMessage.content);
});

test("getMaxMessageSubset returns the full array for arrays that don't exceed the token window", () => {
  const fakeUserMessage: ChatCompletionRequestMessage = {
    role: "user",
    content: "What bear is best?",
  };

  const messageSubset = getMaxMessageSubset(
    [fakeUserMessage],
    fakeSystemMessage,
    fakeMaxTokens
  );

  expect(messageSubset.length).toEqual(2);
  expect(messageSubset[1].role).toEqual(fakeUserMessage.role);
  expect(messageSubset[1].content).toEqual(fakeUserMessage.content);
});

test("getMaxMessageSubset returns a subset for arrays that exceed the token window", () => {
  // From https://platform.openai.com/docs/guides/chat/introduction example
  // Should be 126 tokens
  const firstFakeSystemMessage: ChatCompletionRequestMessage = {
    role: "system",
    content:
      "You are a helpful, pattern-following assistant that translates corporate jargon into plain English.",
  };

  const fakeMessages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      name: "example_user",
      content: "New synergies will help drive top-line growth.",
    },
    {
      role: "system",
      name: "example_assistant",
      content: "Things working well together will increase revenue.",
    },
    {
      role: "system",
      name: "example_user",
      content:
        "Let's circle back when we have more bandwidth to touch base on opportunities for increased leverage.",
    },
    {
      role: "system",
      name: "example_assistant",
      content: "Let's talk later when we're less busy about how to do better.",
    },
    {
      role: "user",
      content:
        "This late pivot means we don't have time to boil the ocean for the client deliverable.",
    },
  ];

  const messageSubset = getMaxMessageSubset(
    fakeMessages,
    firstFakeSystemMessage,
    0,
    125
  );

  expect(messageSubset.length).toEqual(5);
});

test("getMaxMessageSubset returns the full array for arrays that don't exceed the token window (2nd test)", () => {
  // From https://platform.openai.com/docs/guides/chat/introduction example
  // Should be 126 tokens
  const firstFakeSystemMessage: ChatCompletionRequestMessage = {
    role: "system",
    content:
      "You are a helpful, pattern-following assistant that translates corporate jargon into plain English.",
  };

  const fakeMessages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      name: "example_user",
      content: "New synergies will help drive top-line growth.",
    },
    {
      role: "system",
      name: "example_assistant",
      content: "Things working well together will increase revenue.",
    },
    {
      role: "system",
      name: "example_user",
      content:
        "Let's circle back when we have more bandwidth to touch base on opportunities for increased leverage.",
    },
    {
      role: "system",
      name: "example_assistant",
      content: "Let's talk later when we're less busy about how to do better.",
    },
    {
      role: "user",
      content:
        "This late pivot means we don't have time to boil the ocean for the client deliverable.",
    },
  ];

  const messageSubset = getMaxMessageSubset(
    fakeMessages,
    firstFakeSystemMessage,
    0,
    126
  );

  expect(messageSubset.length).toEqual(6);
});
