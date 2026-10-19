import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "cscamp_admin_session";

function getSecretKey(): string {
  const secretKey = process.env.SUPABASE_SECRET_KEY || "cscamp-default-secret";
  const adminPassword = process.env.ADMIN_PASSWORD || "1Z4N%y6&8R_p";
  return `${secretKey}:${adminPassword}`;
}

export function signSession(username: string): string {
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", getSecretKey()).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [username, timestamp, signature] = parts;
  const expectedUser = process.env.ADMIN_USER || "admin_cs_valoroso_2026";
  if (username !== expectedUser) return false;

  const time = parseInt(timestamp, 10);
  if (isNaN(time) || Date.now() - time > 7 * 24 * 60 * 60 * 1000) {
    return false;
  }

  const expectedPayload = `${username}:${timestamp}`;
  const expectedHmac = crypto.createHmac("sha256", getSecretKey()).update(expectedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}
