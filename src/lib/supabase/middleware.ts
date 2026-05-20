import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT remove this!
  // This refreshes the session if expired and gets the current user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 1. Protection for Admin Routes (/admin/**)
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Get role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 2. Protection for Client Routes (/client/[id]/**)
  if (url.pathname.startsWith('/client/')) {
    if (!user) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Get profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, client_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // If they are a client, restrict them to their assigned client_id
    if (profile.role === 'client') {
      const pathSegments = url.pathname.split('/');
      const pathId = pathSegments[2]; // /client/[id]

      if (profile.client_id !== pathId) {
        url.pathname = `/client/${profile.client_id}`;
        return NextResponse.redirect(url);
      }
    }
    // If they are an admin, they can access any client portal!
  }

  // 3. Auto-redirect logged-in users away from the login page ('/')
  if (url.pathname === '/') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.role === 'admin') {
          url.pathname = '/admin';
          return NextResponse.redirect(url);
        } else if (profile.role === 'client' && profile.client_id) {
          url.pathname = `/client/${profile.client_id}`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
