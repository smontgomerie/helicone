import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT6SolModelName } from "./models";

export const endpoints = {
  "gpt-6-sol:openai": {
    providerModelId: "gpt-6-sol",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2 per 1M tokens
        output: 0.00001, // $10 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.20 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.000004, // $4 per 1M tokens (2x for >272K context)
        output: 0.000015, // $15 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    rateLimits: {
      rpm: 15000,
      tpm: 40000000,
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
  Record<`${GPT6SolModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
