import type { ModelConfig } from "../../../types";

export const models = {
  "kimi-k2.6": {
    name: "MoonshotAI Kimi K2.6",
    author: "moonshotai",
    description: "MoonshotAI's multimodal Kimi K2.6 model.",
    contextLength: 262_144,
    maxOutputTokens: 235_929,
    created: "2026-04-20T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "MoonshotAI",
  },
} satisfies Record<string, ModelConfig>;
