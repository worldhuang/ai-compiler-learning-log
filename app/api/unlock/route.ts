import { NextResponse } from "next/server";
import { COOKIE_NAME, createAccessToken } from "../../access-token";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const configuredPassword = process.env.PLAN_ACCESS_PASSWORD;
  const token = await createAccessToken();
  if (!configuredPassword || !token || password !== configuredPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
