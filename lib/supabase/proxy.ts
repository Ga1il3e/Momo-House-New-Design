import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!authConfigured()) {
    return guardAdmin(request, supabaseResponse, false);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const role = (data?.claims as { app_metadata?: { role?: string } } | undefined)
    ?.app_metadata?.role;
  return guardAdmin(request, supabaseResponse, role === "staff");
}

function guardAdmin(
  request: NextRequest,
  supabaseResponse: NextResponse,
  isStaff: boolean,
) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/admin/login";

  if (!isAdmin || isLogin) return supabaseResponse;
  if (isStaff) return supabaseResponse;

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}
