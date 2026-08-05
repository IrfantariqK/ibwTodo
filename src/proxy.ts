import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Public paths that do not require authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/accept-invite" ||
    pathname.startsWith("/leader/login") ||
    pathname.startsWith("/client/login") ||
    pathname.startsWith("/member/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico");

  const authToken = request.cookies.get("auth_token")?.value;
  const isLogoutRequested = searchParams.get("logout") === "true";

  const isLoginPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/leader/login") ||
    pathname.startsWith("/client/login") ||
    pathname.startsWith("/member/login");

  // If user requests logout or visits login explicitly with logout flag, clear cookie
  if (isLoginPath && isLogoutRequested) {
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

  // Redirect unauthenticated user to their respective login portal
  if (!isPublicPath && !authToken) {
    let targetLogin = "/leader/login";
    if (pathname.startsWith("/client")) {
      targetLogin = "/client/login";
    } else if (pathname.startsWith("/member")) {
      targetLogin = "/member/login";
    }
    const loginUrl = new URL(targetLogin, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user away from login pages to leader dashboard by default
  if (isLoginPath && authToken && !isLogoutRequested) {
    let targetDashboard = "/leader/dashboard";
    if (pathname.startsWith("/client")) {
      targetDashboard = "/client/dashboard";
    } else if (pathname.startsWith("/member")) {
      targetDashboard = "/member/dashboard";
    }
    const dashboardUrl = new URL(targetDashboard, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
