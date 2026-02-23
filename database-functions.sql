-- Database functions for atomic prompt operations
-- These functions ensure data consistency by wrapping multiple operations in transactions

-- Function to create a prompt with sections in a single transaction
CREATE OR REPLACE FUNCTION create_prompt_with_sections(
  p_slug TEXT,
  p_title TEXT,
  p_description TEXT,
  p_tags TEXT[],
  p_created_by UUID,
  p_sections JSONB
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_private BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  new_prompt_id UUID;
  section_record JSONB;
BEGIN
  -- Insert the prompt
  INSERT INTO prompts (slug, title, description, tags, created_by, is_private)
  VALUES (p_slug, p_title, p_description, p_tags, p_created_by, false)
  RETURNING id INTO new_prompt_id;
  
  -- Insert all sections
  FOR section_record IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    INSERT INTO prompt_sections (
      prompt_id, 
      section_type, 
      content, 
      position
    ) VALUES (
      new_prompt_id,
      section_record->>'section_type',
      section_record->>'content',
      (section_record->>'position')::INTEGER
    );
  END LOOP;
  
  -- Return the created prompt
  RETURN QUERY
  SELECT * FROM prompts WHERE id = new_prompt_id;
END;
$$;

-- Function to update a prompt with sections in a single transaction
CREATE OR REPLACE FUNCTION update_prompt_with_sections(
  p_prompt_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_tags TEXT[],
  p_sections JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  section_record JSONB;
BEGIN
  -- Update the prompt
  UPDATE prompts 
  SET 
    title = p_title,
    description = p_description,
    tags = p_tags,
    updated_at = NOW()
  WHERE id = p_prompt_id;
  
  -- Delete existing sections
  DELETE FROM prompt_sections WHERE prompt_id = p_prompt_id;
  
  -- Insert all new sections
  FOR section_record IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    INSERT INTO prompt_sections (
      prompt_id, 
      section_type, 
      content, 
      position
    ) VALUES (
      p_prompt_id,
      section_record->>'section_type',
      section_record->>'content',
      (section_record->>'position')::INTEGER
    );
  END LOOP;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_is_private ON prompts(is_private);
CREATE INDEX IF NOT EXISTS idx_prompt_sections_prompt_id ON prompt_sections(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_sections_position ON prompt_sections(prompt_id, position);

-- Add unique constraint for slugs
ALTER TABLE prompts ADD CONSTRAINT IF NOT EXISTS prompts_slug_unique UNIQUE (slug);
