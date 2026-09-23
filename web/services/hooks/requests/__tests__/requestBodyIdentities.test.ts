import {
  buildBodyQueryKey,
  mergeRequestRowsWithBodies,
  REQUESTS_WITH_BODIES_QUERY_NAME,
  requestBodyIdentity,
  requestBodyIdentityKey,
  resourceIdentityKey,
  type BodyQueryResult,
  type RequestBodyIdentityRow,
} from "../requestBodyIdentities";

type TestRow = RequestBodyIdentityRow & {
  request_body?: unknown;
  response_body?: unknown;
  total_tokens?: number;
  [key: string]: unknown;
};

function makeRow(overrides: Partial<TestRow> = {}): TestRow {
  return {
    request_id: "req-1",
    signed_body_url: "https://storage.example/signed/req-1?sig=abc",
    asset_urls: { "asset-1": "https://storage.example/asset-1" },
    ...overrides,
  };
}

function makeResult(
  orgId: string,
  row: TestRow,
  body: unknown,
  responseBody: unknown = "rb",
): BodyQueryResult {
  return {
    resourceIdentity: {
      org: orgId,
      request_id: row.request_id,
      signed_body_url: row.signed_body_url ?? "",
      assets: Object.entries(row.asset_urls ?? {}).map(
        ([k, v]) => [k, v ?? ""] as [string, string],
      ),
    },
    request_id: row.request_id,
    request_body: body,
    response_body: responseBody,
  };
}

describe("requestBodyIdentity", () => {
  it("returns a structured [org, request_id, url, asset pairs] tuple", () => {
    const identity = requestBodyIdentity(makeRow(), "org-A");
    expect(identity).toEqual([
      "org-A",
      "req-1",
      "https://storage.example/signed/req-1?sig=abc",
      [["asset-1", "https://storage.example/asset-1"]],
    ]);
    // No delimiter-joined string form: it is a plain array, not a string.
    expect(Array.isArray(identity)).toBe(true);
  });

  it("is org-scoped: same row, different org -> different identity", () => {
    const row = makeRow();
    expect(requestBodyIdentity(row, "org-A")).not.toEqual(
      requestBodyIdentity(row, "org-B"),
    );
  });

  it("is unchanged by metadata-only changes to the row", () => {
    const before = makeRow();
    const after = {
      ...before,
      // metadata that should not affect body identity:
      total_tokens: 123,
      cost: 0.5,
      model: "gpt-4",
    };
    expect(requestBodyIdentity(before, "org-A")).toEqual(
      requestBodyIdentity(after, "org-A"),
    );
  });

  it("invalidates when the signed URL refreshes", () => {
    const base = makeRow();
    const refreshed: any = {
      ...base,
      signed_body_url: "https://storage.example/signed/req-1?sig=refreshed",
    };
    expect(requestBodyIdentity(base, "org-A")).not.toEqual(
      requestBodyIdentity(refreshed, "org-A"),
    );
  });

  it("invalidates when asset URLs change", () => {
    const base = makeRow();
    const withAssets: any = {
      ...base,
      asset_urls: { "asset-1": "https://storage.example/asset-1-v2" },
    };
    expect(requestBodyIdentity(base, "org-A")).not.toEqual(
      requestBodyIdentity(withAssets, "org-A"),
    );
  });

  it("treats null/absent signed_body_url and asset_urls as a stable identity", () => {
    const a = makeRow({ signed_body_url: null, asset_urls: null });
    const b = makeRow();
    delete (b as any).signed_body_url;
    delete (b as any).asset_urls;
    expect(requestBodyIdentity(a, "org-A")).toEqual(
      requestBodyIdentity(b, "org-A"),
    );
    expect(requestBodyIdentity(a, "org-A")[2]).toEqual("");
    expect(requestBodyIdentity(a, "org-A")[3]).toEqual([]);
  });

  it("does not depend on asset_urls key order", () => {
    const a = makeRow({
      asset_urls: { b: "2", a: "1" },
    });
    const b = makeRow({
      asset_urls: { a: "1", b: "2" },
    });
    expect(requestBodyIdentity(a, "org-A")).toEqual(
      requestBodyIdentity(b, "org-A"),
    );
    // asset pairs are sorted by key
    expect(requestBodyIdentity(a, "org-A")[3]).toEqual([
      ["a", "1"],
      ["b", "2"],
    ]);
  });

  it("normalizes a null asset value to an empty string", () => {
    const identity = requestBodyIdentity(
      { request_id: "req-1", asset_urls: { a: null as any } },
      "org-A",
    );
    expect(identity[3]).toEqual([["a", ""]]);
  });
});

describe("identity key helpers", () => {
  it("row tuple and matching resource identity serialize to the same key", () => {
    const row = makeRow();
    const identity = requestBodyIdentity(row, "org-A");
    expect(requestBodyIdentityKey(identity)).toBe(
      resourceIdentityKey({
        org: "org-A",
        request_id: "req-1",
        signed_body_url: "https://storage.example/signed/req-1?sig=abc",
        assets: [["asset-1", "https://storage.example/asset-1"]],
      }),
    );
  });

  it("resourceIdentityKey does not depend on asset pair order", () => {
    const base: BodyQueryResult["resourceIdentity"] = {
      org: "org-A",
      request_id: "req-1",
      signed_body_url: "https://x",
      assets: [["b", "2"], ["a", "1"]],
    };
    const reversed: BodyQueryResult["resourceIdentity"] = {
      ...base,
      assets: [["a", "1"], ["b", "2"]],
    };
    expect(resourceIdentityKey(base)).toBe(resourceIdentityKey(reversed));
  });

  it("keys differ when any resource field differs", () => {
    const a = requestBodyIdentity(makeRow(), "org-A");
    const b = requestBodyIdentity(
      makeRow({ signed_body_url: "https://x?sig=other" }),
      "org-A",
    );
    const c = requestBodyIdentity(makeRow(), "org-B");
    const d = requestBodyIdentity(
      makeRow({ asset_urls: { "asset-1": "https://storage.example/other" } }),
      "org-A",
    );
    expect(requestBodyIdentityKey(a)).not.toBe(requestBodyIdentityKey(b));
    expect(requestBodyIdentityKey(a)).not.toBe(requestBodyIdentityKey(c));
    expect(requestBodyIdentityKey(a)).not.toBe(requestBodyIdentityKey(d));
  });
});

describe("buildBodyQueryKey", () => {
  it("serialized key size is O(identities), not O(payload)", () => {
    const bigBody = "x".repeat(3 * 1024 * 1024); // 3 MB fake body
    const smallRows: TestRow[] = [makeRow()];
    const bigRows: TestRow[] = [
      { ...makeRow(), request_body: bigBody, response_body: bigBody },
    ];

    const smallKey = JSON.stringify(buildBodyQueryKey(smallRows, "org-A"));
    const bigKey = JSON.stringify(buildBodyQueryKey(bigRows, "org-A"));

    // The key must be short (a few hundred bytes) even with 3 MB bodies,
    // and identical because bodies are excluded from the identity.
    expect(bigKey).toEqual(smallKey);
    expect(bigKey.length).toBeLessThan(1024);
  });

  it("key structure: [name, org, ...per-row identity tuples]", () => {
    const key = buildBodyQueryKey([makeRow()], "org-A");
    expect(key[0]).toEqual(REQUESTS_WITH_BODIES_QUERY_NAME);
    expect(key[1]).toEqual("org-A");
    expect(key.length).toEqual(3);
    // key[2] is the row's structured identity tuple, not a payload
    expect(key[2]).toEqual(
      requestBodyIdentity(makeRow(), "org-A"),
    );
  });

  it("returns a stable key for empty/absent rows", () => {
    expect(buildBodyQueryKey([], "org-A")).toEqual([
      REQUESTS_WITH_BODIES_QUERY_NAME,
      "org-A",
    ]);
    expect(buildBodyQueryKey(undefined, "org-A")).toEqual([
      REQUESTS_WITH_BODIES_QUERY_NAME,
      "org-A",
    ]);
  });
});

describe("mergeRequestRowsWithBodies", () => {
  it("preserves raw row order and metadata even when body order differs", () => {
    const rawRows: TestRow[] = [
      makeRow({ request_id: "req-2" }),
      makeRow({ request_id: "req-1" }),
    ];
    const results: (BodyQueryResult | null)[] = [
      makeResult("org-A", makeRow({ request_id: "req-1" }), "b1", "rb1"),
      makeResult("org-A", makeRow({ request_id: "req-2" }), "b2", "rb2"),
    ];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    expect(merged.map((r) => r.request_id)).toEqual(["req-2", "req-1"]);
    expect(merged[0].request_body).toEqual("b2");
    expect(merged[0].response_body).toEqual("rb2");
    expect(merged[1].request_body).toEqual("b1");
    expect(merged[1].response_body).toEqual("rb1");
  });

  it("fresh raw metadata wins while the result's body fields are applied", () => {
    const staleRow = makeRow();
    const rawRows: TestRow[] = [
      { ...staleRow, total_tokens: 999, model: "gpt-5" },
    ];
    const results = [makeResult("org-A", staleRow, "cached-body", "rb")];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    // latest raw metadata is preserved, not the stale row's
    expect(merged[0].total_tokens).toEqual(999);
    expect(merged[0].model).toEqual("gpt-5");
    // body fields come from the successful result
    expect(merged[0].request_body).toEqual("cached-body");
    // it is a new object, not the raw row
    expect(merged[0]).not.toBe(rawRows[0]);
  });

  it("falls back to the latest raw row by reference when a body result is missing", () => {
    const rawRows: TestRow[] = [
      makeRow({ request_id: "req-1" }),
      makeRow({ request_id: "req-2" }),
    ];
    const results = [
      makeResult("org-A", makeRow({ request_id: "req-1" }), "ok"),
      // req-2 failed the fetch: null result
      null,
    ];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    expect(merged[0].request_body).toEqual("ok");
    expect(merged[1]).toBe(rawRows[1]); // untouched raw row, by reference
  });

  it("a null result for a row that already has a raw body keeps it by reference", () => {
    const rawRows: TestRow[] = [
      makeRow({ request_id: "req-1", request_body: "stored-body" }),
    ];
    const merged = mergeRequestRowsWithBodies(rawRows, [null], "org-A");
    expect(merged[0]).toBe(rawRows[0]);
    expect(merged[0].request_body).toBe("stored-body");
  });

  it("a result for a stale identity is ignored; the raw row is kept by reference", () => {
    const currentRow = makeRow({
      signed_body_url: "https://storage.example/signed/req-1?sig=refreshed",
    });
    const rawRows: TestRow[] = [currentRow];
    // result fetched before the URL refresh: resourceIdentity carries the old URL
    const staleRow = makeRow(); // sig=abc
    const results = [makeResult("org-A", staleRow, "old-body")];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    expect(merged[0]).toBe(rawRows[0]);
    expect(merged[0].request_body).toBeUndefined();
  });

  it("a result from a different org is ignored for this org's rows", () => {
    const rawRows: TestRow[] = [makeRow()];
    const results = [makeResult("org-B", makeRow(), "foreign-body")];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    expect(merged[0]).toBe(rawRows[0]);
    expect(merged[0].request_body).toBeUndefined();
  });

  it("results are filtered to the current org before matching", () => {
    const rawRows: TestRow[] = [makeRow({ request_id: "req-1" })];
    const results = [
      makeResult("org-B", makeRow({ request_id: "req-1" }), "foreign"),
      makeResult("org-A", makeRow({ request_id: "req-1" }), "own"),
    ];
    const merged = mergeRequestRowsWithBodies(rawRows, results, "org-A");
    expect(merged[0].request_body).toEqual("own");
  });

  it("returns rows untouched for null/undefined results", () => {
    const rawRows: TestRow[] = [makeRow()];
    expect(mergeRequestRowsWithBodies(rawRows, undefined, "org-A")).toEqual(
      rawRows,
    );
    expect(
      mergeRequestRowsWithBodies(rawRows, undefined, "org-A")[0],
    ).toBe(rawRows[0]);
    expect(mergeRequestRowsWithBodies(rawRows, null, "org-A")[0]).toBe(
      rawRows[0],
    );
    expect(mergeRequestRowsWithBodies([], null, "org-A")).toEqual([]);
  });
});
