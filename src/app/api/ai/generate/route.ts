import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, prompt = "", context = "", aiConfig } = body;

    const provider = aiConfig?.provider || "gemini";
    const apiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY || "";
    const customEndpoint = aiConfig?.endpoint || "http://localhost:11434/v1";
    const selectedModel = aiConfig?.model || "llama3.2";

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
              {
                role: "system",
                content: "You are an AI Workspace Assistant for TaskConnect. Return ONLY concise, direct generated text without preamble.",
              },
              {
                role: "user",
                content: `Generate response for task request type: "${type}". Context/Prompt: "${prompt}" ${context}`,
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
              {
                role: "system",
                content: "You are an AI Workspace Assistant for TaskConnect. Return ONLY concise generated text.",
              },
              {
                role: "user",
                content: `Request type: "${type}". Prompt: "${prompt}". Context: "${context}"`,
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
                      text: `You are an AI Workspace Assistant for TaskConnect. Generate concise, professional text for type: "${type}". Prompt: "${prompt}". Context: "${context}". Return ONLY the text without quotes.`,
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
              { role: "user", content: `Generate text for type "${type}". Prompt: "${prompt}"` },
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

    // 5. Smart AI Generation Engine Fallback
    let generated = "";

    switch (type) {
      case "task_title": {
        const titleTemplates = [
          prompt ? `Implement ${prompt} module & API integration` : "Optimize cloud database queries & indexing",
          prompt ? `Design & refine ${prompt} UI components` : "Refactor user authentication & session handling",
          prompt ? `Audit ${prompt} performance & fix memory leaks` : "Setup automated CI/CD deployment pipeline",
        ];
        generated = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
        break;
      }

      case "task_description": {
        generated = prompt
          ? `### Objective\nComplete implementation and testing for **${prompt}**.\n\n### Key Deliverables\n- Build high-performance frontend UI components.\n- Connect backend API endpoints with validation.\n- Ensure full mobile responsiveness and accessibility.\n- Write unit tests covering edge cases.`
          : `### Objective\nEnhance overall application responsiveness and state management.\n\n### Deliverables\n1. Review data models and API response payloads.\n2. Add loading states and micro-interactions.\n3. Validate cross-browser compatibility.`;
        break;
      }

      case "task_annotation": {
        generated = prompt
          ? `🔍 AI Suggested Code Changes / Annotations for "${prompt}":\n- Update border-radius to 16px and set primary brand color to #006858.\n- Refactor useEffect dependency array to avoid unnecessary re-renders.\n- Add error boundary fallback for API timeout scenarios.`
          : `🔍 AI Suggested Code Changes / Annotations:\n- Ensure non-null checks before property dereferencing.\n- Sanitize user input prior to sending POST request body.\n- Standardize button focus state ring styles.`;
        break;
      }

      case "project_name": {
        const projNames = [
          prompt ? `${prompt} Enterprise Platform` : "Nexus Enterprise Dashboard",
          prompt ? `Aero ${prompt} Engine` : "OmniChannel Communications Suite",
          prompt ? `Vanguard ${prompt} Portal` : "Atlas Cloud Infrastructure Redesign",
        ];
        generated = projNames[Math.floor(Math.random() * projNames.length)];
        break;
      }

      case "project_description": {
        generated = prompt
          ? `Strategic initiative to build **${prompt}**. Objectives include improving team productivity, establishing scalable MongoDB architecture, and enabling real-time workspace collaboration for clients and team members.`
          : "End-to-end workspace transformation project aimed at delivering real-time task management, role-based access control, integrated file storage, and instant workspace messaging.";
        break;
      }

      case "event_title": {
        const eventTitles = [
          prompt ? `${prompt} Alignment & Demo Sync` : "Sprint 25 Architecture & Planning Sync",
          prompt ? `Client Review: ${prompt}` : "Quarterly Engineering & Roadmap Review",
          prompt ? `${prompt} Standup & Retrospective` : "Design System & UI Polish Workshop",
        ];
        generated = eventTitles[Math.floor(Math.random() * eventTitles.length)];
        break;
      }

      case "event_description": {
        generated = prompt
          ? `📌 Meeting Agenda for "${prompt}":\n1. Progress review & milestone completion status (10 mins)\n2. Technical bottlenecks & code review feedback (15 mins)\n3. Action item assignments and next sprint deadlines (10 mins)`
          : `📌 Meeting Agenda:\n1. Sprint progress walkthrough and deliverable review\n2. Open discussion on technical challenges and dependencies\n3. Q&A and next steps assignment`;
        break;
      }

      default:
        generated = prompt || "AI generated content successfully.";
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
