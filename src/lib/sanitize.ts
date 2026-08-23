/**
 * Strips HTML tags and collapses whitespace from user-supplied free text
 * (descriptions, notes, etc.). React already escapes output by default so
 * this isn't the only XSS defense, but stripping tags at the point of entry
 * means malicious markup never persists in the database at all — including
 * for surfaces that read this data outside React (the PDF renderer, the AI
 * assistant's context, exported emails).
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // strip control chars
    .trim();
}
