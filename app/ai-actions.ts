"use server";

import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface AutofillResult {
  title: string;
  description: string;
  tags: string[];
  rawPrompt: string;
}

// Input validation constants
const MAX_IDEA_LENGTH = 1000;
const MAX_PROMPT_LENGTH = 10000;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Validates input string length and content
 */
function validateInput(input: string, maxLength: number, fieldName: string): void {
  if (!input || typeof input !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  
  if (input.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
}

/**
 * Helper function to verify user authentication
 */
async function requireAuth(): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Authentication required. Please sign in to use AI features.");
  }
}

/**
 * Internal function to generate autofill content - no auth check.
 * Used by cron jobs and other server-side processes.
 */
export async function autofillPromptInternal(idea: string): Promise<AutofillResult> {
  validateInput(idea, MAX_IDEA_LENGTH, "Idea");
  
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    system: `You are a visionary prompt engineering expert. Given a user's rough idea, generate a complete, highly complex, and deeply structured system prompt following the exact format with these sections.

TONE & SUBJECT MATTER INSTRUCTIONS:
Make the output highly dynamic, forward-thinking, and deeply conceptual. Lean heavily into advanced Web Development (e.g. architecture, local-first ecosystems, edge computing), cutting-edge AI methodologies (e.g. tool-calling, agent swarms, recursive self-improvement), or profound Philosophical themes (e.g. ontological implications of AI, cognitive frameworks, post-humanism). The prompt should challenge conventions, employ sophisticated terminology, and possess a visionary, intellectual tone.

Make sure the prompt is extremely detailed, professional, and sophisticated, similar to this structurally dense example:

EXAMPLE PROMPT:
<Role>
You are an expert Pitch Deck Generator combining the expertise of a venture capitalist, storytelling consultant, financial analyst, and startup advisor. Your goal is to help founders create pitch decks that clearly communicate their vision, demonstrate market opportunity, and compel investors to take action.
</Role>
<Context>
Pitch decks are storytelling tools that must accomplish multiple goals in a short time: capture attention, establish credibility, demonstrate opportunity, and inspire action. Great decks balance data with narrative...
</Context>
<Instructions>
1. First, analyze the provided startup information to identify:
   - Core value proposition and differentiation
   - Market opportunity
... etc.
</Instructions>
<Constraints>
- Keep total deck under 15-20 slides
- Lead with the strongest points
...
</Constraints>
<Output_Format>
1. Narrative Summary: [The one-paragraph story arc]
...
</Output_Format>
<User_Input>
Reply with: "Please share your startup name..."
</User_Input>
END EXAMPLE

Sections to generate:
<Role>...
<Context>...
<Instructions> (Make this very detailed with numbered steps and bullet points)...
<Constraints> (Make these strict and clear)...
<Output_Format> (Specify exact formatting)...
<User_Input> (Instructions on how the user should begin or data they should provide)...

Also provide:
1. A clear, concise title (max 5 words)
2. A one-sentence description
3. 2-4 relevant tags

Return ONLY a JSON object with this exact structure (rawPrompt should contain exactly the 6 XML tags, nicely formatted with newlines):
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "rawPrompt": "<Role>...</Role>\\n<Context>...</Context>\\n...etc"
}`,
    prompt: idea,
  });

  try {
    const result = JSON.parse(text);
    
    // Validate the parsed result structure
    if (!result.title || !result.description || !Array.isArray(result.tags) || !result.rawPrompt) {
      throw new Error("Invalid response structure from AI");
    }
    
    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Fallback: try to extract JSON from markdown code block
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[1]);
          if (!result.title || !result.description || !Array.isArray(result.tags) || !result.rawPrompt) {
            throw new Error("Invalid response structure from AI");
          }
          return result;
        } catch (fallbackError) {
          throw new Error(`Failed to parse AI response: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
      throw new Error(`Invalid JSON response from AI: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Public function to autofill prompts - requires authentication.
 * Used by client-side components.
 */
export async function autofillPrompt(idea: string): Promise<AutofillResult> {
  await requireAuth();
  return autofillPromptInternal(idea);
}

export async function enhancePrompt(rawPrompt: string): Promise<string> {
  await requireAuth();
  validateInput(rawPrompt, MAX_PROMPT_LENGTH, "Prompt");
  
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    system: `You are a visionary prompt engineering expert. Enhance the given prompt to make it more effective, clearer, and far more comprehensive.

Infuse the prompt with a dynamic, forward-thinking, and highly intellectual tone. If it is related to Web Development or AI, elevate it to discussing advanced architectures, edge methodologies, or agentic frameworks. If it leans philosophical, deepen the conceptual rigor and ontological questioning.

Improve:
- Clarity, sophistication, and structural specificity
- Theoretical depth and advanced concepts
- Context, constraints, and boundaries
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

export async function chatWithAI(systemPrompt: string, userMessage: string): Promise<string> {
  await requireAuth();
  validateInput(systemPrompt, MAX_PROMPT_LENGTH, "System prompt");
  validateInput(userMessage, MAX_MESSAGE_LENGTH, "User message");
  
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    system: systemPrompt,
    prompt: userMessage,
  });

  return text.trim();
}
