import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the verification code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If successful, redirect to the desired route
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } else {
      console.error("Auth callback error:", error);
    }
  }

  // If there's an error, redirect to a generic error state
  // or back to login with an error parameter
  return NextResponse.redirect(new URL('/?error=auth-callback-failed', requestUrl.origin));
}
