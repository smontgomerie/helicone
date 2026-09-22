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
    input: 0.000005, // $5.00 per 1M tokens
    output: 0.00003, // $30.00 per 1M tokens
    cacheMultipliers: { cachedInput: 0.1 }, // $0.50 per 1M tokens
  },
  {
    threshold: 272_000,
    input: 0.00001, // 2x input above 272K input tokens
    output: 0.000045, // 1.5x output above 272K input tokens
  },
];

export const endpoints = {
  "gpt-5.5:openai": {
    providerModelId: "gpt-5.5",
    provider: "openai",
    author: "openai",
    pricing,
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [...unsupportedParameters],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
  "gpt-5.5-2026-04-23:openai": {
    providerModelId: "gpt-5.5-2026-04-23",
    provider: "openai",
    author: "openai",
    pricing,
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [...supportedParameters],
    unsupportedParameters: [...unsupportedParameters],
    ptbEnabled: true,
    endpointConfigs: { "*": {} },
  },
} satisfies Record<string, ModelProviderConfig>;
