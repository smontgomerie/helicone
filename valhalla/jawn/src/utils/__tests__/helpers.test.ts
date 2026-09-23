import { tryParse, tryParseDiagnostic } from "../helpers";

describe("tryParse", () => {
  it("returns the parsed value unchanged for valid primitives", () => {
    expect(tryParse("42")).toEqual(42);
    expect(tryParse('"abc"')).toEqual("abc");
    expect(tryParse("true")).toEqual(true);
    expect(tryParse("null")).toBeNull();
  });

  it("returns the parsed object unchanged for valid objects", () => {
    expect(tryParse('{"a":1,"b":[1,2]}')).toEqual({ a: 1, b: [1, 2] });
  });

  it("returns a bounded {error: string} for malformed input", () => {
    const result = tryParse("{ not json ", "request body");
    expect(result).toHaveProperty("error");
    expect(typeof result.error).toBe("string");
  });

  it("keeps the context label and input length in the diagnostic", () => {
    const result = tryParse("{bad", "request body");
    expect(result.error).toContain("request body");
    expect(result.error).toContain("invalid JSON");
  });

  it("does not embed multi-MB binary payloads (e.g. multipart PNG) in the error", () => {
    const boundary = "----formdata-undici";
    const pngBytes = "iVBORw0KGgoAAAANSU...binary-png-bytes...";
    const bigMultipart =
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n` +
      `Content-Type: image/png\r\n\r\n${pngBytes}\r\n--${boundary}--`;
    const huge = bigMultipart.repeat(50_000); // many MB

    const result = tryParse(huge, "request body");
    expect(typeof result.error).toBe("string");
    // The error must be bounded and never echo the payload bytes.
    expect(result.error).not.toContain(pngBytes);
    expect(result.error).not.toContain(boundary);
    expect(result.error.length).toBeLessThan(400);
    expect(result.error).toContain(`input length ${huge.length}`);
  });

  it("is not affected by exception message echoing input", () => {
    // Even a pathological parser error that echoes the input must not leak it.
    const big = "x".repeat(2_000_000);
    const result = tryParse(big, "request body");
    expect(result.error).not.toContain(big);
    expect(result.error.length).toBeLessThan(400);
  });
});

describe("tryParseDiagnostic", () => {
  it("is bounded and length-based for long input", () => {
    const out = tryParseDiagnostic("x".repeat(5_000_000), "request body");
    expect(out).toContain("input length 5000000");
    expect(out.length).toBeLessThan(200);
  });

  it("omits the length detail for short input", () => {
    const out = tryParseDiagnostic("{bad", "request body");
    expect(out).toEqual("Error parsing request body: invalid JSON");
  });

  it("defaults the context label when none is given", () => {
    const out = tryParseDiagnostic("nope");
    expect(out).toBe("Error parsing input: invalid JSON");
  });

  it("bounds a long context label instead of embedding it", () => {
    const out = tryParseDiagnostic("{bad", "x".repeat(500));
    expect(out).toContain("Error parsing");
    expect(out).toContain("invalid JSON");
    // context label capped at 100 chars + the surrounding message
    expect(out.length).toBeLessThan(150);
  });
});
