# POST attachment handoff — design and test plan

## Reproduction
Samsung Open Source uses a POST request to `/downSrcCode` and returns a ZIP attachment (~233 MB). The existing extension only sees a browser download URL. The desktop bridge replays it as GET; the response may instead be a tiny HTML/error page.

## Current mitigation
The bridge keeps the browser's original download when a URL replay returns HTML or a small text/JSON error rather than an expected binary attachment. This is a fallback, **not POST support**.

## Required implementation
1. Capture original request method and POST body **before** the browser download event (the downloads API alone does not provide either). Investigate browser-specific webRequest APIs, their permissions, and request-body availability. Correlate request IDs to downloads; avoid guessing based on URL alone.
2. Do not forward or persist arbitrary POST bodies, cookies, or authorization tokens without explicit user consent and a defined lifetime. Enforce payload size caps, sensitive-field redaction in logs, and origin restrictions.
3. Extend the bridge protocol with a version bump and a validated, ephemeral request descriptor. Reject unsupported or uncorrelated requests and leave browser downloads untouched.
4. Extend the probe and transfer layers to support a single-request POST response streamed directly to disk. Do not replay POST to probe size and do not retry non-idempotent POST automatically.
5. Do not enable segmented Range requests for POST unless server semantics explicitly guarantee safe replay; default to one stream.
6. Keep the original browser download until the manager has safely accepted the transfer. On errors, restore browser fallback without losing the attachment.

## Regression tests
- POST returns a ZIP attachment, GET on same URL returns HTML: original browser download remains intact until POST handling is supported.
- POST returns ZIP, GET returns a 785-byte JSON/text error: same fallback.
- Normal GET attachment remains eligible for interception.
- A legitimate HTML/text download is not rejected by extension-based binary filename heuristics.
- Browser POST body unavailable or too large: no interception.
- Cross-origin requests and extension-origin validation.
- Browser and desktop version mismatch.
- Redirects, expired sessions, cancellation, retry behavior, and interrupted transfers.
- No credential or POST payload disclosure in logs, disk history, or diagnostics.

## Validation
Run TypeScript typechecks, lint, and extension build, then integration tests with a local POST fixture and real Chromium/Firefox. A real Samsung test requires a valid session and user-initiated download; do not commit session material.
