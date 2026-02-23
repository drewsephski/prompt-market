import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { autofillPromptInternal, generateSimpleComprehensivePrompt, generateComplexGeneralPrompt } from "@/app/ai-actions";
import { createClient } from "@supabase/supabase-js";
import { parsePrompt } from "@/lib/parser";
import { generateUniqueSlug, logError } from "@/lib/utils";
import { categorizePrompt } from "@/lib/categorization";

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// We use the service role key to bypass RLS for background cron jobs
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    // Optional: Add authorization check here if invoked manually
    // But for Vercel Cron, typically CRON_SECRET is checked.

    try {
        console.log("Generating new prompt idea...");

        // 1. Generate a random, unique idea
        const { text: idea } = await generateText({
            model: openrouter("google/gemini-3-flash-preview"),
            system: `You are a visionary prompt engineer. Suggest a single, highly specific and deeply unique idea for a system prompt (1-2 sentences). 
The idea MUST relate to at least one of these themes: Advanced Web Development, Cutting-edge Artificial Intelligence, or Deep Philosophy.

Examples:
- "A persona of a strict, futuristic code reviewer that exclusively evaluates React architectures for edge rendering performance and WebAssembly integration."
- "An AI agent that acts as a Socratic philosopher, probing the ontological implications of recursive self-improvement algorithms and conscious machine states."
- "A master system architect that specializes in designing local-first, decentralized P2P applications using modern web paradigms and CRDTs."

Return ONLY the idea. Do not include extra text. Use plain text (not markdown), with only dashes and numbers. Make it profound, creative, and professional.

Return ONLY the idea. Do not include extra text. Make it creative and professional.`,
            prompt: "Generate a new system prompt idea.",
        });

        console.log("Idea generated:", idea);

        // 2. Randomly choose generation style for variety
        const generationStyles = ['visionary', 'simple', 'complex'];
        const randomStyle = generationStyles[Math.floor(Math.random() * generationStyles.length)];
        
        let result;
        switch (randomStyle) {
            case 'simple':
                console.log("Using simple yet comprehensive generation style");
                result = await generateSimpleComprehensivePrompt(idea);
                break;
            case 'complex':
                console.log("Using complex but general generation style");
                result = await generateComplexGeneralPrompt(idea);
                break;
            case 'visionary':
            default:
                console.log("Using visionary generation style (original)");
                result = await autofillPromptInternal(idea);
                break;
        }
        
        console.log("Generated prompt structure with title:", result.title);
        
        // Enhanced categorization using the new utility
        const category = categorizePrompt(result.tags, result.title, result.description);
        console.log(`Categorized generated prompt as: ${category}`);
        
        // Add category as a tag if not already present
        if (!result.tags.includes(category)) {
            result.tags.push(category);
        }

        // 3. Parse into sections
        let sections;
        try {
            sections = parsePrompt(result.rawPrompt);
        } catch (err) {
            logError("cron - parsePrompt", err, { idea, title: result.title });
            throw err;
        }

        // 4. Generate slug and handle collisions with retry logic
        let slug;
        try {
            slug = await generateUniqueSlug(result.title);
        } catch (error) {
            logError("cron - generateSlug", error, { title: result.title });
            throw new Error(`Failed to generate unique slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // 5. Insert into Database
        // Use a system user ID for cron-generated prompts
        const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || '00000000-0000-0000-0000-000000000000';
        
        const insertData = {
            slug,
            title: result.title,
            description: result.description,
            tags: result.tags,
            created_by: SYSTEM_USER_ID, // Add system user ID
            is_private: false, // Cron-generated prompts are public
        };

        const { data: prompt, error: promptError } = await supabase
            .from("prompts")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(insertData as any)
            .select()
            .single();

        if (promptError) {
            throw new Error(`Failed to insert prompt: ${promptError.message}`);
        }

        // 6. Insert sections
        const sectionsWithPromptId = sections.map((s) => ({
            section_type: s.section_type,
            content: s.content,
            position: s.position,
            prompt_id: prompt.id,
        }));

        const { error: sectionsError } = await supabase
            .from("prompt_sections")
            .insert(sectionsWithPromptId);

        if (sectionsError) {
            throw new Error(`Failed to insert prompt sections: ${sectionsError.message}`);
        }

        return new Response(JSON.stringify({ success: true, slug }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Cron Automation Error:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function POST() {
    return GET();
}
