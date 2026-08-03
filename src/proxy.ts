import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Public paths that do not require authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/accept-invite" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico");

  const authToken = request.cookies.get("auth_token")?.value;
  const isLogoutRequested = searchParams.get("logout") === "true";

  // If user requests logout or visits /login explicitly, allow them to view login form
  if ((pathname === "/login" || pathname === "/signup") && isLogoutRequested) {
    const response = NextResponse.next();
    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return response;
  }

  // Redirect unauthenticated user to /login
  if (!isPublicPath && !authToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user away from /login or /signup to /dashboard (unless logout is requested)
  if ((pathname === "/login" || pathname === "/signup") && authToken && !isLogoutRequested) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
