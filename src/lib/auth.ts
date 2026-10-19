import "server-only";

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, signSession, verifySessionToken } from "./auth-token";

export { ADMIN_COOKIE_NAME, signSession, verifySessionToken };

export async function setAdminSessionCookie(username: string) {
  const cookieStore = await cookies();
  const token = signSession(username);

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });
}

export async function removeAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession() {
  const isValid = await checkAdminSession();
  if (!isValid) {
    throw new Error("Não autorizado. Faça login como administrador.");
  }
}
