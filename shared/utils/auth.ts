import { normalizeRequiredText } from "./text";

export const MIN_PASSWORD_LENGTH = 8;

// Deliberately loose: something@domain.tld, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

type SignupResult =
  | { ok: true; value: { name: string; email: string; password: string } }
  | { ok: false; message: string };

export function parseSignup(
  raw: { name?: unknown; email?: unknown; password?: unknown } | null,
): SignupResult {
  const name = normalizeRequiredText(raw?.name);
  if (!name) return { ok: false, message: "表示名を入力してください" };
  const email = normalizeEmail(raw?.email);
  if (!email) return { ok: false, message: "メールアドレスを入力してください" };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "メールアドレスの形式が正しくありません" };
  }
  const password = raw?.password;
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください` };
  }
  return { ok: true, value: { name, email, password } };
}

/** Login input; null when either field is missing. */
export function parseCredentials(
  raw: { email?: unknown; password?: unknown } | null,
): { email: string; password: string } | null {
  const email = normalizeEmail(raw?.email);
  const password = raw?.password;
  if (!email || typeof password !== "string" || password === "") return null;
  return { email, password };
}

/** Only same-site absolute paths; anything else (other hosts, "//x", "/\x") becomes "/". */
export function safeRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/\\")) return "/";
  return value;
}
