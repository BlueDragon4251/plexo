# Projektübergabe: Plexo POST-Downloads

> **Stand:** 12. November 2026  
> **Wichtig:** Dies ist die zentrale, fortlaufend zu pflegende Übergabe für die Weiterentwicklung im Fork `BlueDragon4251/plexo`. Lies sie vor Codeänderungen vollständig und überprüfe anschließend **den aktuellen Remote-Stand**, da sich Commits, PRs und CI nach diesem Datum geändert haben können.

## 1. Auftrag und gewünschtes Endergebnis

Der Nutzer verwendet Plexo Download Manager auf Windows mit der offiziellen Browser-Erweiterung. **Ziel ist, dass auch Downloads, die durch HTTP POST entstehen, korrekt vom Browser an Plexo übergeben und dort heruntergeladen werden können** — möglichst wie gewöhnliche GET-Downloads, aber ohne kaputte Dateien oder unsichere Mehrfachausführung von POST.

Das konkrete Reproduktionsbeispiel ist ein Samsung Open Source-Archiv:
- Browser: Download von `opensource.samsung.com`.
- `POST /downSrcMPop` liefert HTML, `POST /downSrcCode` liefert die eigentliche Datei.
- Der POST zu `/downSrcCode` liefert `SM-P613_EUR_14_Opensource.zip` mit `Content-Disposition: attachment`, `Content-Type: application/octet-stream` und `Content-Length: 233492856` Bytes (~223 MiB).
- Wenn Plexo die URL mit GET wiederholt, wird stattdessen eine kurze Fehler-/HTML-Antwort beobachtet (~785 Bytes), die als ZIP gespeichert wird und sich nicht öffnen lässt.
- Browser-DevTools-Screenshots der ursprünglichen Anfrage liegen **im Chat, nicht im Repository**. Zugangsdaten/Cookies sind nicht ins Repository zu übertragen.
- Die Plexo-UI bietet `Auto`, `4`, `8`, `16`, `32` Streams an; `1` ist dort nicht auswählbar. Eine interne Single-Stream-Implementierung ist dennoch möglich.

**Akzeptanzkriterium des eigentlichen Ziels:** Eine echte POST-Attachment-Antwort wird ohne inhaltliche Veränderung über Plexo auf die Platte geschrieben, mit richtiger Dateigröße/Dateiname und erfolgreich überprüftem Hash. Normale GET-, Torrent- und NZB-Downloads dürfen nicht regressieren. Wo sichere Übernahme technisch unmöglich ist, muss der Browser die Originaldatei behalten.

## 2. Repositories, Branches, PRs (zum dokumentierten Stand)

| Zweck | Wert |
| --- | --- |
| Offizielles Upstream-Repository | `https://github.com/anmolkapil/plexo` |
| Nutzer-Fork (Schreibrechte vorhanden) | `https://github.com/BlueDragon4251/plexo` |
| Standardbranch im Fork | `main` |
| Aktiver Entwicklungsbranch | `feat/post-download-support` |
| Draft-PR **im Fork**, nicht upstream | `https://github.com/BlueDragon4251/plexo/pull/1` |
| Entwicklungsbranch-HEAD vor dieser Dokumentation | `7be596a09aee19be1033343417f163c2f87a654e` |
| Hintergrunddesign auf Feature-Branch | `docs/post-download-design.md` |

Die GitHub-Integration kann den **Fork** verändern. Ein Versuch, direkt im Upstream `anmolkapil/plexo` einen PR zu eröffnen, ergab `403 Resource not accessible by integration`. Später nach fertigen Tests den Upstream-PR gegebenenfalls über die GitHub-Weboberfläche mit `BlueDragon4251:feat/post-download-support` als Head und `anmolkapil/plexo:main` als Base eröffnen. Keine Behauptung aufstellen, er sei schon geöffnet.

**Branch-Regel:** Funktionalen Code auf `feat/post-download-support` (oder gezielten Nachfolgebranches) entwickeln. Diese Übergabe auf Fork-`main` dient der Auffindbarkeit. Den Fork-`main` nicht versehentlich mit unfertigen Feature-Commits überschreiben; nicht direkt zum Upstream mergen.

## 3. Bereits implementiert (nicht mit vollständigem POST-Support verwechseln)

Im Feature-Branch:
1. `src/main/browserBridge.ts` ruft `isLikelyReplayedError(...)` auf: Wenn ein vermeintliches Binär-Attachment bei GET-Replay als HTML oder kleine Text-/JSON-Antwort erkannt wird, antwortet die Bridge mit **Browser behalten**, statt einen kaputten Download zu übernehmen.
2. `src/shared/replayedAttachment.ts`: Testbare Prüfregel; ist bewusst eine Heuristik und erkennt **nicht alle** denkbaren Fehlerantworten.
3. `src/shared/recentPostRequests.ts`: Begrenzter In-Memory-Tracker für kürzliche POST-URLs (max. 256 Einträge / 5 Minuten), ohne Bodies oder Cookies.
4. `extension/src/background.ts`: `webRequest.onBeforeRequest` merkt sich POST-URLs und lässt einen passend erkannten `downloads.DownloadItem` im Browser, statt seine URL als GET zu übernehmen.
5. `extension/manifest.json`: Non-blocking `webRequest`-Berechtigung hinzugefügt.
6. Tests: `tests/recentPostRequests.test.mjs` (5 Fälle) und `tests/replayedAttachment.test.mjs` (5 Fälle), npm-Skript `test:post-capture` und neuer CI-Schritt in `.github/workflows/ci.yml`.
7. `docs/post-download-design.md` enthält einen frühen Architektur- und Testplan.

**Einschränkungen:** Der Tracker kann falsch-positive Treffer haben, wenn dieselbe URL in zeitlicher Nähe auch über GET geladen wird; bei Neustart des Chrome-MV3-Service-Workers geht sein Zustand verloren. `downloads.DownloadItem` besitzt keine direkt geeignete `tabId` für eine korrekte Korrelation. Der GET-Response-Guard fängt typische Fehler ab, aber keine binär aussehenden Fehlerantworten. POST wird **derzeit nicht an Plexo weitergereicht**.

**Teststatus kritisch prüfen:** Eine frühere Sitzung meldete „10 lokale Regressionstests bestanden“. Dieser Stand ist nicht gleichbedeutend mit einer bestätigten vollständigen CI/Browser-/Windows-Prüfung. Zum Zeitpunkt der letzten Statusabfrage gab es keine veröffentlichten PR-Workflow-Runs/Commit-Statuses. Vor weiteren Schritten die Tests selbst ausführen und CI/Build nachprüfen. Keine ungeprüften „fertig“-Aussagen.

## 4. Architektur – wo der nächste Chat weiterarbeiten muss

- `extension/src/background.ts`: Browser Download-Events und Übernahme-Entscheidung; nutzt `chrome.downloads.onDeterminingFilename` (Chromium) bzw. `onCreated` (Firefox). Ein Download-Event stellt keine ursprüngliche HTTP-Methode und keinen POST-Body bereit.
- `extension/src/api.ts`: Chrome/Firefox-API-Abstraktion.
- `extension/build.mjs`: Erstellt separate Chrome-/Firefox-MV3-Varianten aus `extension/manifest.json`.
- `src/shared/browserBridge.ts`: Gemeinsamer Bridge-Vertrag, `BRIDGE_API = 1`, `BridgeAddRequest`, `BridgeHandoff`.
- `extension/src/plexo.ts`: Client der lokalen Bridge.
- `src/main/browserBridge.ts`: HTTP-Bridge auf `127.0.0.1:19288..19290`, `/ping`, `/add`, `/confirm`; derzeit prüft `checked()` jedes HTTP-Angebot über `probeUrl()`.
- `src/main/download/probe.ts`: `probeUrl()` macht eine **GET**-Prüfanfrage mit `Range: bytes=0-1023` und ermittelt Metadaten.
- `src/main/download/chunkDownloader.ts`: Range-basierter GET-Transfer über `StreamConnection`, späteres Zusammensetzen.
- `src/main/download/browserContext.ts`: Sitzungsbasierte Request-Header.
- `src/main/download/downloadManager.ts`, `src/main/openLinks.ts`, `src/shared/types.ts`, `src/main/network/routes.ts`: Weitere wichtige Integrationspunkte für den tatsächlichen Single-Stream-Transfer und die UI.
- `e2e/`: Vorhandene lokale HTTP-Testserver/Playwright-Tests; für reproduzierbaren POST-Endpoint erweitern.

**Knackpunkt:** Beim POST darf `probeUrl()` nicht einfach dieselbe Anforderung als GET überprüfen. Ebenso darf ein potentiell nicht-idempotenter POST nicht unkontrolliert doppelt gestartet werden, nur um Header zu bekommen. Auch `Range`-Parallelisierung ist für POST ohne gesicherte Serversemantik nicht zulässig.

## 5. Priorisierte Aufgaben (in dieser Reihenfolge)

### Phase A – Bestehenden Fix stabilisieren
1. Remote-Fork, Branch, Draft-PR und Upstream-`main` inspizieren; prüfen, ob Upstream bereits native POST-Unterstützung oder ähnliche PRs besitzt.
2. `npm ci --ignore-scripts`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run test:post-capture` und `npm run build:extension` ausführen. Fehlende Runtime-Build-Abhängigkeiten dokumentieren, nicht als grün ausgeben.
3. Extension-Instrumentierung auf Browser-API-Kompatibilität, falsche URL-Korrelation, Umleitungen, Browser-Neustart sowie Berechtigungen prüfen. Prüfen, ob die zusätzliche `webRequest`-Berechtigung und die Erkennungsheuristik upstream vertretbar sind.
4. Tests mit lokalem Server: POST liefert gültige ZIP-Datei, derselbe GET eine 785-Byte-HTML-/JSON-Seite; GET-Download auf anderer URL bleibt übernehmbar; Browser-Fallback darf nicht zu Duplikaten oder zum Abbruch beider Kopien führen.

### Phase B – Echten POST-Download implementieren
5. Browser-spezifisch prüfen, **ob und wie** die POST-Methode, erforderliche Request-Daten, Redirect-Chain und spätere Download-Antwort ohne unsichere URL-Zeit-Heuristik zugeordnet werden können. Die `downloads`-API allein reicht nicht. Falls die benötigten Daten nicht zugänglich sind, **nicht** behaupten, vollständiger transparenter Capture sei möglich; optional explizite Benutzeraktion/„Replay as POST“ als separaten Workflow prüfen.
6. Kurze, sichere, versionierte Bridge-Anforderungsrepräsentation entwerfen; keine Body-/Cookie-Protokollierung, strenge Größenlimits und Herkunftsprüfung; Erweiterung darf keine Geheimnisse dauerhaft persistieren. `BRIDGE_API` bei inkompatibler Änderung anheben.
7. Single-Request-POST-Transferweg implementieren, der Antwortstream direkt auf Platte schreibt und Datenintegrität, Backpressure, Größenvalidierung, Abbruch, Fehler-/Redirectbehandlung und atomisches Abschließen berücksichtigt. Nicht durch vorherige Probe doppelt POSTen. Kein automatischer Retry ohne nachweisbare Wiederholbarkeit.
8. Bestehende Scheduler-/Multi-Network-Komponenten nur dann nutzen, wenn die Request-Semantik das erlaubt. Standardmäßig **ein Stream**; POST-Range-Chunking nur bei explizit verifizierter Unterstützung.
9. Handoff-Reihenfolge sorgfältig prüfen: der originale Browser-Transfer darf nicht verloren gehen, wenn Plexo die Aufgabe nicht tatsächlich übernehmen kann. `/add`-`/confirm`-Vertrag bei Bedarf angepasst und versioniert ändern.

### Phase C – Abnahme und Upstream
10. E2E-Tests für POST-Transfer plus GET-/Torrent-/NZB-Regressionen und realen Windows-Test mit Chromium und, soweit möglich, Firefox.
11. Mit gültiger Samsung-Sitzung manuell testen (nicht öffentliche Cookies/POST-Body einchecken!). Dateigröße und SHA-256 der Browser- und Plexo-Datei vergleichen. **Nicht** allein auf den korrekten ZIP-Dateinamen vertrauen.
12. Clean Build, CI und aktuelle Diff-Review; Branch/PR sauber strukturieren. Ein fokussierter Fix-PR (Fallback) und ein späterer Feature-PR (vollständiger POST-Transfer) können upstream leichter reviewbar sein als eine riesige Vermischung.
13. Sobald ausreichend validiert, upstream PR über GitHub-Weboberfläche eröffnen, wenn die Integration weiter 403 meldet. Ggf. für umfangreiche Änderung vorher Upstream-Issue nach `CONTRIBUTING.md` eröffnen.

## 6. Befehle zur Wiederaufnahme

```bash
git clone https://github.com/BlueDragon4251/plexo.git
cd plexo
git remote add upstream https://github.com/anmolkapil/plexo.git
git fetch origin
git fetch upstream
git switch --track origin/feat/post-download-support

# Node >= 22.13, npm >= 9
npm ci --ignore-scripts
npm run test:post-capture
npm run lint
npm run typecheck
npm run format:check
npm run build:extension

# Für echte Electron-/E2E-Tests: vollständige native Abhängigkeiten
npm ci
npm run test:e2e:smoke
```

Bei einem verbundenen GitHub-Connector direkt Repository/Branch lesen statt den Nutzer erneut um einen Link/ZIP zu bitten. Die benötigten Dateien liegen im Fork. Bei abweichendem Remote-HEAD zuerst den tatsächlichen Stand rekonstruieren und die Dokumentation aktualisieren.

## 7. Regeln für Weiterarbeit

- **Keine Rückfrage nach bereits vorhandenen Angaben.** Repository, Branch, PR, Reproduktion und Ziel stehen hier.
- Arbeite möglichst autonom: Code prüfen → implementieren → testen → Branch pushen → Draft-PR aktualisieren → Übergabedokumentation aktualisieren.
- Saubere, kleine Commits und keine unbestätigten „Tests grün“-/„vollständig implementiert“-Behauptungen.
- Keine Änderung an Upstream-`main` ohne PR; nicht den Fork-`main` unabsichtlich mit unfertigem Code mergen.
- **Keine** echten Cookies, Authorization-Header, Tokens, POST-Bodies, Browser-Profile oder privaten Sitzungsdaten in Git, Tests, CI-Logs oder PR-Kommentaren.
- Immer am Ende dieses Dokuments ergänzen: Datum, letzter funktionierender Commit, Testresultate, offene Blocker und nächste konkrete Aktion.

## 8. Letzter bekannter Stand / Fortschrittslog

**2026-11-12** — Fork und Branch `feat/post-download-support` existieren; Draft-PR #1 im Fork eröffnet; fehlerhafte URL-Replays teilweise abgefangen; POST-Erkennungsheuristik implementiert; 10 Unit-Testfälle vorhanden. **Echte POST-Transfers fehlen.** Der Versuch eines direkten Upstream-PRs ergab 403. Dieses Dokument und die Einstiegsdatei `AGENTS.md` wurden für chatübergreifende Übergabe auf Fork-`main` angelegt.

**Nächste konkrete Aktion:** Zunächst CI/Typecheck/Extension-Build und die POST-URL-Korrelation im Feature-Branch validieren; anschließend einen mit lokalem Testserver abgesicherten, echten POST-Transferpfad implementieren. Nicht bei reiner Planung stehen bleiben.
