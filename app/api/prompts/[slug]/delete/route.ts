import { deletePrompt } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
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
    const result = await deletePrompt(slug);
    
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete prompt error:", error);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
