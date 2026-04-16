export function resolveImageUrl(url?: string) {
  const FALLBACK = "/assets/images/loq.jpg";
  if (!url) return FALLBACK;

  // If absolute URL already, return as-is (supports protocol-relative too)
  if (/^https?:\/\//i.test(url) || /^\/\//.test(url)) return url;

  const base = typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:8080";

  // If url starts with '/', join directly; otherwise ensure a slash between
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}
