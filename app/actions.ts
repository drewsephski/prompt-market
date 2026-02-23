"use server";

import { createClient } from "@/lib/supabase/server";
import { parsePrompt } from "@/lib/parser";
import { generateUniqueSlug, logError } from "@/lib/utils";
import { 
  createPromptSchema, 
  validateInput, 
  validateTags, 
  validateSlug 
} from "@/lib/validation";

export async function createPrompt(formData: FormData) {
  const rawPrompt = formData.get("rawPrompt");
  const title = formData.get("title");
  const description = formData.get("description");
  const tagsString = formData.get("tags");
  
  try {
    // Validate and sanitize inputs
    const validatedTitle = validateInput(title, 200, "Title");
    const validatedRawPrompt = validateInput(rawPrompt, 10000, "Raw prompt");
    const validatedDescription = description ? validateInput(description, 1000, "Description") : undefined;
    
    // Parse and validate tags
    const tags = tagsString && typeof tagsString === 'string'
      ? validateTags(tagsString.split(",").map((t: string) => t.trim()))
      : [];

    // Validate input with schema
    const result = createPromptSchema.safeParse({
      title: validatedTitle,
      description: validatedDescription,
      tags,
      rawPrompt: validatedRawPrompt,
    });

    if (!result.success) {
      return { error: result.error.flatten().fieldErrors };
    }

    // Parse the prompt sections
    let sections;
    try {
      sections = parsePrompt(validatedRawPrompt);
    } catch (error) {
      logError("createPrompt - parsePrompt", error, { title: validatedTitle });
      return { error: { rawPrompt: [(error as Error).message] } };
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logError("createPrompt - auth", userError, { title: validatedTitle });
      return { error: { auth: ["Must be authenticated to create prompts"] } };
    }

    // Generate unique slug with retry logic
    let slug;
    try {
      slug = await generateUniqueSlug(validatedTitle);
    } catch (error) {
      logError("createPrompt - generateSlug", error, { title: validatedTitle });
      return { error: { general: ["Failed to generate unique slug"] } };
    }

    // Use a transaction to ensure data consistency
    const { data: prompt, error: promptError } = await supabase.rpc('create_prompt_with_sections', {
      p_slug: slug,
      p_title: validatedTitle,
      p_description: validatedDescription,
      p_tags: tags,
      p_created_by: user.id,
      p_sections: sections.map((s) => ({
        section_type: s.section_type,
        content: s.content,
        position: s.position
      }))
    });

    if (promptError) {
      logError("createPrompt - transaction", promptError, { slug, title: validatedTitle });
      return { error: { database: [promptError.message] } };
    }

    return { success: true, slug };
  } catch (error) {
    logError("createPrompt - unexpected", error, { title: title as string });
    return { error: { general: ["An unexpected error occurred"] } };
  }
}

export async function getPrompt(slug: string) {
  try {
    const validatedSlug = validateSlug(slug);
    const supabase = await createClient();

    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("*")
      .eq("slug", validatedSlug)
      .single();

    if (promptError || !prompt) {
      return { error: "Prompt not found" };
    }

    const { data: sections, error: sectionsError } = await supabase
      .from("prompt_sections")
      .select("*")
      .eq("prompt_id", prompt.id)
      .order("position");

    if (sectionsError) {
      return { error: sectionsError.message };
    }

    // Get current user for ownership check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Handle authentication errors gracefully
    if (userError) {
      console.error("Auth error in getPrompt:", userError);
      // Still return the prompt data, but mark ownership as false
      return { 
        prompt, 
        sections: sections || [],
        isOwner: false,
        canEdit: false,
        canDelete: false
      };
    }

    return { 
      prompt, 
      sections: sections || [],
      isOwner: user?.id === prompt.created_by,
      canEdit: user?.id === prompt.created_by,
      canDelete: user?.id === prompt.created_by
    };
  } catch (error) {
    logError("getPrompt - unexpected", error, { slug });
    return { error: "Failed to get prompt" };
  }
}

export async function listPrompts(page = 1, limit = 100) {
  try {
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return { error: "Invalid pagination parameters" };
    }

    const supabase = await createClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get current user for privacy filtering
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from("prompts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Filter out private prompts unless user is owner
    if (!user) {
      // Not authenticated - only show public prompts
      query = query.is("is_private", false);
    } else {
      // Authenticated - show public prompts + user's private prompts
      // Use proper filtering to prevent SQL injection
      query = query.or(`is_private.eq.false,created_by.eq.${user.id}`);
    }

    const { data: prompts, error, count } = await query;

    if (error) {
      logError("listPrompts - query", error, { page, limit, userId: user?.id });
      return { error: error.message };
    }

    const result = {
      prompts: prompts || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };

    console.log("listPrompts result:", { 
      promptsCount: result.prompts.length, 
      total: result.total,
      limit,
      page,
      userId: user?.id
    });

    return result;
  } catch (error) {
    logError("listPrompts - unexpected", error, { page, limit });
    return { error: "Failed to list prompts" };
  }
}

export async function togglePromptPrivacy(slug: string, isPrivate: boolean) {
  try {
    // Validate inputs
    const validatedSlug = validateSlug(slug);
    
    if (typeof isPrivate !== 'boolean') {
      return { error: { general: ["Invalid privacy value"] } };
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logError("togglePromptPrivacy - auth", userError, { slug: validatedSlug });
      return { error: { auth: ["Must be authenticated to change prompt privacy"] } };
    }

    // Get existing prompt
    const { data: existingPrompt, error: fetchError } = await supabase
      .from("prompts")
      .select("*")
      .eq("slug", validatedSlug)
      .single();

    if (fetchError || !existingPrompt) {
      logError("togglePromptPrivacy - fetchPrompt", fetchError, { slug: validatedSlug });
      return { error: { general: ["Prompt not found"] } };
    }

    // Check if user owns the prompt
    if (existingPrompt.created_by !== user.id) {
      logError("togglePromptPrivacy - unauthorized", null, { slug: validatedSlug, userId: user.id, promptOwner: existingPrompt.created_by });
      return { error: { auth: ["You can only change privacy of your own prompts"] } };
    }

    // Update privacy
    const { error: updateError } = await supabase
      .from("prompts")
      .update({ is_private: isPrivate })
      .eq("id", existingPrompt.id);

    if (updateError) {
      logError("togglePromptPrivacy - update", updateError, { slug: validatedSlug, isPrivate });
      return { error: { database: [updateError.message] } };
    }

    return { success: true, isPrivate };
  } catch (error) {
    logError("togglePromptPrivacy - unexpected", error, { slug, isPrivate });
    return { error: { general: ["An unexpected error occurred"] } };
  }
}

export async function deletePrompt(slug: string) {
  try {
    // Validate input
    const validatedSlug = validateSlug(slug);

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logError("deletePrompt - auth", userError, { slug: validatedSlug });
      return { error: { auth: ["Must be authenticated to delete prompts"] } };
    }

    // Get existing prompt
    const { data: existingPrompt, error: fetchError } = await supabase
      .from("prompts")
      .select("*")
      .eq("slug", validatedSlug)
      .single();

    if (fetchError || !existingPrompt) {
      logError("deletePrompt - fetchPrompt", fetchError, { slug: validatedSlug });
      return { error: { general: ["Prompt not found"] } };
    }

    // Check if user owns the prompt
    if (existingPrompt.created_by !== user.id) {
      logError("deletePrompt - unauthorized", null, { slug: validatedSlug, userId: user.id, promptOwner: existingPrompt.created_by });
      return { error: { auth: ["You can only delete your own prompts"] } };
    }

    // Delete sections first (due to foreign key constraint)
    const { error: deleteSectionsError } = await supabase
      .from("prompt_sections")
      .delete()
      .eq("prompt_id", existingPrompt.id);

    if (deleteSectionsError) {
      logError("deletePrompt - deleteSections", deleteSectionsError, { slug: validatedSlug });
      return { error: { database: [deleteSectionsError.message] } };
    }

    // Delete the prompt
    const { error: deletePromptError } = await supabase
      .from("prompts")
      .delete()
      .eq("id", existingPrompt.id);

    if (deletePromptError) {
      logError("deletePrompt - deletePrompt", deletePromptError, { slug: validatedSlug });
      return { error: { database: [deletePromptError.message] } };
    }

    return { success: true };
  } catch (error) {
    logError("deletePrompt - unexpected", error, { slug });
    return { error: { general: ["An unexpected error occurred"] } };
  }
}

export async function updatePrompt(slug: string, formData: FormData) {
  const rawPrompt = formData.get("rawPrompt");
  const title = formData.get("title");
  const description = formData.get("description");
  const tagsString = formData.get("tags");
  
  try {
    // Validate and sanitize inputs
    const validatedSlug = validateSlug(slug);
    const validatedTitle = validateInput(title, 200, "Title");
    const validatedRawPrompt = validateInput(rawPrompt, 10000, "Raw prompt");
    const validatedDescription = description ? validateInput(description, 1000, "Description") : undefined;
    
    // Parse and validate tags
    const tags = tagsString && typeof tagsString === 'string'
      ? validateTags(tagsString.split(",").map((t: string) => t.trim()))
      : [];

    // Validate input with schema
    const result = createPromptSchema.safeParse({
      title: validatedTitle,
      description: validatedDescription,
      tags,
      rawPrompt: validatedRawPrompt,
    });

    if (!result.success) {
      return { error: result.error.flatten().fieldErrors };
    }

    // Parse the prompt sections
    let sections;
    try {
      sections = parsePrompt(validatedRawPrompt);
    } catch (error) {
      logError("updatePrompt - parsePrompt", error, { title: validatedTitle });
      return { error: { rawPrompt: [(error as Error).message] } };
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logError("updatePrompt - auth", userError, { slug: validatedSlug, title: validatedTitle });
      return { error: { auth: ["Must be authenticated to update prompts"] } };
    }

    // Get the existing prompt and verify ownership
    const { data: existingPrompt, error: fetchError } = await supabase
      .from("prompts")
      .select("*")
      .eq("slug", validatedSlug)
      .single();

    if (fetchError || !existingPrompt) {
      logError("updatePrompt - fetchPrompt", fetchError, { slug: validatedSlug });
      return { error: { general: ["Prompt not found"] } };
    }

    // Check if user owns the prompt
    if (existingPrompt.created_by !== user.id) {
      logError("updatePrompt - unauthorized", null, { slug: validatedSlug, userId: user.id, promptOwner: existingPrompt.created_by });
      return { error: { auth: ["You can only update your own prompts"] } };
    }

    // Use a transaction to ensure data consistency
    const { error: updateError } = await supabase.rpc('update_prompt_with_sections', {
      p_prompt_id: existingPrompt.id,
      p_title: validatedTitle,
      p_description: validatedDescription,
      p_tags: tags,
      p_sections: sections.map((s) => ({
        section_type: s.section_type,
        content: s.content,
        position: s.position
      }))
    });

    if (updateError) {
      logError("updatePrompt - transaction", updateError, { slug: validatedSlug, title: validatedTitle });
      return { error: { database: [updateError.message] } };
    }

    return { success: true, slug: validatedSlug };
  } catch (error) {
    logError("updatePrompt - unexpected", error, { slug, title: title as string });
    return { error: { general: ["An unexpected error occurred"] } };
  }
}
