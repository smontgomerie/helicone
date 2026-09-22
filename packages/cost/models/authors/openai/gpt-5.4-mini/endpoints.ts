import type { ModelProviderConfig } from "../../../types";

const supportedParameters = [
  "tools",
  "tool_choice",
  "seed",
  "max_completion_tokens",
  "response_format",
  "stop",
  "verbosity",
  "temperature",
  "top_p",
  "logprobs",
] as const;

const unsupportedParameters = [
  "presence_penalty",
  "frequency_penalty",
  "top_logprobs",
  "logit_bias",
  "max_tokens",
] as const;

const pricing = [
  {
    threshold: 0,
    input: 0.00000075, // $0.75 per 1M tokens
    output: 0.0000045, // $4.50 per 1M tokens
    cacheMultipliers: { cachedInput: 0.1 }, // $0.075 per 1M tokens
  },
];

export const endpoints = {
  "gpt-5.4-mini:openai": {
    providerModelId: "gpt-5.4-mini",
    provider: "openai",
    author: "openai",
    pricing,
    contextLength: 400_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [...unsupportedParameters],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
  "gpt-5.4-mini-2026-03-17:openai": {
    providerModelId: "gpt-5.4-mini-2026-03-17",
    provider: "openai",
    author: "openai",
    pricing,
    contextLength: 400_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [...unsupportedParameters],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
} satisfies Record<string, ModelProviderConfig>;
