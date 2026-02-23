import { z } from "zod";

// Input validation constants
export const MAX_IDEA_LENGTH = 1000;
export const MAX_PROMPT_LENGTH = 10000;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_COUNT = 10;

// Zod schemas for validation
export const createPromptSchema = z.object({
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  tags: z.array(z.string().min(1).max(MAX_TAG_LENGTH)).max(MAX_TAGS_COUNT).default([]),
  rawPrompt: z.string().min(1).max(MAX_PROMPT_LENGTH),
});

export const updatePromptSchema = createPromptSchema;

export const privacyToggleSchema = z.object({
  isPrivate: z.boolean(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
});

/**
 * Validates input string length and content
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
 * Validates and sanitizes tag array
 */
export function validateTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    throw new Error("Tags must be an array");
  }
  
  if (tags.length > MAX_TAGS_COUNT) {
    throw new Error(`Cannot have more than ${MAX_TAGS_COUNT} tags`);
  }
  
  const sanitizedTags = tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => tag.trim().substring(0, MAX_TAG_LENGTH))
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  
  return sanitizedTags;
}

/**
 * Validates slug format
 */
export function validateSlug(slug: unknown): string {
  if (!slug || typeof slug !== 'string') {
    throw new Error("Slug is required and must be a string");
  }
  
  const trimmed = slug.trim();
  
  if (trimmed.length === 0) {
    throw new Error("Slug cannot be empty");
  }
  
  // Allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error("Slug can only contain letters, numbers, hyphens, and underscores");
  }
  
  if (trimmed.length > 100) {
    throw new Error("Slug cannot exceed 100 characters");
  }
  
  return trimmed;
}
