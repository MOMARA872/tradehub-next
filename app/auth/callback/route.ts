import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || searchParams.get("redirectTo") || "/";

  // Supabase may redirect back here with an error in the query string when
  // the server-side signup/OAuth flow fails (e.g. "Database error saving new
  // user"). Surface that on the login page instead of showing a blank 404.
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  if (errorCode || errorDescription) {
    const params = new URLSearchParams();
    params.set("error", errorCode || "auth");
    if (errorDescription) params.set("message", errorDescription);
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Clear any external profile image (Google, Facebook, etc.) that may
      // have been stored. We only allow images hosted on our own storage.
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_image")
          .eq("id", userId)
          .single();
        if (profile?.profile_image) {
          try {
            const imgHost = new URL(profile.profile_image).hostname;
            if (imgHost !== supabaseHost) {
              await supabase
                .from("profiles")
                .update({ profile_image: null })
                .eq("id", userId);
            }
          } catch {
            // Malformed URL — clear it
            await supabase
              .from("profiles")
              .update({ profile_image: null })
              .eq("id", userId);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    const params = new URLSearchParams({ error: "auth", message: error.message });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
