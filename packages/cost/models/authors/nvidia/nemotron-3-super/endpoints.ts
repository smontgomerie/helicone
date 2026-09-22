import type { ModelProviderConfig } from "../../../types";

const supportedParameters = [
  "tools",
  "tool_choice",
  "max_tokens",
  "response_format",
  "temperature",
  "top_p",
  "reasoning",
] as const;

export const endpoints = {
  "nemotron-3-super-120b-a12b:openrouter": {
    providerModelId: "nvidia/nemotron-3-super-120b-a12b",
    providerModelIdAliases: [
      "nvidia/nemotron-3-super-120b-a12b-20230311",
    ],
    provider: "openrouter",
    author: "nvidia",
    pricing: [{ threshold: 0, input: 0.000000085, output: 0.0000004 }],
    contextLength: 262_144,
    maxCompletionTokens: 16_384,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
  "nemotron-3-super-120b-a12b-free:openrouter": {
    providerModelId: "nvidia/nemotron-3-super-120b-a12b:free",
    providerModelIdAliases: [
      "nvidia/nemotron-3-super-120b-a12b-20230311:free",
    ],
    provider: "openrouter",
    author: "nvidia",
    pricing: [{ threshold: 0, input: 0, output: 0 }],
    contextLength: 262_144,
    maxCompletionTokens: 235_929,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
} satisfies Record<string, ModelProviderConfig>;
