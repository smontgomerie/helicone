import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-6-astra": {
    name: "OpenAI GPT-6 Astra",
    author: "openai",
    description:
      "GPT-6 Astra is our most capable model, built for the hardest end-to-end work. Use it for complex reasoning, coding, computer use, research, and document creation. Reasoning.effort supports: low, medium, high, xhigh and max. Features a 1.05M context window and 128K max output tokens.",
    contextLength: 1_050_000,
    maxOutputTokens: 128_000,
    created: "2026-09-03T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT6AstraModelName = keyof typeof models;
