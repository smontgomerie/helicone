import type { ModelConfig } from "../../../types";

/**
 * GPT Image 2.5 family. OpenAI publishes the 2.5 line under the named variants
 * `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` (plus dated snapshots).
 * There is no bare `gpt-image-2.5` alias in the published model list, so the
 * variant IDs are registered directly.
 */
export const models = {
  "gpt-image-2.5-flare": {
    name: "OpenAI GPT Image 2.5 Flare",
    author: "openai",
    description:
      "GPT Image 2.5 Flare is a variant of OpenAI's GPT Image 2.5 image-generation family that turns text and image inputs into high-fidelity images. It bills on separate text and image token rates, with cached-rate multipliers for both modalities.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
  "gpt-image-2.5-flare-2026-09-08": {
    name: "OpenAI GPT Image 2.5 Flare",
    author: "openai",
    description:
      "Dated snapshot of GPT Image 2.5 Flare (2026-09-08). Billed on the same per-modality text and image token rates as gpt-image-2.5-flare.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-09-08T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-image-2.5-flare",
  },
  "gpt-image-2.5-sunburst": {
    name: "OpenAI GPT Image 2.5 Sunburst",
    author: "openai",
    description:
      "GPT Image 2.5 Sunburst is a variant of OpenAI's GPT Image 2.5 image-generation family that turns text and image inputs into high-fidelity images. It bills on separate text and image token rates, with cached-rate multipliers for both modalities.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-09-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
  },
  "gpt-image-2.5-sunburst-2026-09-08": {
    name: "OpenAI GPT Image 2.5 Sunburst",
    author: "openai",
    description:
      "Dated snapshot of GPT Image 2.5 Sunburst (2026-09-08). Billed on the same per-modality text and image token rates as gpt-image-2.5-sunburst.",
    contextLength: 8192,
    maxOutputTokens: 4096,
    created: "2026-09-08T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["image", "text"] },
    tokenizer: "GPT",
    pinnedVersionOfModel: "gpt-image-2.5-sunburst",
  },
} satisfies Record<string, ModelConfig>;

export type GPTImage25ModelName = keyof typeof models;
