import http from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const mockQuestions = JSON.parse(
  readFileSync(join(__dirname, "fixtures/mock-questions.json"), "utf-8")
);
const mockFeedback = JSON.parse(
  readFileSync(join(__dirname, "fixtures/mock-feedback.json"), "utf-8")
);

function buildResponse(content) {
  return JSON.stringify({
    id: "chatcmpl-mock",
    object: "chat.completion",
    created: Date.now(),
    model: "gpt-4o-mini",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: JSON.stringify(content) },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.includes("/chat/completions")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const lowerBody = body.toLowerCase();

    let responseContent;

    if (
      lowerBody.includes("follow-up") ||
      lowerBody.includes("follow up") ||
      lowerBody.includes("후속")
    ) {
      responseContent = {
        followUpQuestion:
          "Can you walk me through a specific example where you applied this concept in a real project?",
      };
    } else if (
      lowerBody.includes("suggestions") ||
      lowerBody.includes("questions only") ||
      lowerBody.includes("no answers")
    ) {
      responseContent = mockQuestions.map((q) => q.question);
    } else if (
      lowerBody.includes("evaluate") ||
      lowerBody.includes("scoring rules") ||
      lowerBody.includes("채점 기준")
    ) {
      responseContent = mockFeedback;
    } else if (
      lowerBody.includes("interview questions") ||
      lowerBody.includes("면접 질문")
    ) {
      responseContent = mockQuestions;
    } else {
      responseContent = mockQuestions;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(buildResponse(responseContent));
  });
});

const PORT = 3100;
server.listen(PORT, () => {
  console.log(`Mock OpenAI server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
