import type { Ref } from "vue";

/**
 * Turns a failed page-level fetch into the Nuxt error page (e.g. 404),
 * including refetches after the route changes.
 */
export function throwOnFetchError(
  error: Ref<{ statusCode?: number; statusMessage?: string } | null | undefined>,
) {
  const toError = () =>
    createError({
      statusCode: error.value?.statusCode ?? 500,
      statusMessage: error.value?.statusMessage,
      fatal: true,
    });
  if (error.value) throw toError();
  watch(error, (value) => {
    if (value) showError(toError());
  });
}
