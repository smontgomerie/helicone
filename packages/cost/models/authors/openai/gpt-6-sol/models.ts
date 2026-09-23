import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-6-sol": {
    name: "OpenAI GPT-6 Sol",
    author: "openai",
    description:
      "GPT-6 Sol is built for complex coding and agentic workflows. Reasoning.effort supports: none, low, medium (default), high, xhigh and max. Features a 1.05M context window and 128K max output tokens. Use the Responses API for built-in tools and function calling; Chat Completions supports function calling only with reasoning_effort set to none.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-09-22T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT6SolModelName = keyof typeof models;
