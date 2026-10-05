export default defineEventHandler(async (event) => {
  await destroySession(event);
  return { user: null };
});
