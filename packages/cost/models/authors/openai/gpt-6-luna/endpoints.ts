import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT6LunaModelName } from "./models";

export const endpoints = {
  "gpt-6-luna:openai": {
    providerModelId: "gpt-6-luna",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001, // $0.10 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.01 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.0000002, // $0.20 per 1M tokens (2x for >272K context)
        output: 0.00000075, // $0.75 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    rateLimits: {
      rpm: 30000,
      tpm: 180000000,
      tpd: 15000000000,
    },
    supportedParameters: [
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
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT6LunaModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
