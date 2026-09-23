import { mapDalleRequest } from "../mappers/openai/dalle";
import { parseImageEditMultipartFields } from "../mappers/openai/imageEditMultipart";
import { getMapperType } from "../utils/getMapperType";

const multipart = [
  "--boundary",
  'Content-Disposition: form-data; name="model"',
  "",
  "gpt-image-1",
  "--boundary",
  'Content-Disposition: form-data; name="image[]"; filename="input.png"',
  "Content-Type: image/png",
  "",
  "\x89PNG\x00\x01binary bytes",
  "--boundary",
  'Content-Disposition: form-data; name="prompt"',
  "",
  "Change the background",
  "--boundary--",
  "",
].join("\r\n");

it("extracts text fields without retaining multipart image bytes", () => {
  const fields = parseImageEditMultipartFields(multipart);
  expect(fields).toEqual({
    model: "gpt-image-1",
    prompt: "Change the background",
  });
  expect(JSON.stringify(fields)).not.toContain("PNG");
});

it("recovers text fields from a historical parse diagnostic", () => {
  expect(
    parseImageEditMultipartFields(`Error parsing request body, ${multipart}`),
  ).toEqual({ model: "gpt-image-1", prompt: "Change the background" });
});

it("classifies model-less image edits by their endpoint", () => {
  expect(
    getMapperType({
      model: "",
      provider: "OPENAI",
      targetUrl: "https://api.openai.com/v1/images/edits",
    }),
  ).toBe("openai-image");
  expect(
    getMapperType({
      model: "",
      provider: "OPENAI",
      targetUrl: "https://api.openai.com/v1/chat/completions",
    }),
  ).toBe("openai-chat");
});

it("maps an older image edit to a prompt and generated image", () => {
  const mapped = mapDalleRequest({
    request: { error: `Error parsing request body, ${multipart}` } as any,
    response: { data: [{ b64_json: "aGVsbG8=" }] },
    statusCode: 200,
    model: "",
  });
  expect(mapped.preview.request).toBe("Change the background");
  expect(mapped.schema.request.messages?.[0]?.content).toBe(
    "Change the background",
  );
  expect(mapped.schema.response.messages?.[0]?.image_url).toBe(
    "data:image/png;base64,aGVsbG8=",
  );
});
