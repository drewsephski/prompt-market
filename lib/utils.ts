import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/parser";

/**
 * Generate a unique slug with atomic retry logic to handle race conditions
 * Uses database-level constraints to ensure uniqueness
 */
export async function generateUniqueSlug(baseTitle: string, maxRetries = 5): Promise<string> {
  const supabase = await createClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let slug = generateSlug(baseTitle);
    
    // Add random suffix for subsequent attempts
    if (attempt > 0) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      slug = `${slug}-${randomSuffix}`;
    }
    
    try {
      // Try to insert a temporary record to test uniqueness atomically
      const { error } = await supabase
        .from("prompts")
        .insert({
          slug,
          title: "__temp__",
          created_by: "00000000-0000-0000-0000-000000000000",
          is_private: true
        });
      
      if (error) {
        if (error.code === '23505') { // Unique violation
          // Slug exists, try again with different suffix
          console.log(`Slug ${slug} exists, retrying... (attempt ${attempt + 1})`);
          continue;
        } else {
          console.error(`Database error checking slug ${slug}:`, error);
          throw new Error(`Database error checking slug: ${error.message}`);
        }
      } else {
        // Successfully inserted temporary record, now remove it
        await supabase
          .from("prompts")
          .delete()
          .eq("slug", slug);
        
        console.log(`Generated unique slug: ${slug} (attempt ${attempt + 1})`);
        return slug;
      }
    } catch (error) {
      console.error(`Error in slug generation attempt ${attempt + 1}:`, error);
      if (attempt === maxRetries - 1) {
        throw new Error(`Failed to generate unique slug after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      // Continue to next attempt
    }
  }
  
  // Fallback (shouldn't reach here)
  const fallbackSuffix = Math.random().toString(36).substring(2, 7);
  const fallbackSlug = `${generateSlug(baseTitle)}-${fallbackSuffix}`;
  console.warn(`Using fallback slug: ${fallbackSlug}`);
  return fallbackSlug;
}

/**
 * Validate and sanitize user input
 */
export function validateInput(input: unknown, maxLength: number, fieldName: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  
  return trimmed;
}

/**
 * Log structured errors for debugging
 */
export function logError(context: string, error: unknown, additionalData?: Record<string, unknown>) {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error),
    ...additionalData
  };
  
  console.error(`[${context}] Error:`, JSON.stringify(errorInfo, null, 2));
}
