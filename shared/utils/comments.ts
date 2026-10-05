import { isBlank } from "./text";

type ParseResult =
  | { ok: true; value: { author: string | null; body: string } }
  | { ok: false; message: string };

/** Body is required and kept as typed (multi-line); a blank author becomes null (匿名). */
export function parseCommentInput(raw: { author?: unknown; body?: unknown } | null): ParseResult {
  const body = raw?.body;
  if (typeof body !== "string" || isBlank(body)) {
    return { ok: false, message: "コメントを入力してください" };
  }
  const author = raw?.author;
  if (author !== undefined && author !== null && typeof author !== "string") {
    return { ok: false, message: "投稿者名が正しくありません" };
  }
  return { ok: true, value: { author: isBlank(author) ? null : (author as string).trim(), body } };
}
