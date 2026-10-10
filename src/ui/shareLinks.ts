/**
 * Composer links for posting text plus a link. None of these sites takes a picture through a
 * link; the link's own preview (its og:image) is what shows up.
 */

export function xPostUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`;
}

/** LinkedIn's composer with the text filled in (the link inside it unfurls). */
export function linkedInPostUrl(text: string, url: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${text} ${url}`)}`;
}

/** Telegram takes the link and the text separately. */
export function telegramPostUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function whatsAppPostUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
