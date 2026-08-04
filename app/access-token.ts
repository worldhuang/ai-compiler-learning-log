export const COOKIE_NAME = "ai_compiler_access";

export async function createAccessToken() {
  const secret = process.env.PLAN_COOKIE_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("ai-compiler-learning-log"));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}
