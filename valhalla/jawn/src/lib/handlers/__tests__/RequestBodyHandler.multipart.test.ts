import { RequestBodyHandler } from "../RequestBodyHandler";

it("stores image-edit form fields instead of a multipart parse error", () => {
  const rawBody = [
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
  const context = {
    rawLog: { rawRequestBody: rawBody },
    message: {
      log: {
        request: {
          path: "/v1/images/edits",
          targetUrl: "https://api.openai.com/v1/images/edits",
        },
      },
      heliconeMeta: { omitRequestLog: false },
    },
  } as any;

  const result = new RequestBodyHandler().processRequestBody(context);
  expect(result).toEqual({
    body: { model: "gpt-image-1", prompt: "Change the background" },
    model: "gpt-image-1",
  });
  expect(JSON.stringify(result.body)).not.toContain("PNG");
});
