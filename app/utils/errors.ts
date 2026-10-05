/** Extracts the user-facing message from a `$fetch` error. */
export function errorMessage(error: unknown, fallback = "エラーが発生しました"): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === "string" && data.message) return data.message;
  }
  return fallback;
}
