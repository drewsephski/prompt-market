"use server";

import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface AutofillResult {
  title: string;
  description: string;
  tags: string[];
  rawPrompt: string;
}

export async function autofillPrompt(idea: string): Promise<AutofillResult> {
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL, {
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Prompt Library",
      },
    }),
    system: `You are a prompt engineering expert. Given a user's rough idea, generate a complete structured prompt following the exact format with these sections:

<Role>...</Role>
<Context>...</Context>
<Instructions>...</Instructions>
<Constraints>...</Constraints>
<Output_Format>...</Output_Format>
<User_Input>...</User_Input>

Also provide:
1. A clear, concise title (max 5 words)
2. A one-sentence description
3. 2-4 relevant tags

Return ONLY a JSON object with this exact structure:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "rawPrompt": "<Role>...</Role>\n<Context>...</Context>\n<Instructions>...</Instructions>\n<Constraints>...</Constraints>\n<Output_Format>...</Output_Format>\n<User_Input>...</User_Input>"
}`,
    prompt: idea,
  });

  try {
    const result = JSON.parse(text);
    return result;
  } catch {
    // Fallback: try to extract JSON from markdown code block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error("Failed to parse AI response");
  }
}

export async function enhancePrompt(rawPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL, {
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Prompt Library",
      },
    }),
    system: `You are a prompt engineering expert. Enhance the given prompt to make it more effective, clearer, and more comprehensive.

Improve:
- Clarity and specificity
- Structure and organization
- Context and examples
- Constraints and boundaries
- Output format specifications

Keep all 6 sections present and well-structured:
<Role>...</Role>
<Context>...</Context>
<Instructions>...</Instructions>
<Constraints>...</Constraints>
<Output_Format>...</Output_Format>
<User_Input>...</User_Input>

Return ONLY the enhanced prompt text, no extra commentary.`,
    prompt: rawPrompt,
  });

  return text.trim();
}
