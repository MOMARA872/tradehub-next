import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/messages",
  "/post-new",
  "/settings",
  "/offers",
  "/analytics",
  "/reviews",
  "/disputes",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() instead of getUser() in the proxy — it validates the
  // JWT locally without a network round-trip to Supabase, so it won't kick
  // the user to /login when the Supabase API is slow or rate-limited.
  // getUser() should still be used in Server Components where verified
  // identity matters.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Add cache headers for public, read-heavy routes
  const publicCachePaths = ["/browse", "/search", "/listing/", "/premium"];
  const isPublicCacheable = publicCachePaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );
  if (isPublicCacheable && !isProtected) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=43200"
    );
  }

  return supabaseResponse;
}
