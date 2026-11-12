/**
 * A server-side attachment may be created by POST. Replaying its URL as GET
 * can return a success-shaped HTML/error page, rather than the original bytes.
 * Never substitute obvious error content for a browser-provided binary file.
 * This check is a safety net, not sufficient to identify all POST downloads.
 */
export function isLikelyReplayedError(
  fileName: string | undefined,
  contentType: string | null,
  totalBytes: number | null
): boolean {
  if (!fileName || !/\.(?:zip|7z|rar|tar|gz|xz|bz2|iso|exe|msi|apk|pdf)$/i.test(fileName)) {
    return false
  }
  if (/^text\/html(?:\s*;|$)/i.test(contentType ?? '')) return true
  return (
    /^(?:text\/plain|application\/(?:json|problem\+json))(?:\s*;|$)/i.test(contentType ?? '') &&
    totalBytes !== null &&
    totalBytes < 16 * 1024
  )
}
