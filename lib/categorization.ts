/**
 * Enhanced categorization utilities for prompts
 * Provides intelligent categorization based on tags, titles, and descriptions
 */

// Comprehensive tag mapping with expanded coverage
const TAG_MAPPING: Record<string, string[]> = {
  architecture: [
    "Software Architecture", "architecture", "System Architecture", "Systems Architecture", 
    "Micro-Frontends", "design-patterns", "design-system", "Event-Driven Systems",
    "Reactive Systems", "Stream Processing", "Graph Databases", "microservices", "api",
    "backend", "database", "scalability", "distributed", "cloud", "infrastructure",
    "devops", "kubernetes", "docker", "serverless", "web-development", "full-stack",
    "system-design", "software-design", "technical-architecture", "enterprise-architecture"
  ],
  ai: [
    "ai-sdk", "ai-agent", "agents", "llm", "streaming", "tools", "tool-calling", 
    "automation", "workflows", "vercel", "Autonomous Agents", "Neuro-Symbolic-AI",
    "AI Ethics", "Integrated-Information-Theory", "Neural Darwinism", "machine-learning",
    "deep-learning", "nlp", "computer-vision", "robotics", "chatbot", "conversational",
    "generative-ai", "prompt-engineering", "gpt", "claude", "gemini", "openai",
    "artificial-intelligence", "ml", "neural-networks", "transformers", "agi"
  ],
  philosophy: [
    "Deleuzian Philosophy", "Process Philosophy", "Panpsychism", "Transhumanism", 
    "Post-Human Computing", "Post-Humanist Tech", "Post-Structuralist Engineering",
    "Digital Ontology", "Speculative Fiction", "Worldbuilding", "Thermodynamics",
    "ethics", "consciousness", "metaphysics", "epistemology", "existentialism",
    "phenomenology", "hermeneutics", "critical-theory", "postmodernism", "philosophy",
    "ontological", "phenomenological", "hermeneutic", "deconstruction", "ethics-of-ai"
  ],
  frontend: [
    "frontend", "react", "shadcn", "tailwind", "design-system", "ui", "components", 
    "javascript", "typescript", "Micro-Frontends", "Frontend Development", "developer-experience",
    "vue", "angular", "svelte", "nextjs", "nuxt", "css", "html", "responsive",
    "accessibility", "ux", "ui-design", "web-design", "mobile", "pwa", "user-interface",
    "user-experience", "frontend-architecture", "component-library", "styling"
  ],
  forensic: [
    "Forensic Linguistics", "forensic", "investigation", "analysis", "linguistics", 
    "legal", "audit", "analyst", "investigator", "detective", "Digital Paleontology",
    "Bio-Digital Architectures", "security", "cybersecurity", "penetration-testing",
    "malware-analysis", "digital-forensics", "incident-response", "threat-intelligence",
    "cyber-forensics", "security-analysis", "vulnerability-assessment", "threat-analysis"
  ],
  business: [
    "founder", "startup", "validation", "mvp", "pitch", "fundraising", "interview", 
    "career", "business-model", "market-research", "investors", "negotiation",
    "Negotiation Analysis", "communication", "Communication Strategy", "Corporate Communication",
    "marketing", "sales", "strategy", "leadership", "management", "entrepreneurship",
    "product-management", "finance", "accounting", "consulting", "business-analysis",
    "business-development", "strategic-planning", "market-analysis", "competitive-analysis"
  ],
};

// Content-based keywords for fallback categorization
const CONTENT_KEYWORDS: Record<string, string[]> = {
  architecture: [
    "system", "architecture", "design", "pattern", "scalable", "distributed", 
    "api", "backend", "database", "infrastructure", "software", "technical", 
    "engineering", "system-design", "enterprise", "microservice", "cloud-native"
  ],
  ai: [
    "ai", "artificial intelligence", "machine learning", "llm", "chatbot", "automation", 
    "agent", "neural", "deep learning", "algorithm", "model", "training", "inference",
    "natural language", "computer vision", "robotics", "autonomous", "intelligent"
  ],
  philosophy: [
    "philosophy", "ethics", "consciousness", "metaphysics", "existential", "ontological", 
    "epistemology", "phenomenology", "hermeneutics", "critical theory", "postmodern",
    "deconstruction", "ethics-of", "meaning", "being", "knowledge", "truth", "reality"
  ],
  frontend: [
    "frontend", "ui", "ux", "interface", "web", "react", "vue", "angular", "css", "html", 
    "javascript", "typescript", "user interface", "user experience", "responsive", "mobile",
    "component", "styling", "layout", "interaction", "design system"
  ],
  forensic: [
    "forensic", "investigation", "analysis", "security", "legal", "audit", "detective", 
    "cyber", "threat", "vulnerability", "malware", "incident", "breach", "compliance",
    "risk assessment", "security analysis", "digital evidence"
  ],
  business: [
    "business", "startup", "entrepreneur", "marketing", "sales", "strategy", "management", 
    "finance", "revenue", "profit", "market", "customer", "product", "growth", "investment",
    "funding", "valuation", "competitive", "industry", "enterprise", "organization"
  ],
};

/**
 * Enhanced categorization function with scoring and fuzzy matching
 */
export function categorizePrompt(tags: string[], title?: string, description?: string | null): string {
  // Primary categorization based on tags
  const tagCategory = categorizeByTags(tags);
  
  // If we have a confident tag match (score > 2), use it
  if (tagCategory !== 'other' && getTagScore(tags, tagCategory) > 2) {
    return tagCategory;
  }
  
  // Fallback to content-based categorization
  if (title || description) {
    const contentCategory = categorizeByContent(title || '', description || '');
    if (contentCategory !== 'other') {
      return contentCategory;
    }
  }
  
  return 'other';
}

/**
 * Categorize based primarily on tags with scoring
 */
function categorizeByTags(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return "other";
  }

  // Convert tags to lowercase for case-insensitive matching
  const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
  
  // Score-based categorization with multiple matches
  const categoryScores: Record<string, number> = {};
  
  for (const [category, categoryTags] of Object.entries(TAG_MAPPING)) {
    let score = 0;
    for (const tag of normalizedTags) {
      for (const categoryTag of categoryTags) {
        // Exact match gets highest score
        if (tag === categoryTag.toLowerCase()) {
          score += 3;
        }
        // Contains match gets medium score
        else if (tag.includes(categoryTag.toLowerCase()) || categoryTag.toLowerCase().includes(tag)) {
          score += 2;
        }
        // Partial word match gets lower score
        else if (tag.split('-').some(word => categoryTag.toLowerCase().includes(word)) ||
                 categoryTag.toLowerCase().split('-').some(word => tag.includes(word))) {
          score += 1;
        }
      }
    }
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  // Find category with highest score
  let bestCategory = "other";
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  // Log categorization for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`Tag categorization: tags=[${normalizedTags.join(', ')}] -> category=${bestCategory} (score=${highestScore})`);
  }
  
  return bestCategory;
}

/**
 * Get the score for a specific category based on tags
 */
function getTagScore(tags: string[], category: string): number {
  if (!tags || tags.length === 0 || category === 'other') {
    return 0;
  }

  const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
  const categoryTags = TAG_MAPPING[category] || [];
  let score = 0;
  
  for (const tag of normalizedTags) {
    for (const categoryTag of categoryTags) {
      if (tag === categoryTag.toLowerCase()) {
        score += 3;
      } else if (tag.includes(categoryTag.toLowerCase()) || categoryTag.toLowerCase().includes(tag)) {
        score += 2;
      } else if (tag.split('-').some(word => categoryTag.toLowerCase().includes(word)) ||
                 categoryTag.toLowerCase().split('-').some(word => tag.includes(word))) {
        score += 1;
      }
    }
  }
  
  return score;
}

/**
 * Fallback categorization based on title and description content
 */
function categorizeByContent(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  const categoryScores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(CONTENT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        score += 1;
      }
    }
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  let bestCategory = "other";
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  // Log content categorization for debugging
  if (process.env.NODE_ENV === 'development' && bestCategory !== 'other') {
    console.log(`Content categorization: content="${title} ${description}" -> category=${bestCategory} (score=${highestScore})`);
  }
  
  return bestCategory;
}

/**
 * Get all available categories with their display information
 */
export function getCategories() {
  return {
    all: { label: "All", icon: "◆" },
    my: { label: "My Prompts", icon: "⚙" },
    architecture: { label: "Architecture", icon: "⚙" },
    ai: { label: "AI & ML", icon: "◊" },
    philosophy: { label: "Philosophy", icon: "◎" },
    frontend: { label: "Frontend", icon: "◈" },
    forensic: { label: "Forensic", icon: "⌕" },
    business: { label: "Business", icon: "◆" },
    other: { label: "Other", icon: "○" },
  };
}

/**
 * Get styling information for categories
 */
export function getCategoryStyles() {
  return {
    all: {
      active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
      count: "text-emerald-500/60",
      hover: "group-hover:text-emerald-400",
    },
    my: {
      active: "border-purple-500/50 bg-purple-500/10 text-purple-400",
      count: "text-purple-500/60",
      hover: "group-hover:text-purple-400",
    },
    architecture: {
      active: "border-blue-500/50 bg-blue-500/10 text-blue-400",
      count: "text-blue-500/60",
      hover: "group-hover:text-blue-400",
    },
    ai: {
      active: "border-violet-500/50 bg-violet-500/10 text-violet-400",
      count: "text-violet-500/60",
      hover: "group-hover:text-violet-400",
    },
    philosophy: {
      active: "border-amber-500/50 bg-amber-500/10 text-amber-400",
      count: "text-amber-500/60",
      hover: "group-hover:text-amber-400",
    },
    frontend: {
      active: "border-rose-500/50 bg-rose-500/10 text-rose-400",
      count: "text-rose-500/60",
      hover: "group-hover:text-rose-400",
    },
    forensic: {
      active: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
      count: "text-cyan-500/60",
      hover: "group-hover:text-cyan-400",
    },
    business: {
      active: "border-green-500/50 bg-green-500/10 text-green-400",
      count: "text-green-500/60",
      hover: "group-hover:text-green-400",
    },
    other: {
      active: "border-stone-500/50 bg-stone-500/10 text-stone-400",
      count: "text-stone-500/60",
      hover: "group-hover:text-stone-400",
    },
  };
}

/**
 * Get color class for category hover effects
 */
export function getCategoryColor(category: string): string {
  const colors = {
    architecture: 'group-hover:text-blue-400',
    ai: 'group-hover:text-violet-400',
    philosophy: 'group-hover:text-amber-400',
    frontend: 'group-hover:text-rose-400',
    forensic: 'group-hover:text-cyan-400',
    business: 'group-hover:text-green-400',
    other: 'group-hover:text-stone-400',
  };
  return colors[category as keyof typeof colors] || 'group-hover:text-stone-400';
}
