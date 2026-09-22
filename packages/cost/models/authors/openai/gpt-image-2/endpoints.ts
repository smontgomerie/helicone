import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPTImage2ModelName } from "./models";

/**
 * OpenAI bills the GPT Image 2 line on separate text and image token rates
 * (verified against the OpenAI model pages, Sep 2026):
 *   text input  $5.00 / 1M   (cached text  $1.25 / 1M -> 0.25x)
 *   image input $8.00 / 1M   (cached image $2.00 / 1M -> 0.25x)
 *   image output $30.00 / 1M (text output is not billed for image-output models)
 */
const gptImage2Pricing = () => [
  {
    threshold: 0,
    input: 0.000005, // $5.00 per 1M text input tokens
    output: 0, // text output is not billed for image-output models
    cacheMultipliers: {
      cachedInput: 0.25, // $1.25 per 1M cached text tokens
    },
    image: {
      input: 0.000008, // $8.00 per 1M image input tokens
      cachedInputMultiplier: 0.25, // $2.00 per 1M cached image tokens
      output: 0.00003, // $30.00 per 1M image output tokens
    },
  },
];

const gptImage2Endpoint = (providerModelId: string): ModelProviderConfig => ({
  providerModelId,
  provider: "openai",
  author: "openai",
  pricing: gptImage2Pricing(),
  contextLength: 8192,
  maxCompletionTokens: 4096,
  rateLimits: {
    rpm: 500,
    tpm: 1000000,
  },
  supportedParameters: ["n"],
  ptbEnabled: false,
  endpointConfigs: {
    "*": {},
  },
});

export const endpoints = {
  "gpt-image-2:openai": gptImage2Endpoint("gpt-image-2"),
  "gpt-image-2-2026-04-21:openai": gptImage2Endpoint("gpt-image-2-2026-04-21"),
} satisfies Partial<
  Record<`${GPTImage2ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
