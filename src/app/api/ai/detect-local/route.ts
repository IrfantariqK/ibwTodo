import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Probe Ollama local server (port 11434)
    try {
      const ollamaRes = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(2000),
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const modelsList = (data?.models || []).map((m: any) => m.name || m.model);

        if (modelsList.length > 0) {
          const rec = modelsList.find((m: string) => m.includes("llama") || m.includes("mistral") || m.includes("deepseek")) || modelsList[0];
          return NextResponse.json({
            detected: true,
            provider: "Ollama (Local Laptop AI)",
            endpoint: "http://localhost:11434/v1",
            models: modelsList,
            recommendedModel: rec,
          });
        }
      }
    } catch (e) {}

    // 2. Probe LM Studio local server (port 1234)
    try {
      const lmRes = await fetch("http://127.0.0.1:1234/v1/models", {
        signal: AbortSignal.timeout(2000),
      });

      if (lmRes.ok) {
        const data = await lmRes.json();
        const modelsList = (data?.data || []).map((m: any) => m.id);

        if (modelsList.length > 0) {
          return NextResponse.json({
            detected: true,
            provider: "LM Studio (Local Laptop AI)",
            endpoint: "http://localhost:1234/v1",
            models: modelsList,
            recommendedModel: modelsList[0],
          });
        }
      }
    } catch (e) {}

    // 3. Probe LocalAI server (port 8080)
    try {
      const localAiRes = await fetch("http://127.0.0.1:8080/v1/models", {
        signal: AbortSignal.timeout(2000),
      });

      if (localAiRes.ok) {
        const data = await localAiRes.json();
        const modelsList = (data?.data || []).map((m: any) => m.id);

        if (modelsList.length > 0) {
          return NextResponse.json({
            detected: true,
            provider: "LocalAI / vLLM (Local Laptop AI)",
            endpoint: "http://localhost:8080/v1",
            models: modelsList,
            recommendedModel: modelsList[0],
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({
      detected: false,
      message: "No active local AI servers detected on localhost ports (11434, 1234, 8080).",
      supportedEndpoints: [
        { name: "Ollama", defaultUrl: "http://localhost:11434/v1" },
        { name: "LM Studio", defaultUrl: "http://localhost:1234/v1" },
        { name: "LocalAI / vLLM", defaultUrl: "http://localhost:8080/v1" },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({
      detected: false,
      error: err?.message || "Detection failed",
    });
  }
}
