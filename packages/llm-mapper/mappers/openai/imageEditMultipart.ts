/** Text fields from an OpenAI image-edit multipart request. */
export interface ImageEditMultipartFields {
  model?: string;
  prompt?: string;
  size?: string;
  quality?: string;
  background?: string;
  output_format?: string;
}

const TEXT_FIELDS = [
  "model",
  "prompt",
  "size",
  "quality",
  "background",
  "output_format",
] as const;
const MAX_TEXT_FIELD_LENGTH = 16_384;

/**
 * Read only small form fields. The input may be the original latin1 multipart
 * body or an older parse diagnostic containing that body. File bytes are never
 * copied into the returned object.
 */
export function parseImageEditMultipartFields(
  body: string,
): ImageEditMultipartFields | null {
  if (!body.includes("Content-Disposition: form-data;")) return null;

  const fields: ImageEditMultipartFields = {};
  for (const name of TEXT_FIELDS) {
    const header = `Content-Disposition: form-data; name="${name}"`;
    const headerStart = body.indexOf(header);
    if (headerStart < 0) continue;

    const separator = body.indexOf("\r\n\r\n", headerStart + header.length);
    if (separator < 0 || separator - headerStart > 1024) continue;

    const valueStart = separator + 4;
    const valueEnd = body.indexOf("\r\n--", valueStart);
    if (valueEnd < 0 || valueEnd - valueStart > MAX_TEXT_FIELD_LENGTH) {
      continue;
    }

    fields[name] = body.slice(valueStart, valueEnd);
  }

  return Object.keys(fields).length > 0 ? fields : null;
}
