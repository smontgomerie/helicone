import type { ModelConfig, ModelProviderConfig } from "../../types";
import { models } from "./nemotron-3-super/models";
import { endpoints } from "./nemotron-3-super/endpoints";

export const nvidiaModels = {
  ...models,
} satisfies Record<string, ModelConfig>;

export const nvidiaEndpointConfig = {
  ...endpoints,
} satisfies Record<string, ModelProviderConfig>;
