import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-image-2": {
    name: "OpenAI GPT Image 2",
    author: "openai",
    description:
      "GPT Image 2 is OpenAI's next-generation image generation model that turns text and image inputs into high-fidelity images. It bills on separate text and image token rates, with cached-rate multipliers for both modalities.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-04-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
  "gpt-image-2-2026-04-21": {
    name: "OpenAI GPT Image 2",
    author: "openai",
    description:
      "Dated snapshot of GPT Image 2 (2026-04-21). Billed on the same per-modality text and image token rates as gpt-image-2.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-04-21T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-image-2",
  },
} satisfies Record<string, ModelConfig>;

export type GPTImage2ModelName = keyof typeof models;
