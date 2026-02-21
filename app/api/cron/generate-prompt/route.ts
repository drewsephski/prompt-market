import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { autofillPromptInternal } from "@/app/ai-actions";
import { createClient } from "@supabase/supabase-js";
import { parsePrompt, generateSlug } from "@/lib/parser";

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

        // 2. Autofill the prompt structure using the existing action
        const result = await autofillPromptInternal(idea);
        console.log("Autofilled prompt structure with title:", result.title);

        // 3. Parse into sections
        let sections;
        try {
            sections = parsePrompt(result.rawPrompt);
        } catch (err) {
            console.error("Failed to parse the generated rawPrompt:", err);
            throw err;
        }

        // 4. Generate slug and handle collisions
        let slug = generateSlug(result.title);
        const { data: existing } = await supabase
            .from("prompts")
            .select("slug")
            .eq("slug", slug)
            .single();

        if (existing) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        // 5. Insert into Database
        // Note: If `created_by` is strongly typed to UUID and required, this might fail 
        // unless we have a specific system user ID. We will try omitting it first.
        // If it fails, we will need to create a system user or modify the DB setup.
        const insertData = {
            slug,
            title: result.title,
            description: result.description,
            tags: result.tags,
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
            ...s,
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
