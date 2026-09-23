import { RequestManager } from "../RequestManager";
import { S3Client } from "../../../lib/shared/db/s3Client";
import { getRequestAsset } from "../../../lib/stores/request/request";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

jest.mock("../../../lib/cache/kvCache", () => ({ KVCache: class {} }), { virtual: true });
jest.mock("../../../lib/shared/db/dbExecute", () => ({}), { virtual: true });
jest.mock("../../../lib/stores/request/VersionedRequestStore", () => ({
  VersionedRequestStore: class {},
}), { virtual: true });
jest.mock("../../../lib/stores/request/request", () => ({
  getRequestAsset: jest.fn(),
}), { virtual: true });
jest.mock("@helicone-package/cost", () => ({}), { virtual: true });
jest.mock("@helicone-package/filters/filters", () => ({}), { virtual: true });
jest.mock("@helicone-package/llm-mapper/types", () => ({
  DEFAULT_UUID: "00000000-0000-0000-0000-000000000000",
}), { virtual: true });
jest.mock("../../../utils/cacheResult", () => ({}), { virtual: true });
jest.mock("../../score/ScoreManager", () => ({}), { virtual: true });
jest.mock("../../BaseManager", () => ({
  BaseManager: class {
    constructor(public authParams: unknown) {}
  },
}), { virtual: true });
jest.mock("../../../lib/shared/db/s3Client", () => ({
  S3Client: jest.fn().mockImplementation((_key, _secret, endpoint) => ({
    getRequestResponseBodySignedUrl: jest.fn(async (org, id) => ({
      data: `${endpoint}/body/${org}/${id}`, error: null,
    })),
    getRequestResponseImageSignedUrl: jest.fn(async (org, id, asset) => ({
      data: `${endpoint}/image/${org}/${id}/${asset}`, error: null,
    })),
  })),
}), { virtual: true });

const originalEnv = { ...process.env };
const originalFetch = global.fetch;
const row = () => ({
  request_id: "request-1",
  request_created_at: "2026-09-22T00:00:00Z",
  cache_reference_id: DEFAULT_UUID,
  asset_ids: ["image-1"],
  request_body: { helicone_message: "stored in S3" },
  signed_body_url: "http://browser.example:9000/old",
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.S3_ENABLED = "true";
  process.env.S3_ENDPOINT = "http://minio:9000";
  process.env.S3_ENDPOINT_PUBLIC = "http://browser.example:9000";
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: async () =>
      JSON.stringify({ request: { model: "test" }, response: { ok: true } }),
  });
});
afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

const manager = () => new RequestManager({ organizationId: "org-1" } as any);

test("browser body and asset URLs use the public endpoint", async () => {
  const result = await (manager() as any).refreshS3Urls(row());
  expect(result.signed_body_url).toBe("http://browser.example:9000/body/org-1/request-1");
  expect(result.asset_urls["image-1"]).toBe("http://browser.example:9000/image/org-1/request-1/image-1");
});

test("dedicated asset endpoint uses the public signer", async () => {
  (getRequestAsset as jest.Mock).mockResolvedValue({ data: { id: "image-1" }, error: null });
  const result = await manager().getRequestAssetById("request-1", "image-1");
  expect(result.data?.assetUrl).toBe("http://browser.example:9000/image/org-1/request-1/image-1");
});

test.each([undefined, ""])("public endpoint falls back when %p", async (endpoint) => {
  if (endpoint === undefined) delete process.env.S3_ENDPOINT_PUBLIC;
  else process.env.S3_ENDPOINT_PUBLIC = endpoint;
  const result = await (manager() as any).refreshS3Urls(row());
  expect(result.signed_body_url).toBe("http://minio:9000/body/org-1/request-1");
});

test.each([DEFAULT_UUID, null, "cached-request"])("internal fetch uses internal endpoint and cache reference %p", async (reference) => {
  const instance = manager();
  jest.spyOn(instance, "getRequestById").mockResolvedValue({ data: { ...row(), cache_reference_id: reference } as any, error: null });
  const result = await instance.uncachedGetRequestByIdWithBody("request-1");
  const id = reference && reference !== DEFAULT_UUID ? reference : "request-1";
  expect(global.fetch).toHaveBeenCalledWith(`http://minio:9000/body/org-1/${id}`);
  expect(result.data?.request_body).toEqual({ model: "test" });
});

test("internal signing failure does not fetch the public URL", async () => {
  const instance = manager();
  jest.spyOn(instance, "getRequestById").mockResolvedValue({ data: row() as any, error: null });
  const internal = (S3Client as jest.Mock).mock.results[0].value;
  internal.getRequestResponseBodySignedUrl.mockResolvedValue({ data: null, error: "signing failed" });
  expect((await instance.uncachedGetRequestByIdWithBody("request-1")).error).toBe("signing failed");
  expect(global.fetch).not.toHaveBeenCalled();
});
