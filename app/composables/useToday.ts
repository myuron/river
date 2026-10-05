/**
 * Today's date in the browser's time zone.
 *
 * SSR can only use the server's time zone, so the server value is shared via
 * useState to hydrate without a mismatch, then replaced with the browser's
 * date once mounted (also on every later mount, so a tab left open past
 * midnight picks up the new day on navigation).
 */
export function useToday() {
  const today = useState("today", () => todayIsoDate());
  onMounted(() => {
    today.value = todayIsoDate();
  });
  return today;
}
