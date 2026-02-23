import { listPrompts } from "@/app/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await listPrompts(1, 100);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}
