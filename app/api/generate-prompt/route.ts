import { generateSimpleComprehensivePrompt, generateComplexGeneralPrompt, autofillPromptInternal } from "@/app/ai-actions";
import { createClient } from "@supabase/supabase-js";
import { parsePrompt } from "@/lib/parser";
import { generateUniqueSlug, logError } from "@/lib/utils";
import { categorizePrompt } from "@/lib/categorization";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Input validation schema
const generatePromptSchema = z.object({
  idea: z.string().min(1).max(1000),
  complexity: z.enum(['simple', 'complex', 'visionary'])
});

// We use the service role key to bypass RLS for background cron jobs
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Verify user authentication first
        const authSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error: authError } = await authSupabase.auth.getUser();
        
        // Validate request body
        const body = await request.json();
        
        if (authError || !user) {
            logError("generate-prompt - auth", authError, { idea: body?.idea });
            return NextResponse.json(
                { error: "Authentication required to generate prompts" },
                { status: 401 }
            );
        }

        const validationResult = generatePromptSchema.safeParse(body);
        
        if (!validationResult.success) {
            logError("generate-prompt - validation", null, { 
                error: validationResult.error.flatten(),
                body: { idea: body?.idea, complexity: body?.complexity }
            });
            return NextResponse.json(
                { error: "Invalid input", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }
        
        const { idea, complexity } = validationResult.data;

        console.log(`Generating ${complexity} prompt for idea:`, idea, "User:", user.id);

        // Generate prompt based on complexity level
        let result;
        switch (complexity) {
            case 'simple':
                result = await generateSimpleComprehensivePrompt(idea);
                break;
            case 'complex':
                result = await generateComplexGeneralPrompt(idea);
                break;
            case 'visionary':
            default:
                result = await autofillPromptInternal(idea);
                break;
        }

        // Enhanced categorization using the new utility
        const category = categorizePrompt(result.tags, result.title, result.description);
        console.log(`Categorized generated prompt as: ${category}`);
        
        // Add category as a tag if not already present
        const enhancedTags = [...result.tags];
        if (!enhancedTags.includes(category)) {
            enhancedTags.push(category);
        }

        // Parse into sections
        let sections;
        try {
            sections = parsePrompt(result.rawPrompt);
        } catch (err) {
            console.error("Failed to parse the generated rawPrompt:", err);
            throw err;
        }

        // Generate slug and handle collisions with retry logic
        let slug;
        try {
            slug = await generateUniqueSlug(result.title);
        } catch (error) {
            throw new Error(`Failed to generate unique slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Insert into Database
        // Use the authenticated user's ID
        const insertData = {
            slug,
            title: result.title,
            description: result.description,
            tags: [...enhancedTags, complexity], // Add enhanced tags and complexity as a tag
            created_by: user.id, // Use authenticated user ID
            is_private: false, // Generated prompts are public by default
        };

        const { data: prompt, error: promptError } = await supabase
            .from("prompts")
            .insert(insertData)
            .select()
            .single();

        if (promptError) {
            throw new Error(`Failed to insert prompt: ${promptError.message}`);
        }

        // Insert sections
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

        return NextResponse.json({ 
            success: true, 
            slug,
            title: result.title,
            complexity 
        }, { status: 200 });

    } catch (error) {
        console.error("Prompt generation error:", error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
