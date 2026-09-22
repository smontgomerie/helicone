import { describe, expect, it } from "@jest/globals";
import type { ModelUsage } from "../../cost/usage/types";
import type { ModelProviderName } from "../../cost/models/providers";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";

/**
 * Regression: OpenAI GPT Image 2 / 2.5 (Flare / Sunburst) image models were
 * missing from the cost registry, so successful image requests resolved to
 * $0 / unknown cost. They are now registered with per-modality (text vs image)
 * token pricing. These tests assert the models resolve and bill on the
 * published rates (OpenAI model pages, Sep 2026):
 *   text input $5/1M (cached $1.25/1M), image input $8/1M (cached $2/1M),
 *   image output $30/1M; text output is not billed.
 */
const FAMILY = [
  "gpt-image-2",
  "gpt-image-2-2026-04-21",
  "gpt-image-2.5-flare",
  "gpt-image-2.5-flare-2026-09-08",
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-sunburst-2026-09-08",
];

describe("GPT Image family registry costing", () => {
  for (const modelId of FAMILY) {
    it(`${modelId} resolves a non-zero cost from the registry`, () => {
      const modelUsage: ModelUsage = {
        input: 1000, // text input tokens
        output: 0, // text output not billed
        image: {
          input: 1000,
          output: 1000,
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: modelId,
        provider: "openai" as ModelProviderName,
      });

      // The model must be present in the registry (pre-fix this was null -> $0).
      expect(breakdown).not.toBeNull();

      if (breakdown) {
        // text input: 1000 * $5/1M
        expect(breakdown.inputCost).toBeCloseTo(0.005, 10);
        // image input: 1000 * $8/1M
        expect(breakdown.image?.inputCost).toBeCloseTo(0.008, 10);
        // image output: 1000 * $30/1M
        expect(breakdown.image?.outputCost).toBeCloseTo(0.03, 10);
        // text output is not billed
        expect(breakdown.outputCost).toBeCloseTo(0, 10);
        // total = 0.005 + 0.008 + 0.03
        expect(breakdown.totalCost).toBeCloseTo(0.043, 10);
      }
    });

    it(`${modelId} applies the cached-image multiplier`, () => {
      const modelUsage: ModelUsage = {
        input: 0,
        output: 0,
        image: {
          input: 0,
          cachedInput: 1000, // cached image input tokens
        },
      };

      const breakdown = modelCostBreakdownFromRegistry({
        modelUsage,
        providerModelId: modelId,
        provider: "openai" as ModelProviderName,
      });

      expect(breakdown).not.toBeNull();
      if (breakdown) {
        // cached image: 1000 * $8/1M * 0.25 = $2/1M
        expect(breakdown.image?.cachedInputCost).toBeCloseTo(0.002, 10);
      }
    });
  }
});
