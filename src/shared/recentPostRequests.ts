/**
 * The downloads API exposes only the URL, not the method that produced a file.
 * Remember just recent POST URLs while the extension background process is alive.
 * This is intentionally conservative: when in doubt we leave the download in the
 * browser rather than replaying its URL as GET and writing an error response.
 *
 * No request bodies, cookies or headers are retained here.
 */
export class RecentPostRequests {
  private readonly samples: { url: string; at: number }[] = []
  private static readonly MAX_AGE_MS = 5 * 60_000
  private static readonly MAX_SAMPLES = 256

  note(url: string, at = Date.now()): void {
    this.prune(at)
    this.samples.push({ url, at })
    if (this.samples.length > RecentPostRequests.MAX_SAMPLES) this.samples.shift()
  }

  /**
   * The POST can precede the downloads event by some time (server processing and
   * redirect chains). We have no request ID in DownloadItem, so this check never
   * authorizes a takeover — it can only prevent one.
   */
  shouldKeepInBrowser(
    download: { url: string; finalUrl?: string; startTime?: string },
    now = Date.now()
  ): boolean {
    this.prune(now)
    const started = download.startTime ? Date.parse(download.startTime) : NaN
    const earliest = Number.isFinite(started)
      ? Math.max(now - RecentPostRequests.MAX_AGE_MS, started - 30_000)
      : now - RecentPostRequests.MAX_AGE_MS
    return this.samples.some(
      ({ url, at }) =>
        at >= earliest &&
        at <= now &&
        (url === download.url || (download.finalUrl !== undefined && url === download.finalUrl))
    )
  }

  private prune(now: number): void {
    while (this.samples.length && now - this.samples[0].at > RecentPostRequests.MAX_AGE_MS) {
      this.samples.shift()
    }
  }
}
