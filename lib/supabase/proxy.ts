import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { HOUSES, isHouse } from "@/lib/house";
import { authConfigured } from "@/lib/supabase/env";

const PUBLIC_ADMIN = new Set([
  "/admin/login",
  "/admin/mot-de-passe",
  "/admin/reinitialiser",
]);

const OWNER_ONLY = new Set(["/admin/maisons", "/admin/equipe", "/admin/marque"]);

type Claims = {
  app_metadata?: { role?: string; house?: string };
};

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!authConfigured()) {
    return guardAdmin(request, supabaseResponse, null);
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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
  const claims = data?.claims as Claims | undefined;
  return guardAdmin(request, supabaseResponse, claims ?? null);
}

function redirectTo(request: NextRequest, supabaseResponse: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return copyCookies(supabaseResponse, NextResponse.redirect(url));
}

function guardAdmin(
  request: NextRequest,
  supabaseResponse: NextResponse,
  claims: Claims | null,
) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdmin) return supabaseResponse;
  if (PUBLIC_ADMIN.has(pathname)) return supabaseResponse;

  const role = claims?.app_metadata?.role;
  const house = claims?.app_metadata?.house;
  const isStaff = role === "staff";
  const isOwner = role === "owner";

  if (!claims || (!isStaff && !isOwner)) {
    if (role === "disabled" || (claims && !isStaff && !isOwner)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "?erreur=acces";
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
      });
      return redirect;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (pathname === "/admin") {
    if (isOwner) return redirectTo(request, supabaseResponse, "/admin/maisons");
    if (isHouse(house)) return redirectTo(request, supabaseResponse, `/admin/${house}`);
    return redirectTo(request, supabaseResponse, "/admin/login?erreur=acces");
  }

  const segments = pathname.split("/").filter(Boolean);
  const maybeHouse = segments[1];
  if (isHouse(maybeHouse) && isStaff && house && maybeHouse !== house) {
    const rest = segments.slice(2).join("/");
    return redirectTo(
      request,
      supabaseResponse,
      rest ? `/admin/${house}/${rest}` : `/admin/${house}`,
    );
  }

  const ownerPath = `/${segments.slice(0, 2).join("/")}`;
  if (OWNER_ONLY.has(ownerPath) && !isOwner) {
    return redirectTo(
      request,
      supabaseResponse,
      isHouse(house) ? `/admin/${house}` : "/admin/login?erreur=acces",
    );
  }

  void HOUSES;
  return supabaseResponse;
}
