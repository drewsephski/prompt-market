export interface ParsedSection {
  section_type: string;
  content: string;
  position: number;
}

const VALID_SECTIONS = [
  "Role",
  "Context",
  "Instructions",
  "Constraints",
  "Output_Format",
  "User_Input",
];

export function parsePrompt(rawPrompt: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const sectionRegex = /<([A-Za-z_]+)>([\s\S]*?)<\/\1>/g;

  let match;
  let position = 0;

  while ((match = sectionRegex.exec(rawPrompt)) !== null) {
    const sectionType = match[1];
    const content = match[2].trim();

    if (VALID_SECTIONS.includes(sectionType)) {
      sections.push({
        section_type: sectionType,
        content,
        position,
      });
      position++;
    }
  }

  // Validate required sections
  const hasRole = sections.some((s) => s.section_type === "Role");
  const hasInstructions = sections.some((s) => s.section_type === "Instructions");

  if (!hasRole || !hasInstructions) {
    throw new Error("Prompt must include both <Role> and <Instructions> sections");
  }

  return sections;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
