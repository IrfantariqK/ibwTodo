import { NextResponse } from "next/server";

// Helper function to auto-correct common spelling mistakes and clean up text
function autoCorrectSpelling(text: string): string {
  if (!text) return "";

  const spellingCorrections: Record<string, string> = {
    implet: "implement",
    implemt: "implement",
    implment: "implement",
    auth: "authentication",
    authen: "authentication",
    mongdb: "MongoDB",
    mongodb: "MongoDB",
    desgn: "design",
    dsgn: "design",
    fixx: "fix",
    fx: "fix",
    servr: "server",
    srver: "server",
    feautre: "feature",
    fature: "feature",
    datbas: "database",
    databse: "database",
    reqst: "request",
    bugg: "bug",
    creat: "create",
    usrs: "users-[#006858]",
    prjct: "project",
    projt: "project",
    calndr: "calendar",
    meting: "meeting",
    meetng: "meeting",
    tassk: "task",
    tsks: "tasks",
    schedul: "schedule",
    optimz: "optimize",
    refactr: "refactor",
    integrat: "integrate",
  };

  let words = text.split(/\s+/);
  words = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, "");
    if (spellingCorrections[cleanWord]) {
      return spellingCorrections[cleanWord];
    }
    return w;
  });

  return words.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, prompt = "", context = "", aiConfig } = body;

    const provider = aiConfig?.provider || "gemini";
    const apiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY || "";
    const customEndpoint = aiConfig?.endpoint || "http://localhost:11434/v1";
    const selectedModel = aiConfig?.model || "llama3.2";

    const correctedInput = autoCorrectSpelling(prompt);

    const systemInstructions = `You are an expert AI Workspace Assistant for TaskConnect.
Your core tasks:
1. Detect and correct any spelling mistakes in the user's input.
2. Infer the intended meaning even if the input is short, informal, or misspelled.
3. Form complete, grammatically correct, professional, and clear sentences suitable for task titles, task descriptions, code annotations, project scopes, or meeting agendas.
4. Return ONLY the final corrected and expanded result without meta-talk or quotes.`;

    // 1. Localhost / Local Laptop AI (Ollama, LM Studio, LocalAI)
    if (provider === "local" || provider === "ollama" || provider === "lmstudio") {
      try {
        const url = `${customEndpoint.replace(/\/+$/, "")}/chat/completions`;
        const localRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemInstructions },
              {
                role: "user",
                content: `Request type: "${type}". User Typed Input: "${prompt}". Corrected Context: "${correctedInput}". Format into complete, grammatically correct, professional output.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (localRes.ok) {
          const data = await localRes.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            return NextResponse.json({ result: text, source: "Local Laptop AI" });
          }
        }
      } catch (localErr) {
        console.warn("Local AI endpoint call failed, attempting fallback:", localErr);
      }
    }

    // 2. OpenAI API
    if (provider === "openai" && apiKey) {
      try {
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: selectedModel || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstructions },
              {
                role: "user",
                content: `Request type: "${type}". User Input: "${prompt}". Please fix spelling mistakes, infer intended meaning, and write a complete, grammatically correct sentence.`,
              },
            ],
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            return NextResponse.json({ result: text, source: "OpenAI Cloud" });
          }
        }
      } catch (openAiErr) {
        console.warn("OpenAI API call failed:", openAiErr);
      }
    }

    // 3. Gemini API (Google)
    if ((provider === "gemini" || !provider) && apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemInstructions}\n\nTask Type: "${type}". User Input: "${prompt}". Detect/correct spelling, understand intended meaning, and write a complete, grammatically correct, professional sentence.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return NextResponse.json({ result: text, source: "Google Gemini Cloud" });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API call error:", geminiErr);
      }
    }

    // 4. Custom API Endpoint
    if (provider === "custom" && customEndpoint) {
      try {
        const url = `${customEndpoint.replace(/\/+$/, "")}/chat/completions`;
        const headers: any = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

        const customRes = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: selectedModel || "custom-model",
            messages: [
              { role: "system", content: systemInstructions },
              { role: "user", content: `Generate text for "${type}". Prompt: "${prompt}"` },
            ],
          }),
        });

        if (customRes.ok) {
          const data = await customRes.json();
          const text = data?.choices?.[0]?.message?.content?.trim() || data?.result;
          if (text) {
            return NextResponse.json({ result: text, source: "Custom AI API" });
          }
        }
      } catch (customErr) {
        console.warn("Custom API call error:", customErr);
      }
    }

    // 5. Smart AI Generation Engine Fallback (with Auto-Correction)
    let generated = "";
    const cleanPrompt = correctedInput || prompt;
    const capitalized = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);

    switch (type) {
      case "task_title": {
        generated = prompt
          ? `Implement ${capitalized} module with full backend integration`
          : "Optimize cloud database queries & indexing";
        break;
      }

      case "task_description": {
        generated = prompt
          ? `### Objective\nDevelop and integrate **${capitalized}** with complete end-to-end functionality.\n\n### Key Deliverables\n- Build responsive, accessible UI components.\n- Connect secure backend API endpoints with validation.\n- Verify cross-browser compatibility and execute unit tests.`
          : `### Objective\nEnhance overall application responsiveness and state management.\n\n### Deliverables\n1. Review data models and API response payloads.\n2. Add loading states and micro-interactions.\n3. Validate cross-browser compatibility.`;
        break;
      }

      case "task_annotation": {
        generated = prompt
          ? `🔍 AI Code Review & Annotation for "${capitalized}":\n- Correct spelling and syntax in configuration file.\n- Ensure non-null state checks before dereferencing properties.\n- Standardize button focus state ring styles.`
          : `🔍 AI Suggested Code Changes & Annotations:\n- Ensure non-null checks before property dereferencing.\n- Sanitize user input prior to sending POST request body.\n- Standardize button focus state ring styles.`;
        break;
      }

      case "project_name": {
        generated = prompt
          ? `${capitalized} Enterprise Platform`
          : "Nexus Enterprise Dashboard";
        break;
      }

      case "project_description": {
        generated = prompt
          ? `Strategic initiative to design, build, and deploy **${capitalized}**. Objectives include boosting team productivity, establishing scalable MongoDB architecture, and enabling real-time workspace collaboration for clients and team members.`
          : "End-to-end workspace transformation project aimed at delivering real-time task management, role-based access control, integrated file storage, and instant workspace messaging.";
        break;
      }

      case "event_title": {
        generated = prompt
          ? `${capitalized} Architecture & Planning Sync`
          : "Sprint 25 Architecture & Planning Sync";
        break;
      }

      case "event_description": {
        generated = prompt
          ? `📌 Meeting Agenda for "${capitalized}":\n1. Review progress and current milestone deliverables (10 mins)\n2. Address technical bottlenecks and code review feedback (15 mins)\n3. Assign action items and establish next sprint deadlines (10 mins)`
          : `📌 Meeting Agenda:\n1. Sprint progress walkthrough and deliverable review\n2. Open discussion on technical challenges and dependencies\n3. Q&A and next steps assignment`;
        break;
      }

      default:
        generated = capitalized || "AI generated content successfully.";
    }

    return NextResponse.json({ result: generated, source: "Built-in Workspace AI Engine" });
  } catch (error: any) {
    console.error("AI generator route error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
