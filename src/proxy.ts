import { NextResponse, type NextRequest } from "next/server";
import { FAMILY_COOKIE, isValidFamilyToken } from "@/lib/session";

/** 家族パスコードを入力していない端末は /unlock へ */
export function proxy(request: NextRequest) {
  if (isValidFamilyToken(request.cookies.get(FAMILY_COOKIE)?.value)) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = {
  matcher: ["/((?!unlock|_next/static|_next/image|favicon.ico|assets/).*)"],
};
