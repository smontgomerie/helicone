import type { ModelConfig } from "../../../types";

export const models = {
  "nemotron-3-super-120b-a12b": {
    name: "NVIDIA Nemotron 3 Super",
    author: "nvidia",
    description: "NVIDIA's 120B-parameter hybrid MoE model.",
    contextLength: 262_144,
    maxOutputTokens: 16_384,
    created: "2026-03-11T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Llama",
  },
  "nemotron-3-super-120b-a12b-free": {
    name: "NVIDIA Nemotron 3 Super (free)",
    author: "nvidia",
    description: "Free OpenRouter variant of NVIDIA Nemotron 3 Super.",
    contextLength: 262_144,
    maxOutputTokens: 235_929,
    created: "2026-03-11T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Llama",
  },
} satisfies Record<string, ModelConfig>;
