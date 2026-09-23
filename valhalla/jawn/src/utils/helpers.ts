import crypto from "crypto";
import zlib from "zlib";
import { PromiseGenericResult, err, ok } from "../packages/common/result";

/**
 * Safely parses a JSON string and returns the parsed value or null if parsing fails
 * This version is type-safe and provides detailed error information
 *
 * @param text The string to parse as JSON
 * @param errorMsg Optional context message to include in error logs
 * @returns The parsed object of type T or null if parsing failed
 */
export function safeJsonParse<T>(text: string, errorMsg?: string): T | null {
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(
      `JSON parsing error${errorMsg ? ` (${errorMsg})` : ""}: ${error}`,
      `Input excerpt: ${text.substring(0, 100)}${
        text.length > 100 ? "..." : ""
      }`
    );
    return null;
  }
}

/**
 * Bounded JSON parse-failure diagnostic: never embeds the raw input or the
 * exception message; keeps the (length-capped) context label and, for large
 * inputs, the input length.
 */
export function tryParseDiagnostic(
  text: string,
  errorMsg?: string,
): string {
  const context = (errorMsg ?? "input").slice(0, 100);
  const maxLength = 1_000;
  let detail = "";
  if (typeof text === "string" && text.length > maxLength) {
    detail = ` (input length ${text.length})`;
  }
  return `Error parsing ${context}: invalid JSON${detail}`;
}

/**
 * @deprecated Use safeJsonParse<T> instead for type safety and better error handling.
 *
 * On success the parsed value is returned unchanged. On failure a
 * `{ error: string }` object with a bounded diagnostic is returned.
 */
export function tryParse(text: string, errorMsg?: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: tryParseDiagnostic(text, errorMsg),
    };
  }
}

export function deepCompare(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a === "object" && typeof b === "object") {
    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const key in a) {
      if (!deepCompare(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

export function stringToNumberHash(str: string): number {
  const hash = crypto.createHash("sha256");
  hash.update(str);

  const hexHash = hash.digest("hex");

  const integer = parseInt(hexHash.substring(0, 16), 16);

  return integer;
}

export async function compressData(
  value: string
): PromiseGenericResult<Buffer> {
  const buffer = Buffer.from(value, "utf-8");
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, (error, result) => {
      if (error) {
        console.error(`Failed to compress value: ${error}`);
        resolve(err("Failed to compress value"));
      }
      resolve(ok(result));
    });
  });
}

export function isValidTimeZoneDifference(timeZoneDifference: number): boolean {
  const minutesInDay = 24 * 60;
  return (
    !isNaN(timeZoneDifference) &&
    timeZoneDifference >= -minutesInDay &&
    timeZoneDifference <= minutesInDay
  );
}
