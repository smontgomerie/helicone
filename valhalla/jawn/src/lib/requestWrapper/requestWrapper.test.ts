import { describe, expect, test, jest } from "@jest/globals";
import { Request as ExpressRequest } from "express";
import { RequestWrapper } from "./requestWrapper";

// Heavy manager pulls clickhouse + redis clients at import; not needed for
// body-serialization behaviour under test.
jest.mock("../../managers/UsageLimitManager", () => ({
  usageLimitManager: {},
}));

// Minimal express request that satisfies the RequestWrapper constructor.
function makeRequest(body: unknown): ExpressRequest {
  return {
    protocol: "http",
    originalUrl: "/v1/gateway/oai/v1/images/edits",
    headers: {},
    get: (name: string) => (name === "host" ? "localhost:8586" : undefined),
    body,
  } as unknown as ExpressRequest;
}

// Invoke the (TS-private) constructor without auth plumbing.
function wrapperFor(body: unknown): RequestWrapper {
  return new (RequestWrapper as unknown as new (r: ExpressRequest) => RequestWrapper)(
    makeRequest(body),
  );
}

describe("RequestWrapper.getRawText binary bodies", () => {
  test("a Buffer body is NOT JSON-stringified into {type:'Buffer',data:[…]}", async () => {
    // byte values spanning the full 0–255 range, incl. bytes > 0x7f that a
    // UTF-8 decode would mangle, to prove byte-preservation end-to-end.
    const bytes = new Uint8Array(256).map((_, i) => i);
    const buf = Buffer.from(bytes);
    const rw = wrapperFor(buf);

    const text = await rw.getRawText();

    // The exact symptom from the ticket must be absent.
    expect(text).not.toContain('"type":"Buffer"');
    expect(text).not.toContain('"data":');

    // Bytes must round-trip 1:1 (latin1 char code == byte value).
    const roundTripped = Buffer.from(text, "latin1");
    expect(Buffer.compare(roundTripped, buf)).toBe(0);
  });

  test("a raw multipart-style body is preserved byte-for-byte, not mojibaked", async () => {
    // Simulate the leading bytes of a multipart/form-data image-edit body,
    // with binary image content (high bytes) embedded after the boundary.
    const boundary = "----WebKitFormBoundaryabc123";
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00, 0x9c]);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="image"; filename="x.png"\r\n'),
      Buffer.from('Content-Type: image/png\r\n\r\n'),
      binary,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const text = await wrapperFor(body).getRawText();

    expect(text).not.toContain('"type":"Buffer"');
    // Every original byte survives, including the high bytes.
    expect(Buffer.from(text, "latin1").equals(body)).toBe(true);
    // The content-type boundary is intact in the forwarded payload.
    expect(text).toContain(boundary);
  });

  test("a JSON (object) body is still stringified as before", async () => {
    const obj = { model: "gpt-image-2", n: 1, prompt: "hello" };
    const text = await wrapperFor(obj).getRawText();
    expect(text).toBe(JSON.stringify(obj));
  });
});
