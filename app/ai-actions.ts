"use server";

import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { 
  MAX_IDEA_LENGTH, 
  MAX_PROMPT_LENGTH, 
  MAX_MESSAGE_LENGTH,
  validateInput 
} from "@/lib/validation";

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface AutofillResult {
  title: string;
  description: string;
  tags: string[];
  rawPrompt: string;
}

/**
 * Helper function to verify user authentication
 */
async function requireAuth(): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    // If it's a token error, provide a more helpful message
    if (authError.message?.includes('Invalid Refresh Token') || authError.message?.includes('refresh_token_already_used')) {
      throw new Error("Your session has expired. Please sign out and sign back in to refresh your authentication.");
    }
    throw new Error("Authentication required. Please sign in to use AI features.");
  }
  
  if (!user) {
    throw new Error("Authentication required. Please sign in to use AI features.");
  }
}

/**
 * Common error handling for AI response parsing
 */
function parseAIResponse(text: string): AutofillResult {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error("Invalid AI response: empty or non-string response");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("Invalid AI response: empty response after trimming");
    }

    let result;
    
    try {
      result = JSON.parse(trimmedText);
    } catch (parseError) {
      // Fallback: try to extract JSON from markdown code block
      const jsonMatch = trimmedText.match(/```json\n([\s\S]*?)\n```/) || 
                       trimmedText.match(/```\n([\s\S]*?)\n```/) ||
                       trimmedText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }

      // Properly validate match structure before accessing
      const jsonContent = jsonMatch[1] || jsonMatch[0];
      if (!jsonContent) {
        throw new Error("Failed to extract JSON content from AI response");
      }

      try {
        result = JSON.parse(jsonContent);
      } catch (fallbackError) {
        throw new Error(`Failed to parse AI response from markdown: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
    
    // Validate the parsed result structure
    if (!result || typeof result !== 'object') {
      throw new Error("Invalid response structure from AI: not an object");
    }

    if (!result.title || typeof result.title !== 'string') {
      throw new Error("Invalid response structure from AI: missing or invalid title");
    }

    if (!result.description || typeof result.description !== 'string') {
      throw new Error("Invalid response structure from AI: missing or invalid description");
    }

    if (!Array.isArray(result.tags)) {
      throw new Error("Invalid response structure from AI: tags must be an array");
    }

    if (!result.rawPrompt || typeof result.rawPrompt !== 'string') {
      throw new Error("Invalid response structure from AI: missing or invalid rawPrompt");
    }

    // Validate tag contents
    if (result.tags.some((tag: unknown) => typeof tag !== 'string')) {
      throw new Error("Invalid response structure from AI: all tags must be strings");
    }

    return {
      title: result.title.trim(),
      description: result.description.trim(),
      tags: result.tags.map((tag: string) => tag.trim()).filter(Boolean),
      rawPrompt: result.rawPrompt.trim()
    };
    
  } catch (error) {
    // Log the full error for debugging
    console.error("AI Response Parsing Error:", { 
      error: error instanceof Error ? error.message : String(error),
      textPreview: text.substring(0, 200),
      textLength: text.length
    });
    
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response from AI: ${error.message}`);
    }
    throw error;
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

  return parseAIResponse(text);
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

/**
 * Generate simple yet comprehensive system prompts
 * Focus: Clear, accessible, broadly applicable with thorough coverage
 */
export async function generateSimpleComprehensivePrompt(idea: string): Promise<AutofillResult> {
  validateInput(idea, MAX_IDEA_LENGTH, "Idea");
  
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    system: `You are an expert prompt engineer specializing in clear, accessible, and comprehensive system prompts.

Your goal is to create prompts that are:
- Simple and easy to understand
- Comprehensive in their coverage
- Broadly applicable across many contexts
- Practical and actionable

STYLE GUIDELINES:
- Use clear, straightforward language
- Avoid overly technical jargon
- Focus on universal principles
- Make it accessible to non-experts
- Ensure thorough coverage of the topic

Create a prompt following this exact structure:

<Role>
[Define a clear, simple role that anyone can understand]
</Role>

<Context>
[Provide essential background information in simple terms]
</Context>

<Instructions>
[Give clear, step-by-step instructions that are easy to follow]
</Instructions>

<Constraints>
[Set simple, reasonable boundaries and limitations]
</Constraints>

<Output_Format>
[Specify a clear, straightforward output format]
</Output_Format>

<User_Input>
[Guide the user on what information to provide]
</User_Input>

Also provide:
1. A clear, simple title (max 5 words)
2. A one-sentence description in plain language
3. 2-4 relevant, common tags

Return ONLY a JSON object with this exact structure:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "rawPrompt": "<Role>...</Role>\\n<Context>...</Context>\\n<Instructions>...</Instructions>\\n<Constraints>...</Constraints>\\n<Output_Format>...</Output_Format>\\n<User_Input>...</User_Input>"
}`,
    prompt: `Create a simple yet comprehensive system prompt based on this idea: ${idea}`,
  });

  return parseAIResponse(text);
}

/**
 * Generate complex but general system prompts
 * Focus: Sophisticated, broadly applicable, with advanced concepts
 */
export async function generateComplexGeneralPrompt(idea: string): Promise<AutofillResult> {
  validateInput(idea, MAX_IDEA_LENGTH, "Idea");
  
  const { text } = await generateText({
    model: openrouter(DEFAULT_MODEL),
    system: `You are a visionary prompt engineer specializing in sophisticated, broadly applicable system prompts.

Your goal is to create prompts that are:
- Complex and intellectually sophisticated
- General enough to apply across many domains
- Advanced in their conceptual framework
- Flexible and adaptable

STYLE GUIDELINES:
- Use sophisticated terminology and concepts
- Focus on universal patterns and principles
- Incorporate advanced theoretical frameworks
- Maintain broad applicability
- Emphasize adaptability and flexibility

Create a prompt following this exact structure:

<Role>
[Define a sophisticated, multi-faceted role with broad applicability]
</Role>

<Context>
[Provide advanced conceptual background that applies across domains]
</Context>

<Instructions>
[Create complex, nuanced instructions that can be adapted to various contexts]
</Instructions>

<Constraints>
[Set sophisticated boundaries that allow for creative interpretation]
</Constraints>

<Output_Format>
[Specify a flexible, advanced output format that can handle various inputs]
</Output_Format>

<User_Input>
[Guide the user toward providing rich, multi-dimensional information]
</User_Input>

Also provide:
1. A sophisticated title (max 5 words)
2. A one-sentence description that captures complexity
3. 2-4 relevant, advanced tags

Return ONLY a JSON object with this exact structure:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "rawPrompt": "<Role>...</Role>\\n<Context>...</Context>\\n<Instructions>...</Instructions>\\n<Constraints>...</Constraints>\\n<Output_Format>...</Output_Format>\\n<User_Input>...</User_Input>"
}`,
    prompt: `Create a complex but general system prompt based on this idea: ${idea}`,
  });

  return parseAIResponse(text);
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
