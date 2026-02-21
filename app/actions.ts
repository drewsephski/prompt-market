"use server";

import { createClient } from "@/lib/supabase/server";
import { parsePrompt, generateSlug } from "@/lib/parser";
import { z } from "zod";

const createPromptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  rawPrompt: z.string().min(1),
});

export async function createPrompt(formData: FormData) {
  const rawPrompt = formData.get("rawPrompt");
  const title = formData.get("title");
  const description = formData.get("description");
  const tagsString = formData.get("tags");
  
  // Validate FormData values are not null
  if (!rawPrompt || !title) {
    return { error: { general: ["Title and prompt content are required"] } };
  }

  // Parse tags
  const tags = tagsString && typeof tagsString === 'string'
    ? tagsString.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  // Validate input
  const result = createPromptSchema.safeParse({
    title: title as string,
    description: description as string | undefined,
    tags,
    rawPrompt: rawPrompt as string,
  });

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  // Parse the prompt sections
  let sections;
  try {
    sections = parsePrompt(rawPrompt as string);
  } catch (error) {
    return { error: { rawPrompt: [(error as Error).message] } };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: { auth: ["Must be authenticated to create prompts"] } };
  }

  // Generate slug
  let slug = generateSlug(title as string);

  // Check for slug collision and append random suffix if needed
  const { data: existing } = await supabase
    .from("prompts")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    slug = `${slug}-${randomSuffix}`;
  }

  // Insert prompt
  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .insert({
      slug,
      title,
      description,
      tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (promptError) {
    return { error: { database: [promptError.message] } };
  }

  // Insert sections
  const sectionsWithPromptId = sections.map((s) => ({
    ...s,
    prompt_id: prompt.id,
  }));

  const { error: sectionsError } = await supabase
    .from("prompt_sections")
    .insert(sectionsWithPromptId);

  if (sectionsError) {
    return { error: { database: [sectionsError.message] } };
  }

  return { success: true, slug };
}

export async function getPrompt(slug: string) {
  const supabase = await createClient();

  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("*")
    .eq("slug", slug)
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

  return { prompt, sections: sections || [] };
}

export async function listPrompts(page = 1, limit = 20) {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: prompts, error, count } = await supabase
    .from("prompts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { error: error.message };
  }

  return {
    prompts: prompts || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function updatePrompt(slug: string, formData: FormData) {
  const rawPrompt = formData.get("rawPrompt");
  const title = formData.get("title");
  const description = formData.get("description");
  const tagsString = formData.get("tags");
  
  // Validate FormData values are not null
  if (!rawPrompt || !title) {
    return { error: { general: ["Title and prompt content are required"] } };
  }

  // Parse tags
  const tags = tagsString && typeof tagsString === 'string'
    ? tagsString.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  // Validate input
  const result = createPromptSchema.safeParse({
    title: title as string,
    description: description as string | undefined,
    tags,
    rawPrompt: rawPrompt as string,
  });

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  // Parse the prompt sections
  let sections;
  try {
    sections = parsePrompt(rawPrompt as string);
  } catch (error) {
    return { error: { rawPrompt: [(error as Error).message] } };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: { auth: ["Must be authenticated to update prompts"] } };
  }

  // Get the existing prompt
  const { data: existingPrompt, error: fetchError } = await supabase
    .from("prompts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (fetchError || !existingPrompt) {
    return { error: { general: ["Prompt not found"] } };
  }

  // Update prompt
  const { error: promptError } = await supabase
    .from("prompts")
    .update({
      title,
      description,
      tags,
    })
    .eq("slug", slug)
    .select()
    .single();

  if (promptError) {
    return { error: { database: [promptError.message] } };
  }

  // Delete existing sections
  const { error: deleteError } = await supabase
    .from("prompt_sections")
    .delete()
    .eq("prompt_id", existingPrompt.id);

  if (deleteError) {
    return { error: { database: [deleteError.message] } };
  }

  // Insert new sections
  const sectionsWithPromptId = sections.map((s) => ({
    ...s,
    prompt_id: existingPrompt.id,
  }));

  const { error: sectionsError } = await supabase
    .from("prompt_sections")
    .insert(sectionsWithPromptId);

  if (sectionsError) {
    return { error: { database: [sectionsError.message] } };
  }

  return { success: true, slug };
}
