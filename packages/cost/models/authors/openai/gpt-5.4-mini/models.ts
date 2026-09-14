import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-5.4-mini": {
    name: "OpenAI GPT-5.4 mini",
    author: "openai",
    description:
      "GPT-5.4 mini is a faster, lower-cost GPT-5.4 model for high-volume workloads.",
    contextLength: 400_000,
    maxOutputTokens: 128_000,
    created: "2026-03-17T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "gpt-5.4-mini-2026-03-17": {
    name: "OpenAI GPT-5.4 mini (2026-03-17)",
    author: "openai",
    description:
      "Pinned March 17, 2026 snapshot of OpenAI GPT-5.4 mini.",
    contextLength: 400_000,
    maxOutputTokens: 128_000,
    created: "2026-03-17T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-5.4-mini",
  },
} satisfies Record<string, ModelConfig>;

export type GPT54MiniModelName = keyof typeof models;
