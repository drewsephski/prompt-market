import { togglePromptPrivacy } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Defense-in-depth: Check authorization at API level
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: { auth: ["Authentication required"] } }, { status: 401 });
    }

    const { slug } = await params;
    
    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { general: ["Invalid JSON in request body"] } }, { status: 400 });
    }
    
    // Validate body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: { general: ["Request body must be an object"] } }, { status: 400 });
    }
    
    const { isPrivate } = body;
    
    // Validate isPrivate field
    if (typeof isPrivate !== 'boolean') {
      return NextResponse.json({ error: { general: ["isPrivate must be a boolean value"] } }, { status: 400 });
    }
    
    const result = await togglePromptPrivacy(slug, isPrivate);
    
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, isPrivate: result.isPrivate });
  } catch (error) {
    console.error("Privacy toggle error:", error);
    return NextResponse.json({ error: "Failed to update privacy" }, { status: 500 });
  }
}
