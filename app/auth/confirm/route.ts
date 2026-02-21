import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// Allowed OTP types for validation
const ALLOWED_OTP_TYPES: EmailOtpType[] = ['signup', 'email_change', 'recovery'];

// Allowed redirect paths to prevent open redirect attacks
const ALLOWED_REDIRECT_PATHS = ['/reset-password', '/dashboard', '/login', '/'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  
  // Validate OTP type
  const validType = type && ALLOWED_OTP_TYPES.includes(type as EmailOtpType) ? type as EmailOtpType : null;
  const next = searchParams.get("next") ?? "/reset-password";
  // Fix dashboard path to actual route path
  const correctedNext = next.replace("/dashboard/reset-password", "/reset-password");
  
  // Validate redirect path to prevent open redirect attacks
  const safeNext = ALLOWED_REDIRECT_PATHS.includes(correctedNext) ? correctedNext : "/reset-password";

  if (token_hash && validType) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: validType,
      token_hash,
    });

    if (!error) {
      // For password recovery, we need to get the session tokens
      if (validType === "recovery") {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token && session?.refresh_token) {
          // Redirect to reset password page with tokens
          const redirectUrl = new URL(safeNext, request.url);
          redirectUrl.searchParams.set('access_token', session.access_token);
          redirectUrl.searchParams.set('refresh_token', session.refresh_token);
          return NextResponse.redirect(redirectUrl);
        } else {
          // Session exists but tokens are missing
          return NextResponse.redirect(new URL("/login?error=Session tokens missing", request.url));
        }
      } else {
        // For other types (email confirmation, etc.), redirect to the next URL
        return NextResponse.redirect(new URL(safeNext, request.url));
      }
    }
  }

  // Redirect to login with specific error message
  const errorMessage = "Invalid or expired reset link";
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url));
}
