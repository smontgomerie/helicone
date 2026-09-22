import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "kimi-k2.6:openrouter": {
    providerModelId: "moonshotai/kimi-k2.6",
    providerModelIdAliases: ["moonshotai/kimi-k2.6-20260420"],
    provider: "openrouter",
    author: "moonshotai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000095,
        output: 0.000004,
        cacheMultipliers: { cachedInput: 0.00000016 / 0.00000095 },
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 235_929,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "reasoning",
    ],
    unsupportedParameters: [],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
} satisfies Record<string, ModelProviderConfig>;
