"use server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function extractTextFromPdf(
  formData: FormData
): Promise<{ text: string; error?: string }> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return { text: "", error: "No file provided." };
  }

  if (file.type !== "application/pdf") {
    return { text: "", error: "Only PDF files are supported." };
  }

  if (file.size > MAX_SIZE) {
    return { text: "", error: "File is too large. Maximum size is 5MB." };
  }

  try {
    const { PDFParse } = await import("pdf-parse");
    const data = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data });
    const result = await parser.getText();

    const text = result.pages.map((p: { text: string }) => p.text).join("\n").trim();
    if (!text) {
      return {
        text: "",
        error: "Could not extract text from this PDF. It may contain only images.",
      };
    }

    return { text };
  } catch {
    return { text: "", error: "Failed to parse PDF. The file may be corrupted." };
  }
}
