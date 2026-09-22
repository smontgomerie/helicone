import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.5": {
    name: "OpenAI GPT-5.5",
    author: "openai",
    description:
      "GPT-5.5 is an OpenAI frontier model with a 1.05M-token context window.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-04-23T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.5-2026-04-23": {
    name: "OpenAI GPT-5.5 (2026-04-23)",
    author: "openai",
    description: "Pinned April 23, 2026 snapshot of OpenAI GPT-5.5.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-04-23T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-5.5",
  },
} satisfies Record<string, ModelConfig>;

export type GPT55ModelName = keyof typeof models;
