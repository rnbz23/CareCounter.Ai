/** Display-only money formatter. Never do float math on dollar amounts. */
export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "Not established yet";
  }
  const dollars = Math.floor(cents / 100);
  const remainder = Math.abs(cents % 100);
  const formatted = dollars.toLocaleString("en-US");
  return `$${formatted}.${remainder.toString().padStart(2, "0")}`;
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "Date unknown";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
