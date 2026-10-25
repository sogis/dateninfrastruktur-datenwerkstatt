# Implementierungsstatus

Stand 4. Oktober 2026. **V1 ist nicht abgenommen.** Git-Basisrevision: `0535d2f`; Implementierung im uncommitteten Arbeitsbaum. P2-Fingerprint und früherer Nachweis bleiben unter [verification/code-fingerprint.json](verification/code-fingerprint.json) erhalten; der historische P3-Stand hat Code-Fingerprint `7e74e6f81eeb7f678990f851b7fe3f148f2968c2f738729fc2c9ec4879cb9c3c` (108 Dateien; [Inventar](verification/code-fingerprint-p3.json)). Quellportal `6b45fc4e22116fba8fc00bd48175e347aa740562` nur gelesen. Keine Veröffentlichung.

Aktueller Phasenstand: **P0–P8 technisch abgenommen für die dokumentierte Testkonfiguration, einschliesslich echtem Safari-Pilot und vollständigem Safari-Neustart. Produktive Portal-/Ingresskonfiguration und Veröffentlichung bleiben offen; keine Produktionsfreigabe.** Die folgenden Abschnitte bewahren den zeitlichen Prüfverlauf; spätere Gate-Nachweise ersetzen frühere offene Zwischenstände.

## P0 — Integrationsspikes bestanden

REQ-002/006/007/008/039/049/056/077/079; AT-001/002/046 als Integrationsgrundlage, keine pauschale vollständige Produktabnahme. Implementiert: gepinnte Toolchain/Lockfile, selektiver SQLRooms-Connector, lokale WASM-/Extension-/webR-Assets, Parserguard, echte Engine-/Speicher-/Lock-Spikes, unveränderte übernommene Regressionen. Dateien: `src/infrastructure/sqlrooms/`, `tests/spike/`, `tests/integration/p0.spec.ts`, `tests/baseline/`, `scripts/`, [BASELINE.md](BASELINE.md), [MIGRATION_MATRIX.md](MIGRATION_MATRIX.md), [DEPENDENCIES.md](DEPENDENCIES.md).

Reale Ergebnisse: CSV→Parquet→Arrow erhält führende Nullen, 350 Randomzeilen bleiben stabil; SQL-Worker wird bei Bedarf wirklich beendet, neuer Connector funktioniert. webR bindet Dataframe, berechnet Summe 11, erzeugt echte Plotpixel, beendet PostMessage-Worker und startet neu. OPFS-Schreib/Lese/Löschprobe, echte Dexie-Transaktion und Writer-Lock über zwei Tabs bestehen in drei Browsern. Die späteren Produktpfade und Epoche-/Ressourcenprüfungen bleiben eigene Gates.

Nachgewiesene Randbedingungen und Entscheidungen: [ADR-001](adr/001-gepinnte-engine-grenzen.md), [ADR-002](adr/002-webkit-opfs-testprofil.md). Original-SVG übernommen, Systemfonts. Produktive Portal-URLs fehlen; synthetische Fixtures bleiben Testdaten. Kuratierter R-Paketspiegel, vollständige Lizenzinventur und Dependency-Sicherheitsbewertung noch offen.

## P1 — Metadatenpfade implementiert und geprüft

REQ-008–020/034/035/060–063 teilweise; AT-003–007/011/012/054/057. Implementierte Dateien: `src/domain/`, `src/application/workspaceService.ts`, `persistenceCoordinator.ts`, `src/infrastructure/storage/`, `src/infrastructure/browser/workspaceLock.ts`, `src/infrastructure/monaco/`, `src/app/`, `src/features/workspaces/`, `src/state/`, `src/ui/`, `tests/unit/workspace.test.ts`, `tests/integration/repository.spec.ts`, `tests/e2e/workspaces.spec.ts`.

Echte Produktpfade: Workspace erstellen/öffnen/umbenennen/Beschreibung; SQL/R-Analyse erstellen, bearbeiten, getrennte Undo-Modelle, duplizieren und archivieren; Reload; kontrollierte falsche IDs; strikte Schemas/Referenzen/Unveränderlichkeit; CAS; generationssicherer Autosave; zweiter Tab lesend und Lock-Reacquire; Einstellungen. Keine Engine wird durch Projektliste/Editor geöffnet. Gemessen bei 1440×900: Header 56 px, Sidebar 52 px; Editorbreite und 1280×800-Überlauf geprüft. Voller SQL-/R-Flächenvertrag mit Ergebnissen ist noch nicht abgenommen.

DuckDB wird inzwischen im echten Dateiimport/-lesepfad verwendet (P2 unten); webR weiterhin nur im separaten Spike. Seit P3 sind SQL-Ausführung und Resultate im Produkt verfügbar; R-Ausführung bleibt offen. AT-007 enthält echten Transaktionsrollback und unbekannte Formatversion; vollständige Evolution/Migration bleibt spätere Arbeit. P1-Metadaten sind nutzbar, gesamter V1-Gateumfang bleibt offen.

## Tatsächlich ausgeführte Befehle

| Befehl | Exit | Ergebnis |
|---|---:|---|
| `git status --short --branch`, `git log -5 --oneline`, Quellenprüfung | 0 | Sauberer Ausgangsbaum, Baseline exakt identifiziert |
| `node --version`, `npm --version` | 0 | 22.23.1 / 11.18.0 |
| `npm install` / später `npm ci` | 0 / 0 | Reproduzierbare Installation; Auditmeldungen bleiben offen |
| `npm run assets:prepare` | 0 | Lokale Assets, Extension-Hashes geprüft |
| `npx playwright install chromium firefox webkit` | 0 | Browser installiert |
| `npm run typecheck` zuerst | 2 | Dynamischen webR-Importtyp korrigiert |
| `npm run test:unit` zuerst | 1 | SQLRooms ESM benötigt Vitest-Inlining; korrigiert |
| frühe `npm run test:integration` | 1 | MVP-Parserfehler/R-Grafikfehler nachgewiesen; ADR-001 |
| erste Browsermatrix | 1 | 20 bestanden, WebKit-OPFS im flüchtigen Profil fehlgeschlagen; ADR-002 |
| `npm run test:browser-matrix` nach Profilkorrektur | 0 | **27 bestanden**, echte Chromium-/Firefox-/WebKit-Integrationen |
| frühe `npm run test:e2e` | 1 | Textarea-Label, Monaco EditContext/Highlight-Dispose, Save-Abwarten korrigiert |
| `npm run test:e2e` zuletzt | 0 | **5 bestanden**, inkl. Reload, Undo, zwei Tabs, Geometrie |
| `npm run typecheck && npm run test:unit` zuletzt | 0 | **24 Unit-/Regressionstests bestanden** |
| `npm run verify` P1 | 0 | TS, Lint/Grenzen, 24 Unit, Build, 9 Chromium-Integration, 5 E2E bestanden |
| `python3 tools/verify-package.py --report docs/verification/specification-check.json` | 0 | Spezifikations-/Fixturekonsistenz; kein Engineersatz |
| `npx tsc -p contracts/tsconfig.json` | 0 | Eigene Verträge strikt geprüft |
| `npm audit --json` | 1 | 8 Befunde: 5 moderate, 3 high; Bericht eingecheckt |

Browser: Chromium 153.0.8010.12, Firefox 155.0, Playwright-WebKit 26.6; macOS 27.0.1. Tatsächlich gemessene Engines: DuckDB `v1.5.4`, `R version 4.6.0 (2026-04-24)` über webR 0.6.0/PostMessage. Tests starten frische Profile. Safari-Pilot **nicht ausgeführt**. Build meldet grosse JS-Chunks; Aufteilung bleibt P7-Arbeit. `verify` enthält nur bisher implementierte Tests und bedeutet ausdrücklich keine vollständige V1-Abnahme.

Der bestehende Spezifikationsprüfer ignoriert jetzt generierte Dependency-/Buildverzeichnisse, damit fremde npm-README-Links/JSON/Fonts nicht als Teile des Spezifikationspakets gewertet werden. Requirements, Goldenwerte, Fixtures und Akzeptanzszenarien unverändert.

## P2 — lokaler Datenpfad implementiert; phasenübergreifende Gates offen

REQ-014/017/018/020/022/024–027/028/039/059 teilweise; AT-008–010/013/014/016/018–020/024 sowie Artefaktteil von AT-061.

Implementierte Dateien: `src/application/datasetService.ts`, `importPorts.ts`, `storagePorts.ts`, `persistenceCoordinator.ts`, `src/infrastructure/storage/artifactStore.ts`, `memoryRepository.ts`, `src/infrastructure/sqlrooms/fileImportEngine.ts`, `src/infrastructure/browser/capabilities.ts`, `runtimeConfig.ts`, `src/features/data/DataSection.tsx`, `src/app/download.ts`, `public/runtime-config.json`, `tests/unit/publication.test.ts`, `tests/integration/imports.spec.ts`, `tests/e2e/imports.spec.ts`.

Gelieferte Funktionen:

- Dateiauswahl/Drop für jeweils eine CSV/Parquetdatei; 200-Zeilen-Vorschau, sichtbarer Typvorschlag, Spalten-/Typkorrektur, Separator/Kopfzeile/Dezimalzeichen/NULL-Vertrag, explizite Bestätigung. Identifikatoren und führende Nullen bleiben VARCHAR; volle strikte Prüfung vor Veröffentlichung. Original-CSV standardmässig zusätzlich gesichert.
- CSV → echtes DuckDB → kanonisches Parquet; Parquetbytes unverändert übernehmbar. Datenansicht und vollständiger Parquet-Download aus gesicherten Bytes. Echte Fixture-Parquetgenerierung im Test; ursprüngliche Importdatei bleibt unverändert und kann vor Prozessneustart entfernt werden.
- Inkrementelles SHA-256, begrenzte OPFS-Schreib-/Prüfströme, neue appgenerierte Artefaktpfade, Datei schliessen/verifizieren vor kurzer CAS-Metadatentransaktion. Keine sichtbare Teilmutation bei Quota-/Commitfehlern. Änderungen im Editor während Publication bleiben erhalten.
- Eindeutige SQL-Aliase, unabhängig änderbarer Anzeigename, versionierter Ersatz mit sichtbarem Schema-Diff und Tombstones. Historische Versionen werden nicht überschrieben.
- Echte IndexedDB-/OPFS-Capabilityprobe. Bei Fehlern explizit bestätigter vollständiger Memory-Modus mit permanentem „Nur diese Sitzung“ und gleichen Importbudgets. Ohne Web Locks keine neuen persistenten Projekte; vorhandene Projekte nur lesend.
- Artefaktinventar, fehlende Dateien sichtbar, Hashprüfung vor Wiederverwendung, eigene Orphans nach bewusster Aktion unter Writer-Lock bereinigbar. Neue Importoperationen sind während Bereinigung gesperrt; fremde OPFS-Dateien bleiben bestehen.
- Ein tatsächlicher SQLRooms/DuckDB-Worker im Importpfad über Unterrouten; Freigabe beim Workspacewechsel. Probe zählt echte `INSTANTIATE`-Nachrichten und Workerende, weil SQLRooms einen Blob-Worker verwendet.

Zusätzliche tatsächlich ausgeführte Befehle:

| Befehl | Exit | Ergebnis |
|---|---:|---|
| `npm install --save-exact @noble/hashes@2.0.1` | 0 | MIT-Lizenz, Exports/Types geprüft und dokumentiert |
| erste P2-Importtests | 1 | ICU-Extension fehlte; lokal spiegeln und Hash fixieren |
| `npm run assets:prepare` mit ICU | 0 | 4 Extensions für MVP/EH, alle Hashes geprüft |
| P2-Unit-/Import-/E2E-Läufe nach Implementierung | 0 | Publication/Faults, Werte/NULL/Leerstring, späte Typfehler, temporärer Modus |
| erstes `npx playwright test` ohne Pfadfilter | 1 | Vitest-Dateien fälschlich entdeckt; Playwright auf `*.spec.ts` eingegrenzt |
| erste erweiterte 63-Fälle-Matrix | 1 | 59 bestanden; Browserprofil-/Tastatur-/Workerereignisannahmen korrigiert |
| gezielte Firefox/WebKit-Prüfungen nach Korrektur | 0 | Native User-Agents, echtes Undo bis Ausgangscode und Redo, gleiche Geometriewerte |
| gezielte reale SQL-/R-Abbrüche in 3 Browsern | 0 | 6 bestanden; Worker-close wird tatsächlich und begrenzt abgewartet |
| erster P2-Verify-Lauf / Diagnosematrix | 1 / 130 | Workerzählung per URL ungeeignet für Blob-Worker; Matrix zur Diagnose unterbrochen, kein Pass |
| `npm ci` zuletzt | 0 | Aktuelles Lockfile mit Hashbibliothek frisch installiert |
| `npm run verify` zuletzt | **0** | **28 Unit-/Regressionstests, Build, 14 Chromium-Integrationstests, 9 Chromium-E2E-Tests**, TypeScript/Lint/Grenzen bestanden |
| `npx playwright test --reporter=list,json` zuletzt | **0** | **69 bestanden**, 0 übersprungen, 0 flaky: je 23 Fälle in Chromium/Firefox/WebKit |
| `python3 tools/verify-package.py --report docs/verification/specification-check.json` | 0 | Spezifikation/Fixtures unverändert konsistent |
| `npx tsc -p contracts/tsconfig.json` | 0 | Strikte Vertragsprüfung |
| `cmp` der übernommenen Mapper-/Querydateien samt Tests gegen Baseline | 0 | Alle vier Dateien bytegleich |
| `git diff --check`, erneuter `git status` im Quellportal | 0 | Kein Whitespacefehler; Portal unverändert und sauber |

Nachweise: [Verify-Log](verification/verify-p2.log), [Installationslog](verification/npm-ci-p2.log), [Browsermatrix samt Engine-Proofs](verification/browser-matrix-p2.json), [Browserlog](verification/browser-matrix-p2.log), [Monaco-/Browserbefunde](verification/monaco-browser-findings.json). Editor-Screenshots liegen für alle drei Browser in `docs/verification/editor-*.png`. Testgoldenwerte und Spezifikationsfixtures wurden nicht geändert; kein Test wurde gelöscht oder übersprungen. Angepasst wurden nachweislich falsche Annahmen zu Testentdeckung, OS-Tastenkürzeln, Undo-Gruppierung und asynchron zugestellten Worker-/Lock-Ereignissen.

Offene P2-Gateteile: Schedulerbindung des Datenersatzes und verspätete SQL/R-Antworten (P3/P5), Fehler beim Ergebnis-Keep, kompletter Grenz-/Typkorpus, vollständige Recovery/Archivfälle und Leistungs-/RAM-Benchmark. Die Tabellenansicht ist eine Vorschau, kein bereits implementiertes SQL-Resultatpaging. Dialog-Fokusvertrag und verteilte P7-Gates bleiben offen.

## P3 — SQL-Datenpfad implementiert und mit echten Engines geprüft

REQ-035–048 und SQL-Anteile REQ-058/059/062–064; AT-021–032/049/050/055/058 mit den unten genannten Grenzen. Dateien: `src/application/analysisService.ts`, `scheduler.ts`, `sqlPorts.ts`, `workspaceService.ts`, `datasetService.ts`, `src/domain/run.ts`, `src/infrastructure/sqlrooms/runtime.ts`, `sqlEngine.ts`, `queryGuard.ts`, `src/infrastructure/storage/viewState.ts`, `src/features/sql/`, `src/ui/CodeEditor.tsx`, `src/app/`, `tests/integration/sql.spec.ts`, `tests/integration/sql-lifecycle.spec.ts`, `tests/e2e/sql.spec.ts`, `tests/unit/run.test.ts` und der echte Browserharness `tests/spike/sqlHarness.ts`.

- Ein sessioneigener SQLRooms-Connector dient Dateiimport, Versionstabellen, verwalteten `data.*`-Views, SELECT-Ausführung, Resultatpaging und Export. Engineoperationen sind serialisiert, der Anwendungsscheduler verhindert Mehrfachklick-Queues und überlappende schreibende Jobs. Bestätigte Importdateien werden aus dem Staging-Speicher freigegeben; erneute Bestätigung desselben Schlüssels bleibt idempotent.
- SQL-Analyseparameter sind typisiert und separat gebunden. Snapshot von Code/Revision/Parametern und allen aktuellen DatasetVersion-IDs erfolgt vor asynchroner Arbeit. Der Drei-Tabellen-Goldenpfad mit `jahr=2024` stimmt unverändert mit der Fixture überein, während im Editor danach anderer Code und Parameter stehen.
- Run-Zustände sind explizit; terminale Übergänge sind einmalig, `cancelling → succeeded` ist verboten. Default 30 Sekunden Timeout; `cancelSent()` wird versucht und nach 2000 ms Grace wird der echte Worker beendet. Epochwechsel invalidiert alte Handles. Tests prüfen Worker-Termination, keinen späten Erfolg, leere Resultatliste des abgebrochenen Laufs und anschliessend `SELECT 7` in der neuen Runtime. Eine künstlich nie antwortende cancelSent-API prüft den Grace-Fallback separat. Abbruch direkt nach fertig berechneter CTAS räumt die noch unveröffentlichte private Relation auf; Cleanup läuft nur in der weiterhin aktuellen Runtime, nie gegen den bereits beendeten Worker.
- DuckDB-AST-Guard mit erlaubten SELECT/CTE/Join/Window/Subquery/UNION-Knoten, Quellen und Funktionen. Fremde Reader, dynamische SQL-Funktionen, Mehrfachstatements, DDL/DML und reservierte Tabellen werden abgelehnt. Benannte Parameter benötigen im gepinnten Build eine geprüfte Anpassung: [ADR-003](adr/003-benannte-sql-parameter.md). Keine Wertekonkatenation und kein verlustbehafteter AST-JSON-Rundlauf.
- Benutzerquery wird einmal in eine private, begrenzte Relation materialisiert. N+1 ermittelt ausschliesslich die Überschreitung des App-Limits; keine unbeschränkte Gesamtzählung. Arrow-Bytebudget wird vor Publikation geprüft. Ein stabiler Ordinal erhält Reihenfolge/Tie-Breaker; Paging (100, höchstens 500) und numerische Sortierung verwenden das vorhandene Resultat. Alle 350 Randomwerte bleiben nach Seitenwechseln und interner Parquet-Wiederherstellung identisch; der Nutzer-Parquetexport hat nach echtem Reimport ebenfalls 350 Zeilen und keine technische Ordinalspalte. BIGINT/DECIMAL bleiben exakt, NULL ist von Leerstring unterscheidbar. Doppelte Spaltennamen werden deterministisch normalisiert und mit Originalnamen dokumentiert.
- Aufbewahren schreibt neue interne Parquetbytes samt Ordinal, prüft Hash/Datei und committet erst danach Materialisierung. Nutzer-CSV, Parquet und Arrow enthalten keine technische Ordinalspalte. Ergebnis als Datensatz übernimmt alle Zeilen und eine neue Version mit Resultatherkunft. Reload stellt kept-Resultate wieder her; temporäre Vorläufer werden ausdrücklich unavailable. Recovery markiert vorher aktive Läufe interrupted; vollständige Crash-/Mehrtabmatrix bleibt P6.
- Bar/Line/Scatter mit X/Y/Kategorie, expliziter X-Sortierung für Line, NULL-Lücken, 5000-Punkt-/100-Kategoriegrenzen und PNG-Export. Speichern erzwingt vorheriges Keep. Ein injizierter Keep-Metadatenfehler veröffentlicht weder kept-Resultat noch Diagramm; der vorherige Resultatstand bleibt nutzbar. Im echten Canvas sind zwei Balken in Ergebnisordnung und die unterbrochene Linie bei NULL geprüft; PNG enthält tatsächliche Plotpixel. Der Canvas wurde auch visuell geprüft ([Chromium-PNG](verification/sql-line-null-gap-chromium.png)).
- Kompakte SQL-Arbeitsfläche mit Run-Auswahl/Status/Snapshotdetails, Parameter-Tabelle, Ctrl/Cmd+Enter und Save, Resultatauswahl und tastaturbedienbarem vertikalem Splitter. Layout liegt separat in `workspaceViews` und verändert keine fachliche Workspace-Revision.

### Tatsächlich ausgeführte P3-Befehle und Fehlerkorrekturen

| Befehl / Check | Exit | Nachweis |
|---|---:|---|
| Arbeitsbaum-/Toolchain-/Quellbaselineprüfung, Lesen P3-Verträge/Abnahmen und installierter DuckDB-Typen | 0 | Bestehenden uncommitteten Stand ergänzt; Portal weiter unverändert |
| Erste reale Prepared-Parameter-Proben | 1 | Benannte Binderwerte fehlten; Positionstokens nötig. AST-JSON-Rundlauf scheiterte am uint64-Sentinel. ADR-003 |
| Erste erweiterte SQL-Tests | 1 | Fehlende freigegebene AST-Typinfos/Sortierknoten ergänzt; numerische Sortierung auf qualifizierte Quellspalte korrigiert |
| Erste SQL-UI-Tests | 1 | Handle-Veröffentlichungsrennen korrigiert; Testtext auf konsistente `innerText`-Abfrage korrigiert |
| `npx playwright test --project=chromium tests/e2e/sql.spec.ts tests/integration/sql.spec.ts` | 0 | 8 echte SQL-/UI-Fälle bestanden |
| `npm run typecheck`, `npm run lint`, `npm run test:unit` | 0 | Strikte Grenzen; zuletzt 30 Unit-/Regressionstests einschliesslich Run-Terminalität |
| `npm run verify` | **0** | **30 Unit, Build, 22 Chromium-Integration, 12 Chromium-E2E**, TypeScript und Lint/Grenzen bestanden; [Log](verification/verify-p3.log) |
| Erste ergänzende Canvas-Prüfung | 1 | Test sammelte mehrere StrictMode-Renderframes; Recorder auf jeweils den aktuellen echten Frame begrenzt, Sollwerte unverändert |
| Browsermatrix vor letztem Cleanup-Härtungsschritt | 0 | 93 Fälle plus 6 ergänzende Lifecycle-/Canvasfälle, jeweils in Chromium/Firefox/WebKit |
| `npx playwright test --reporter=list,json` zuletzt | **0** | **102 bestanden**, 0 skipped, 0 flaky: je 34 Fälle in Chromium/Firefox/WebKit; [Matrix](verification/browser-matrix-p3.json), [Log](verification/browser-matrix-p3.log) |
| `python3 tools/verify-package.py --report docs/verification/specification-check-p3.json`, `npx tsc -p contracts/tsconfig.json` | 0 | Spezifikation/Fixtures/Verträge unverändert konsistent |
| `cmp` der vier Baseline-Mapper-/Querydateien samt Tests | 0 | Bytegleich mit dem unveränderten Quellportal |
| `git diff --check`, Quellportal-Status/-Revision | 0 | Kein Whitespacefehler, Quellportal sauber bei `6b45fc4e22116fba8fc00bd48175e347aa740562` |

Tatsächlich gestartete Browser: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6 ([Versionsnachweis](verification/browser-versions-p3.json)). Der WebKit-Nachweis ist kein tatsächlicher Safari-Pilot. Der Build meldet weiterhin grosse JS-Chunks (ca. 4,45 MB / 1,17 MB gzip); Produktionsaufteilung bleibt P7.

Die bisherige P1-Geometrieprüfung erwartete die gesamte Nutzfläche als Editor. Mit der in P3 geforderten Resultatfläche misst derselbe Test fachlich korrekt **Editor + Resultat** (mindestens 675 px bei 1440×900); Header-/Sidebar-/Breitengrenzen bleiben unverändert. Es wurden keine fachlichen Goldenwerte, Requirements oder Abnahmetests verändert, keine Tests gelöscht oder deaktiviert.

Offene P3-übergreifende Prüfungen: R-Parameteranteil von AT-025, vollständige Dialog-/R-Tastatur- und Viewzustände AT-055/058, fremde R-Laufantworten/Scopes, alle Crash-/Quota-/Cancel-Faultzeitpunkte und kompletter Typrundlauf. Die Resultatgrenze ist eine Schutzgrenze, kein RAM-Versprechen. Details pro Szenario in [ACCEPTANCE_STATUS.md](ACCEPTANCE_STATUS.md).

## Planungsstand nach P3 — historischer Zwischenstand

Nächster konkreter Abschnitt ist **P4**: ExploreContext-v4-Adapter auf die drei dokumentierten Portalendpunkte, freigegebene Origins und `current`-Auflösung; danach ein echter öffentlicher Parquet-/lokaler CSV-Join mit Fixture-HTTP-Server, expliziter Vorschau und `/open`-History-Replacement. Verträge und betreffende Abnahmen wurden gelesen; produktive Portal-URLs werden nicht erfunden.

Noch nicht implementiert bzw. nicht ausgeführt: Portaladapter/Deep-Link, produktive webR-Ausführung und SQL→R→SQL-Transfer, vollständiger Typrundlauf, Archivimport/-export/ID-Remapping, vollständige Recovery-/Mehrtab-/Faultmatrix, R-UI-Flächenvertrag, Container/Unterpfad/Headers, Leistungsprüfung, tatsächlicher Safari-Pilot und AT-072. Kuratierter R-Paketspiegel, Lizenzinventur und die acht bekannten Dependency-Auditbefunde bleiben offen. **Kein Releasebericht, keine V1-Fertigmeldung.**

## P4 — Portalpfad (Prüfverlauf, Gate bestanden)

REQ-028–033/036/060/071/072; AT-033–039/056. Implementiert: `src/infrastructure/catalog/ExploreContext.ts` (v4-Vertrag aus Baseline), `portal.ts`, `src/application/catalogPorts.ts`, Erweiterungen an Dataset-/WorkspaceService und SQL-Quellenbindung, `src/features/catalog/PortalImport.tsx`, `/open`, Referenz-/Sichern-Aktionen im Datenbestand. Keine Änderung am Quellportal, keine neue Dependency.

Portalbasis, drei Endpunktformen, URI-Segmente, relative Datei-/kanonische URLs, konkrete Current-Issue-ID, optionaler statischer Index und indexloser URL-/ID-Einstieg. Fremde Runtime-/Paket-/Katalogdaten werden validiert, aber nicht in die Appkonfiguration übernommen. Fetch ohne Credentials/Redirects, Origin-/Schema-/Userinfo-/Queryprüfung, begrenzte JSON-/Parquetantworten, MIME-/CORS-/404-Fehler. V1 lädt öffentliche Dateien kontrolliert vollständig innerhalb des Importbudgets; es wird kein Range-Performanceversprechen gemacht. Der synthetische HTTP-Server unterstützt und testet zusätzlich echtes 206/Range. Quellen werden auch bei gecachter DuckDB-Relation erneut per Hash/ETag geprüft. Lokales Sichern schreibt eine neue unveränderliche Version samt Hash.

Tatsächlich ausgeführt: `npm run typecheck` Exit 0, `npm run lint` Exit 0; erster P4-Playwright-Aufruf Exit 1 vor Teststart (Node-JSON-Importattribut fehlte), korrigiert; gezielter Chromium-Lauf Exit 0, drei neue echte HTTP/Engine/E2E-Tests bestanden. `npm run verify` und Dreier-Browserprüfung laufen; noch kein P4-Gate-Pass und P5 noch nicht begonnen. Produktive Portal-URL bleibt externe Betreiberabhängigkeit; der Testprovider wird ausschliesslich durch Tests injiziert.

**P4-Gate bestanden, danach P5 begonnen.** Letzter unveränderter Prüfstand: [Code-Fingerprint P4](verification/code-fingerprint-p4.json), Basisrevision `0535d2f`, uncommitteter Zielbaum. `npm run verify` Exit **0**: 30 Unit-/Regressionstests, Build, 24 Chromium-Integrationen, 13 Chromium-E2E; TypeScript/Lint/Grenzen ebenfalls 0. `npx playwright test tests/integration/portal.spec.ts tests/e2e/portal.spec.ts --reporter=list,json` Exit **0**, **9/9 bestanden**, je drei in Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6. Keine Skips/Retry-Flakys. [Befehle](verification/commands-p4-gate.json), [Verify](verification/verify-p4-gate.log), [Matrix](verification/browser-portal-p4-gate.json).

Zwischenstände: Verify zunächst Exit 1 wegen zusätzlicher Schliessen-Navigation nach erfolgreichem Deep Link; korrigiert und komplett wiederholt. Eine Zwischenmatrix Exit 1 fiel während der zusätzlichen Vorschau-Hashkorrektur aus (Chromium noch ohne Hashreceipt, Firefox durch Vite-Neuladen unterbrochen); sie gilt nicht als Pass. Letzte Suite lief erst nach Abschluss sämtlicher Codeänderungen. Neue Tests prüfen auch SOURCE_CHANGED bei schon materialisierten öffentlichen Relationen. Synthetischer Testprovider/HTTP-Server in `tests/portal/`, keine produktiven Seed-Daten.

Nächster konkreter Schritt: P5, native R-Vektoren/Missing-Masken gegen die tatsächliche webR-0.6.0-API prüfen und SQL→R→SQL implementieren. P6 erst nach bestandenem P5-Gate. P7/P8 und vollständige V1-Abnahme bleiben offen.

## P5 — R-Rundlauf (Prüfverlauf, Gate bestanden)

Implementiert im Arbeitsbaum: `rTypeCodec.ts`, `rPorts.ts`, `rService.ts`, `infrastructure/webr/engine.ts`, SQL-Spaltenimport, sitzungsgebundene R-Initialisierung, native Vektoren plus separate Missing-Maske, Transferpläne/Keep/Bindings, expliziter Capture-Lauf samt zwei Parquetartefakten und DatasetVersion, Run-/Console-/Plotpfade, R-Workbench und SQL→R-Dialog. Tests unter `tests/integration/r*.spec.ts`, `tests/unit/r-codec.test.ts`. P6 noch nicht begonnen.

Tatsächlich geprüft: TypeScript/Lint zwischenzeitlich Exit 0; **33 Unit-/Regressionstests Exit 0**. Reale Chromium-Tests für den Typgrenzen-Rundlauf und 350-Zeilen-/Timeout-/stale-Plan-Pfad Exit 0, zwei Tests bestanden. Native API-Probe jetzt Exit 0: webR `toArray()` vermischt NA und NaN; `toTypedArray()` plus `is.na(x) & !is.nan(x)` erhält beides. RDataFrame-Konstruktor mit R-Proxies ungeeignet; Vektoren werden nativ erstellt und im R-Environment zu einem Dataframe zusammengesetzt. Unveränderter Golden-Skriptpfad, vollständige Ressourcen-/Fault-/Browser- und UI-Prüfung noch ausstehend.

`node scripts/mirrorWebRPackages.mjs` Exit 0: 40 gepinnte lokale Pakete (39 MiB); [Log](verification/webr-mirror-p5.log). Tatsächliche Installation in webR derzeit fehlgeschlagen nach erfolgreichem HTTP-Abruf von PACKAGES.rds und cli-Tarball. Ebenfalls reproduziert: R-String-Datumparser meldet im unveränderten Build einen unbeschriebenen Worker-Fehler, danach ist `1+2` weiterhin möglich (kein belegter Workercrash). Native Date-Tageszahlen und der typisierte Rundlauf funktionieren. Ursache wird untersucht; diese Probleme sind nicht als bestanden markiert. Temporäre Diagnostik nur in den generierten, ignorierten Runtimeassets; vor Gate werden diese aus den gepinnten Originaldateien neu erstellt.

P5-Zwischenprüfung 2026-10-04: Die gemeinsame Ursache der Paket-/Datumsfehler war das automatische `Content-Encoding: gzip` des Vite-Dateiservers bei `.gz`/`.tgz`. Fetch entpackte die Dateiformate vor webR. `scripts/runtime-archives.ts` liefert diese Dateien jetzt unverändert; keine webR-Quelldatei wurde gepatcht. Originalassets aus `node_modules/webr/dist` wiederhergestellt. Positiver echter Date-Parser-Test bestanden. Paketinstallation umfasst alle 40 Lockeinträge einschliesslich `cpp11`; Versionsprüfung liest das unveränderte DESCRIPTION-Feld (R normalisiert andernfalls `1.1-3` zu `1.1.3`). Fokuslauf `/tmp/p5-focused2.log` Exit 1: 3 bestanden, Golden-Rückquery noch fehlgeschlagen, weil der AST-Guard den DuckDB-internen Namen `count_star` für COUNT(*) nicht kannte. Freigabe dieses reinen Aggregats ergänzt; Fixtures bleiben unverändert. UI-/Faulttests laufen weiter, P5-Gate bleibt offen.

Weitere P5-Fokusprüfung `/tmp/p5-more.log` Exit 1: vier Engine-/Faulttests bestanden (unverändertes Golden-R-Skript und Rück-SQL, tatsächliche PNG-Pixel/Reopen, Typgrenzen, 350 Zeilen und sieben zusätzliche Fresh-Läufe/Pruning, atomare Write-/Commit-Fehler, Warnungsbestätigung, Hardlimit, Unsupported-Spalten, Nullzeilentabelle, 2000 Konsolenzeilen und maximal zehn Grafiken). Ein UI-Test scheiterte an einer sofortigen strict-locator-Prüfung während des Resultatwechsels; Erwartung auf vollständige Zellenliste korrigiert, erneuter Lauf läuft. Kein Gate-Pass aus Teilprüfungen abgeleitet.

P5 erste vollständige Verify-Suite Exit **0**: 33 Unit-/Regressionstests, 31 Chromium-Integrationen, 14 E2E plus TypeScript/Lint/Build. Erste Dreiermatrix Exit **1**: 24 bestanden, sechs Fehlfälle (je native NA-Probe, Golden Path und Typgrenzen in Firefox/WebKit). Ursache: `RDouble([null,...])` verliert dort das R-NA-Bitpayload und erzeugt NaN. Separaten Maskenvertrag im Adapter vervollständigt: nach Transport `lab_vector[lab_missing] <- NA` innerhalb von R. Fachliche Sollwerte/Fixtures unverändert; native Vorherbeobachtung bleibt in API-Probe enthalten. [Fehlmatrix](verification/browser-r-p5-before-mask.json), [ADR 004](adr/004-native-r-missing-mask-and-compressed-assets.md). Erneute Prüfungen laufen; P6 weiterhin nicht begonnen.

**P5-Gate bestanden.** REQ-049–059 (Baseline PostMessage), AT-040–048/052/062; der vollständige Herkunfts-/Bereinigungsanteil AT-053 folgt wie im AT-Katalog in P6. [Letzter Code-Fingerprint](verification/code-fingerprint-p5.json), Basisrevision `0535d2f`, uncommitteter Zielbaum. Abschliessende Matrix Exit **0**, **30/30 bestanden**, keine Skips/Flakys: zehn Fälle je Chromium 153.0.8010.12, Firefox 155.0 und WebKit 26.6. Enthält alle sieben R-Integrationen, den gesamten R-UI-Rundlauf und zwei Speicherprüfungen. [Matrix](verification/browser-r-p5-gate.json), [Befehle](verification/commands-p5-gate.json). Nach letzter Maskenkorrektur TypeScript/Lint/33 Unit-Tests erneut Exit 0; zuvor gesamte Verify-Suite Exit 0 (31 Integrationen, 14 E2E). Die Maskenkorrektur und API-Probe sind vollständig von der danach bestandenen Dreiermatrix erfasst. Originalruntime-JS per `cmp` erneut bytegleich geprüft. Kein automatisches Paketupgrade, keine Quellportaländerung.

P5 liefert Script/Selection, native Parameter/Seed, Lauf-Snapshots, Console-/Plotgrenzen, echte PNGs/Keep, Objektvorschau, beständigen Sitzungsscope, frische Scopes mit Pruning, Epoch-/Planinvalidierung und nachweisliche Workerbeendigung bei Cancel/Timeout. Tabellenübernahme erfasst vollständige Resultate; gespeicherte Inputs erst nach Sicherung. Capture veröffentlicht Ergebnis, Lauf, neue Version und beide Parquetstände gemeinsam nach Writes. Einschränkungen: Auto/SAB-Auslieferungsprofil und Leistungs-/RAM-Budgets sind P7/P8-Prüfungen, tatsächlicher Safari-Pilot bleibt offen. Hochpräzise Zeitwerte werden verlustfrei als annotierter Text geführt; nicht verlustfrei rückabbildbare native R-Zeitwerte werden ausdrücklich abgewiesen.

Nächster konkreter Schritt: P6 Archiv-Codec, Remapping und Recovery. V1 bleibt nicht vollständig abgenommen.

## P6 — Archive und Recovery (Prüfverlauf, Gate bestanden)

Archivpfad implementiert in `src/application/workspaceArchive.ts`, `archivePorts.ts`, `src/domain/remap.ts`, `src/infrastructure/archive/zip.ts`, WorkspaceService und `src/features/archive/ArchiveActions.tsx`. ZIP32 Store/Deflate über native DecompressionStream-API, tatsächliche Expand-/Byte-/Eintragslimits, CRC/SHA-256, canonical Pfade, doppelte/überlappende Einträge und Symlinks abgewiesen. Striktes Manifest ohne Betreiberkonfiguration; explizite Vorschau/Bestätigung, Remapping aller strukturellen Referenzen, Code/Aliase/externe IDs unverändert. Recipe-Auslassungen werden missing/unavailable; mitgelieferte Dateien erhalten neue lokale IDs/Pfade vor atomarem Create. Export führt keinen Code aus, externe Daten nur nach Opt-in. Duplizieren nutzt denselben Remappingkern; bestätigtes Löschen beendet die Sitzung, prüft Revision/Lock, entfernt Projekt/View-Metadaten und erst dann eigene Dateien.

`RecoveryService` inventarisiert beim Öffnen ohne Engine-Start; ausdrückliche Hashprüfung, sichere Bereinigung abgebrochener Import-/Löschreste unter exklusivem Lock. Historische Metadaten und referenzierte Dateien bleiben erhalten; UI zeigt zunächst maximal 100 Läufe. Fehlende/corrupt Bytes bleiben mit lesbarem Code sichtbar.

Bisher: `npm run typecheck`, `npm run lint` Exit 0; `npm run test:unit` Exit **0**, **37 Tests** inkl. Recipe, manipulierten ZIPs, tatsächlicher Expansion bei gefälschten Längen, Hashfehler und Metadatenfault. Erster P6-E2E-Aufruf Exit **130** nach einem Fehler und einem abgebrochenen Fall: Vite missverstand Klassenmethode `import` als dynamischen Import und erzeugte ungültiges JavaScript. In `commitImport` umbenannt; keine Abnahmesollwerte geändert. Neuer echter Browser-/Recoverylauf läuft. P6 nicht als bestanden verbucht.

P6-Fokusläufe: `/tmp/p6-focused2.log` Exit 1 (3 bestanden, 2 Fehler: Recipe-Selektor mehrdeutig, URL vor abgeschlossenem Navigieren erfasst); `/tmp/p6-focused3.log` Exit 1 (5 bestanden, Fehlercode nicht in UI angezeigt); `/tmp/p6-focused4.log` Exit 1 (6 bestanden, fehlende Datei fälschlich RUNTIME_RESET statt ARTIFACT_MISSING). Fehlerdarstellung und Klassifizierung korrigiert; keine fachlichen Sollwerte geändert. Der explizite Sitzungsmodus navigiert nun direkt zur temporären Projektliste statt eine persistente URL im leeren Memory-Store aufzulösen. Exportauslassungen benennen auch bereits unavailable Resultate.

Ergänzte Faultnachweise: native OPFS-Datei nach gescheitertem Archiv-Create wird ausschliesslich unter Writer-Lock bereinigt; fremde Textdatei und anderes Projekt bleiben erhalten. Reale SQL→R-Sicherung mit injiziertem QuotaExceededError veröffentlicht keine Bindung; Recipe-Export bleibt möglich, Retry gelingt. Workspacewechsel während R→SQL-Capture nach erstem echtem OPFS-Write bricht ab, veröffentlicht kein Resultat/Dataset und verändert das neue Projekt nicht; Orphan ist bereinigbar, älteres kept-Resultat bleibt lesbar. Unitfälle prüfen Revisionsschutz beim Löschen, Verzeichnisfehler nach erfolgreichem Metadatenlöschen, sichere Nachbereinigung und Doppelklick während Import-Lockakquise.

`npm run typecheck && npm run lint && npm run test:unit` Exit **0**, **39 Tests** (vorher zusätzlicher Testaufruf Exit 2 wegen falschem Methodennamen im neuen Test, auf tatsächlich vorhandenes `inventory()` korrigiert). `npx playwright test --project=chromium tests/e2e/archive.spec.ts tests/e2e/multitab.spec.ts tests/integration/recovery.spec.ts tests/integration/archive-portal.spec.ts tests/integration/transfer-recovery.spec.ts` Exit **0**, **8/8 bestanden**, [Fokuslog](verification/p6-focused-gate.log). P6-Vollprüfung und Dreiermatrix stehen noch aus; weiterhin kein P6-Gate-Pass.

Erster kompletter P6-Verify-Lauf Exit **0**, 39 Unit, Build, 36 Integration und 17 E2E ([vor abschliessender Versions-/Parameterkorrektur](verification/verify-p6-before-format-check.log)). Danach Nachweisabgleich ergänzt: Archive mit unbekannter Archiv-/Projektversion bekommen FORMAT_UNSUPPORTED, ohne Publikation; zusätzlicher Test für native R-Parameter, Selection-Snapshot unter gleichzeitiger Editoränderung, reproduzierbaren Seed und explizit nachträglich geänderten Dataframe. Erster Ergänzungslauf Exit 1 (zwei Archivtests bestanden): JS-null wurde von webR als NA statt R-NULL behandelt. Nach Prüfung der installierten Types wird `runtime.objs.null` gebunden; kein Stringtemplating. Zweiter Ergänzungslauf Exit 1 nur an der Anzeigeerwartung: R-numeric bleibt SQL DOUBLE und liefert korrekt `9.0` statt des im neuen Test irrtümlich erwarteten Integertexts `9`. Test fachlich auf DOUBLE angepasst; keine Goldenfixture geändert. Abschliessendes Verify nach diesen Korrekturen läuft.

Abschliessendes `npm run verify` nach sämtlichen obigen Korrekturen Exit **0**: **39 Unit-/Regressionstests, Build, 37 Chromium-Integrationstests und 17 E2E-Tests**, TypeScript/Lint/Grenzen bestanden. [Historischer Log vor URL-Härtung](verification/verify-p6-before-url.log). Code-Fingerprint `1377971c7bb564f228fd03c03e7d62b21966ae1b63206467076cb6630053b3d1` über 122 Dateien, Git-Basis weiterhin `0535d2f` ([historisches Inventar](verification/code-fingerprint-p6-before-url.json)). Quellportal sauber; die fünf übernommenen Mapper-/Query-/DTO-Dateien inkl. Regressionstests und produktiver ExploreContext bleiben bytegleich. Die erzeugten webR-JS-/Workerdateien stimmen mit dem installierten Original überein. Dreiermatrix auf unverändertem Code gestartet; deren Ausgang wird noch nicht vorweggenommen.

Zusätzlicher P6-Grenztest `tests/unit/archive-public-urls.test.ts` zunächst Exit **1** ([Nachweis](verification/p6-url-before-validation.log)): Netzwerkpolicy verweigert zwar unsichere URLs vor Fetch, aber die Archivinspektion akzeptierte noch Quellen-URLs mit Userinfo/Tokenparametern. Damit konnten solche URLs weiterexportiert werden. Der abschliessende Archivvalidator wird vor Import/Export um den dauerhaften URL-Vertrag ergänzt; Betreiber-Allowlist bleibt unabhängig und greift vor jedem tatsächlichen Abruf. Laufende Dreiermatrix wird ohne Produktänderung zu Ende geführt, anschliessend werden die korrigierten Archivpfade erneut geprüft.

Erste vollständige P6-Dreiermatrix Exit **1**: **161 bestanden, 1 WebKit-Fehler**, keine Skips/Flakys ([Matrix](verification/browser-matrix-p6-before-recovery.json), [Log](verification/browser-matrix-p6-before-recovery.log)). Fehler vor der Bereinigung: WebKit lieferte trotz frischen Profilordnern einen geteilten nativen OPFS-Bestand; Testfixture nahm fälschlich an, jede gefundene UUID gehöre zum laufenden Test. Gezielte Wiederholungen Exit 1 grenzten dies ein. [ADR-005](adr/005-opfs-test-namespaces.md) dokumentiert die kleinste Testumgebungsanpassung: echte OPFS-Dateien unter eigenen UUID-Testwurzeln, identischer Schlüssel beim Prozessneustart, nur eigene Wurzel beim Teardown entfernen. Kein Storagefake, kein abgeschwächter Sollwert, kein globales Browser-Cleanup. 38 erzeugte synthetische Marker gezielt anhand Inventar/Inhalt bereinigt (Exit 0; [Receipt](verification/p6-test-marker-cleanup.json)); fremde Originaldateien bleiben erhalten. Ein erster Bereinigungsversuch konnte den bereits beendeten Testserver nicht erreichen (Exit 1, keine Mutation); Wiederholung nutzte einen kurzlebigen lokalen Testserver.

Der erste isolierte WebKit-Lauf hatte sieben bestandene Fälle und zwei Teardownfehler (Exit 1): In Tests ohne OPFS-Nutzung existierte die Testwurzel nicht. Cleanup behandelt jetzt ausschliesslich deren NotFound als bereits aufgeräumt. Der ursprüngliche Recovery-Fall bestand bereits. Hinzugefügter Zweiprofiltest prüft die neue Isolation mit echten Dateien, nicht nur einer Annahme. TypeScript/Lint/40 Unit-Tests nach URL-Härtung Exit 0; abschliessende Browser-/Verifyläufe folgen auf dem aktualisierten Stand.

WebKit-Fokuslauf nach Testisolation Exit **0**, **10/10 bestanden**, einschliesslich des ursprünglichen Recovery-Falls, echter Zweiprofil-Isolation, Archiv-UI und Importfällen ([Log](verification/p6-webkit-isolated-gate.log)). Anschliessendes `npm run verify` auf dem unveränderten Stand Exit **0**: **40 Unit-/Regressionstests, 38 Chromium-Integrationstests, 17 Chromium-E2E-Tests**, TypeScript/Lint/Modulgrenzen/Build ebenfalls erfolgreich ([Log](verification/verify-p6-gate.log)). Die vollständige Dreiermatrix läuft; kein P6-Gate-Pass aus dem Zwischenstand abgeleitet.

**P6-Gate bestanden.** REQ-015/018/020–023/068–071; AT-012–017, AT-050–053, AT-059–065 auf dem unten bezeichneten Stand. Die Phasen wurden in der vorgegebenen Reihenfolge bearbeitet: P5 begann nach dem P4-Gate, P6 nach dem P5-Gate. P7 wurde nicht begonnen.

Letzte verifizierte Revision: Git-Basis `0535d2fd54f14e347cb3b488c3d47767923d1b2f`, uncommitteter Zielarbeitsbaum, Code-Fingerprint **`a5fc622b0f2d36c7c4d67db677df4e0801cb2fd25ce54d18cf0b2275d12f46c7`**, 125 Dateien ([Inventar](verification/code-fingerprint-p6.json), [Abgleich](verification/final-check-p6.json)). Zwischen Start und Ende der Abschlussläufe keine Produkt-/Testcodeänderung. Quellportal weiterhin sauber an `6b45fc4e22116fba8fc00bd48175e347aa740562`. Baseline-Regressionen/DTO und erzeugte webR-Module bytegleich zu ihren Originalen; keine neue npm-Dependency in P4–P6.

Abschlussprüfungen vom 4. Oktober 2026:

- `npm run verify` Exit **0**: TypeScript, Lint/Modulgrenzen, **40 Unit-/Regressionstests**, Build, **38 Chromium-Integrationstests**, **17 Chromium-E2E-Tests** ([Log](verification/verify-p6-gate.log)).
- `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/browser-matrix-p6-gate.json npx playwright test --workers=3 --reporter=list,json` Exit **0**: **165/165 bestanden**, je 55 pro Browser, keine Skips, keine Flakys, keine Retries ([JSON](verification/browser-matrix-p6-gate.json), [Log](verification/browser-matrix-p6-gate.log)).

Zusätzlicher serieller Gegencheck wegen gemeinsamem veränderlichen HTTP-Fixturezustand: `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/browser-portal-p6-serial.json npx playwright test tests/integration/portal.spec.ts tests/integration/archive-portal.spec.ts tests/e2e/portal.spec.ts --workers=1 --reporter=list,json` Exit **0**, **12/12 bestanden**, keine Skips/Flakys ([JSON](verification/browser-portal-p6-serial.json), [Log](verification/browser-portal-p6-serial.log)). Damit beruht der Portalnachweis nicht nur auf dem parallelisierten Gesamtlauf.

Ergänzende Schlussprüfungen: `python3 tools/verify-package.py --report docs/verification/specification-check-p6.json`, `npx tsc -p contracts/tsconfig.json` und `git diff --check` jeweils Exit **0**. [Befehlsprotokoll](verification/commands-p6-gate.json), [Paketprüfung](verification/specification-check-p6.json). Der Paketprüfer validiert Spezifikationsbezüge und Fixtures; er ersetzt keine Engine-/Browserabnahme.

Browser: Chromium **153.0.8010.12**, Firefox **155.0**, Playwright-WebKit **26.6**, Playwright **1.63.0**, macOS **27.0.1**. Runtime: DuckDB-WASM **1.33.1-dev57.0** (Engine 1.5.4), SQLRooms **0.28.0**, Arrow **17.0.0**, webR **0.6.0** (R 4.6.0); PostMessage-Profil. Node **22.23.1**, npm **11.18.0**. Die WebKit-OPFS-Testanpassung und ihre Grenze stehen in [ADR-005](adr/005-opfs-test-namespaces.md); keine Behauptung eines tatsächlichen Safari-Piloten.

Geliefert sind echte Portable-Archive mit Golden-Rundlaufergebnis/PNG/Diagramm, strukturelles Remapping, explizite Recipe-Lücken, kein Auto-Run, Originalschutz bei fehlerhaftem Import sowie getestete Quota-/Commit-/Abbruch-/Mehrtab-/Hash-/Missing-/Orphanpfade. Zusätzlich abgewiesen: unbekannte Formatversionen und archivierte Quellen-URLs mit Credentials/Tokenparametern oder unzulässigem Schema. UI, Domain und Speicherpfad arbeiten zusammen; Fehlfälle bleiben sichtbar und exportierbar.

**Offen / nicht ausgeführt:** P7-Deployment mit Container/Unterpfad/MIME/Headers/CSP, vollständige UI-Flächen-/Fokus-/Viewzustandsprüfung, auto/SAB-Profil, P8-Clean-Checkout-/Ressourcen-/10k/100k-Pilot, tatsächlicher Safari-Pilot und Releasebericht. Acht bisher protokollierte npm-Auditbefunde sind noch nicht freigegeben. Produktive Portal-URL bleibt Betreiberabhängigkeit; weiter gilt das klar benannte Testprofil. Weitere Teilnachweise aus früheren Phasen bleiben in [ACCEPTANCE_STATUS.md](ACCEPTANCE_STATUS.md) offen und werden durch diese Phase nicht pauschal zu vollständig erfüllten Requirements.

Nächster konkreter Schritt: **P7**, zuerst UI-Flächen-/Fokusvertrag messen und den statischen Deploymentpfad samt `/lab/`-Reload, echten Asset-404s und PostMessage-Headers implementieren und testen. **V1 ist weiterhin nicht vollständig abgenommen.**

## P7 — Prüfverlauf, Gate bestanden

Fortsetzung am 4. Oktober 2026 nach bestandenem P6-Gate. Arbeitsbaum und Toolchain geprüft: Git-Basis `0535d2f`, bestehende uncommittete Implementierung erhalten, Node 22.23.1/npm 11.18.0; Docker Desktop/Engine verfügbar. Quellportal unverändert. P7 bearbeitet REQ-060–067/072–076/079–080 und AT-054–058/066–071: statische Auslieferung, Unterpfad, CSP-/Kommunikationsprofile, Initfehler/Retry, UI-Geometrie/Fokus/Viewzustand und Betriebsnachweise. Noch kein P7-Pass, P8 nicht begonnen.

P7-Zwischenstand (4. Oktober): UI-Flächen/Resize/Fokus/Diagnose, Viewzustände, Storageeinstellungen, lazy Monaco, statische Root-/lab-/auto-Container, strikte MIME-/404-/Cache-/CSP-Konfiguration und Betriebsanleitung implementiert. `npm run typecheck`/`npm run lint` nach den Änderungen Exit 0 (`p7-check11.log`, `p7-check12.log`); früherer Typecheckfehler in einem neuen Testimport korrigiert, nicht als Pass gewertet. 40 Unit-Tests im ersten P7-Stand Exit 0 (`p7-static-unit.log`). Chromium-UI `p7-ui-third.log`: 2/2 Exit 0; vollständige neue Matrix folgt.

Fehlläufe bleiben erhalten: Deploymentversuche 1–6 prüften und fanden Prozess-/Container-Capability-, Cache-, verfrühte Test-Reopen-, Worker-CSP- und eager-Initfehler. Versuch 7: 1 bestanden/1 fehlgeschlagen/7 nicht ausgeführt, Exit 1. Init-404/MIME/Retry bestand; Workerzählung unmittelbar nach Cancel war noch nicht korrekt synchronisiert. Neuer Test wartet auf tatsächlichen Loopstart und das native Worker-close-Ereignis. Kein Deployment-Gate-Pass behauptet. `p7-webr-csp-proof.json` beweist die eng begrenzte worker-spezifische CSP-Ausnahme (ADR-006).

Beschädigtes echtes DuckDB-WASM: nackter Initpfad hing bis zum 120s-Testtimeout, Exit 1 (`p7-sql-init-before.log`). Nach kontrolliertem Storestart, Init-Zeitbudget und Freigabepatch: 1/1 Exit 0, Worker geschlossen und Retry-SELECT 42 erfolgreich (`p7-sql-init-after.log`, ADR-007). Der Patch ist auf das exakte SQLRooms-0.28.0-Modul hashbegrenzt und läuft reproduzierbar bei npm ci.

Dependencykorrekturen separat vom ursprünglichen Herauslösen: Vitest 4.1.11, DOMPurify 3.4.16, nanoid 3.3.18, PostCSS 8.5.23, qs 6.16.0, undici 7.29.1, ohne Majorwechsel. `npm audit` Exit 0, 0 Befunde (`npm-audit-p7-final.json`); anfängliche 8 Befunde und Zwischenstand 2 niedrige Befunde bleiben protokolliert. Inventargenerator Exit 0: 400 Lockeinträge/40 R-Pakete (`dist/licenses`); optional nicht installierte Plattformpakete werden explizit gekennzeichnet. CI ist geliefert, aber ein entfernter CI-Lauf wurde nicht ausgeführt.

Nächster Schritt: vollständiges P7-Deployment-/UI-Gate und die im P7-Gate referenzierten Clean-Build-/Ressourcenvoraussetzungen AT-070/071. P8 bleibt bis dahin unbegonnen. Quellportal unverändert; produktive Portal-URL weiterhin externe Releaseabhängigkeit.

Weitere P7-Prüfungen: frisches Git-Tree-Export `08b9b4914ebec1aa56283c0c693bd914c9291281` ohne Dependencies/Assets (Benutzerindex und Branch unverändert). Dort `npm ci && npm run typecheck && npm run lint && npm run test:unit && npm run build` Exit **0**, 40 Unit-Tests, alle 40 R-Pakete frisch gespiegelt/hashgeprüft (`clean-source-p7.json`). Kein Commit-SHA für uncommittierten Code behauptet. Der vollständige Linux-Dockerbuild zunächst Exit **1** wegen plattformabhängigem gzip-OS-Header, dann nach RFC1952-Normalisierung Exit **0** (`p7-clean-docker-build[-second].log`, `p7-gzip-platform-proof.json`). Entpackter Paketindex und alle Paketbytes unverändert. Laufendes Image zusätzlich unter UID 1000870000 ohne Capabilities/read-only geprüft; HTTP-/Config-/404-Beleg `p7-clean-image-http.json`.

Deployversuch 8 Exit 1: Console-Ausgabe aus `captureR` ist bis zum Laufende gepuffert und eignet sich nicht als Loopstart-Signal. Versuch 9 Exit 1: tatsächlicher Abbruch/Workerende bestanden, anschliessende neue R-Initialisierung überschritt das absichtlich auf 20s verkürzte Testlimit. Der Fehlerbericht zeigte korrekt TIMEOUT. Der Test verwendet jetzt das spezifizierte 60s-Pilotbudget auch nach Reset. Ein seriell gestarteter Matrixlauf wurde vor der Abnahme bewusst mit Exit 130 gestoppt und als `p7-deploy-matrix-interrupted.log` erhalten; unabhängige Profile werden nun mit drei Testworkern geprüft. Kein Retry im Playwright-Runner.

Monaco-Aufteilung im frischen Build: initialer App-Chunk 913,65 kB / 268,47 kB gzip; Editor lazy 3629,57 kB / 925,10 kB gzip; Editorworker 279,94 kB. Grössenwarnung bleibt sichtbar, kein Peak-RAM-Versprechen. Das sind tatsächliche Buildwerte, keine Performancegarantie. Die geprüften SQL-/R-Screenshots zeigen 56px Header, 52px Sidebar und ausreichend grosse Arbeitsbereiche ohne horizontalen Seitenscroll.

P7-Codereview: keine ungeprüften any-Typen, eval-/HTML-Ausführung, Produktionsfakes, TODO-/not-implemented-Pfade oder globale Browserdatenlöschung in `src/` gefunden (`rg`-Review). Es gibt weiterhin nur die Sessionfabrik für den SQLRooms-Connector und lazy webR; Tabellen-/R-/Workerhandles bleiben in Infrastrukturmaps. Sichtprüfung der neuen Chromium-Screenshots durchgeführt. Diese statische Prüfung ersetzt weder Fehlertests noch die Browsermatrix.

P7-Ressourcenprüfung: `npx playwright test tests/integration/resources.spec.ts tests/integration/init-failure.spec.ts tests/e2e/p7-ui.spec.ts --project=chromium --reporter=list` Exit **0**, 5/5; `p7-ui-resources-first.log`. 20 echte persistente Workspace-/SQL-/R-Resetzyklen: jeweils 0 lebende Worker und 0 SQL-Handles nach Close, 0 R-Objekte nach Reset. 10k/100k vollständig nach R und zurück, Summen 49'995'000 / 4'999'950'000 exakt. SQL ca. 963/904ms, Transfer einschliesslich R-Initialisierung ca. 19,824/14,010s; 293,199s über alle Zyklen. Umgebung/Parallelbelastung in `p7-environment.json`, Messreihen `p7-resources-chromium.json`; kein RAM-Peakversprechen.

P7-Deploymentmatrix nach Zod-Korrektur: Exit **1**, 12 bestanden, 1 fehlgeschlagen, 2 wegen Max-Failures unterbrochen, 21 nicht ausgeführt (`p7-deploy-matrix-second.*`). Root-/lab-PostMessage samt CSP/SQL/R/Keep/Reload/Assetfehlern und Retry bestanden. auto/SAB fiel nach Interrupt auf Workerreset zurück. Der direkte Vergleich mit lokaler Runtime ergab: `interactive:false` liefert Interrupt-Exception, danach keine Antwort; `interactive:true` liefert anschliessend 42. Kleinste Korrektur nur im isolierten Profil; ADR-008 und `p7-sab-direct-proof.json`. Zwei vorgelagerte Diagnoseversuche wurden wegen unzureichender Probe-Deadlines manuell beendet, nicht als bestanden gewertet.

Zusatzproof `p7-sqlrooms-open-failure-proof.json` Exit **0**: reales DuckDB-open scheitert am nicht vorhandenen Dateipfad, nativer Worker wurde durch den SQLRooms-Patch geschlossen. Erster direkter Source-Importversuch Exit 1 wegen nicht vorgebündeltem dayjs; Wiederholung benutzte den tatsächlich von Vite erzeugten Dependencyexport. Kein Produktionsfallback daraus abgeleitet.

Frischer Verify-Lauf meldet einen R-Regressionstestfehler: das bisher nur zum schnellen Loop-Timeout verwendete 1s-Budget begrenzt nun ebenfalls die echte Initialisierung. Der Testharness trennt deshalb explizit das 1s-Ausführungslimit von der unverändert echten 60s-Runtimeinitialisierung. Keine Goldenwerte geändert, Timeout-/Reset-Soll bleibt bestehen. Abschluss/Exit des laufenden Verify wird erst nach Prozessende protokolliert.

Dieser Verify-Zwischenstand endete mit Exit **1**, 39 bestandenen/1 fehlgeschlagenem Integrationstest; E2E wegen der Fehlerkette nicht ausgeführt (`p7-clean-verify.log`). Der anschliessende R-/UI-Dreierlauf endete Exit **1**, 14 bestanden/1 fehlgeschlagen (`p7-ui-r-matrix.log`): alle sechs R-Fälle bestanden; WebKit verlor den Dialogfokus. `Modal.tsx` steuert nun jeden Tab-Schritt und merkt den tatsächlichen Auslöser auch bei nicht fokussierten macOS-Klickbuttons. Abschliessender Fokuslauf in allen drei Browsern Exit **0**, 3/3 (`p7-focus-matrix.log`); TypeScript/Lint Exit **0** (`p7-check17.log`).

Deploymentmatrix 3 endete Exit **1**: zwei bestanden, ein Teardownfehler, zwei unterbrochen, 31 nicht ausgeführt. Der eigene Test-Cleanup kollidierte mit der erneut gestarteten App-Speicherprobe; korrigiert durch eine leere Testseite derselben Origin (ADR-005). Der 20-Zyklen-Benchmark liegt jetzt unverändert unter `tests/benchmarks/resources.spec.ts`; `npm run test:resources` und CI führen ihn explizit aus, die normale Gesamtauswahl ebenfalls. Keine Testdeaktivierung. Aktuell laufen eine neue 36-Fälle-Deploymentmatrix und `npm ci`/`npm run verify` im frischen Kandidatenbaum `164dbc0233044edc2305fa7cee68bc152a8d81a4`; deren Ergebnis ist noch offen.

Frischer Kandidatenbaum `164dbc0233044edc2305fa7cee68bc152a8d81a4`: `npm ci` Exit **0**, anschliessend `DW_REUSE_TEST_PORTAL=1 npm run verify` Exit **0**, **40 Unit, 39 echte Chromium-Integrationen, 20 E2E**, TypeScript/Lint/Build bestanden (`p7-clean-install-final.log`, `p7-clean-verify-final.log`). Vollständiger Linux-Dockerbuild dieses Baums Exit **0** (`p7-clean-docker-build-final.log`). Image `sha256:4443427ac607741e5225fa4417c213824dbb3bc2b643559c4d41b543407674dc` läuft unter UID `1000870000:0`, read-only, cap-drop ALL/no-new-privileges; `/lab/workspaces` 200, fehlendes WASM 404, normales Profil ohne Portalprovider (`p7-clean-image-final.json`).

Zusätzlicher AT-058-Test prüft jetzt Back/Forward, echte Cursor-/Undoerhaltung und keine Domainrevision durch Layoutänderung. `tests/deployment/network-flow.spec.ts` ergänzt den zusammenhängenden statischen lokalen/öffentlichen SQL→R→SQL-/PNG-/Archivpfad mit Netzwerkaufzeichnung. Dafür bekam ausschliesslich der synthetische Testportalserver eigene UUID-Fixturedateien und eine exakte Loopback-Originliste für die Testcontainer; Quellportal unverändert. Tests noch laufend/ausstehend, kein neuer Pass vorweggenommen. TypeScript/Lint nach Ergänzung Exit **0** (`p7-check19.log`). Vertragspaketprüfung Exit **0**; separater Contract-TS-Aufruf zunächst Exit **1** wegen neu erforderlichem TypeScript-6-Flag `--ignoreConfig`, mit diesem Flag Exit **0**. `git diff --check` Exit **0**, Quellportal weiterhin sauber.

**P7-Gate bestanden.** `DW_REUSE_TEST_PORTAL=1 npx playwright test --config=playwright.deploy.config.ts --workers=3 --reporter=list` Exit **0**, **36/36**, 10,2min (`p7-deploy-matrix-fourth.log`). Zusätzlicher vollständiger statischer Netz-/Datenpfad: derselbe Aufruf mit `tests/deployment/network-flow.spec.ts`, Exit **0**, **9/9**, 2,3min (`p7-network-first.log`). Beide Kommunikationsprofile bestehen nach echter Fehlerinitialisierung/Abbruch und Retry; SAB behält seinen Worker. Keine Skips/Runner-Retries.

UI-Dreierlauf zunächst Exit **1**, neun bestanden/drei neue Historytests fehlgeschlagen (`p7-ui-final.log`): die Mac-Tastenkombination im neuen Test setzte den Cursor nicht an den Zeilenanfang. Auf `Home` korrigiert und Position vor/nach Wechsel über die installierte Monaco-API zusätzlich geprüft; `-g 'browser history' --workers=3` Exit **0**, **3/3** (`p7-history-second.log`). Kein Produktfehler über einen geänderten Sollwert verdeckt: eingefügtes Zeichen muss weiterhin genau Spalte 8 treffen, Undo/Forward/Back und Domainrevision geprüft. TypeScript/Lint danach Exit **0** (`p7-check20.log`). Zusammen mit dem frischen Verify, Ressourcenbenchmark und Geometrie-/Fokusnachweisen sind die P7-Ziele erfolgreich getestet.

Verifizierter P7-Arbeitsstand: [Dateihashes](verification/code-fingerprint-p7.json), Git-Basis `0535d2f`; kein Commit-SHA für uncommittierte Änderungen behauptet. Browser Chromium 153.0.8010.12, Firefox 155.0, Playwright-WebKit 26.6 auf macOS 27.0.1. CI-Konfiguration geliefert, entfernter CI-Lauf nicht ausgeführt. Quellportal am dokumentierten Commit unverändert. Nächster konkreter Schritt: **P8** — verbleibende AT-Lücken (Testmigration, Ersatz während Lauf, Importgrenzen, verspätete Antworten), gemischter Golden Path mit Prozessneustart, vollständige Browsermatrix und tatsächlicher Safari-Pilot. Produktive Portal-URL bleibt externe Releaseabhängigkeit; **V1 noch nicht vollständig abgenommen**.

## P8 — in Arbeit

Beginn erst nach obigem P7-Gate. Abnahme und Fehlernachweise werden ergänzt; keine V1-Fertigmeldung vor dem finalen Verify-/Browser-/Pilotnachweis.

Neue echte Tests in `tests/integration/p8-acceptance.spec.ts`/`tests/spike/migration.ts`: separate Dexie-Testvorgängerversion mit gescheitertem Upgrade nach Daten-/Schemaänderung, unverändertem Rollback und erfolgreichem Retry; SQL-Snapshot v1 trotz blockiertem Ersatz, nächster Lauf v2; verzögerte echte SQL-/R-Antwort bei Workspacewechsel verworfen, SQL-Handles/Plotbitmaps/Worker freigegeben und B ohne fremde Tabelle/Resultate. Erst Chromium **4/4 Exit 0** (`p8-acceptance-first.log`), danach **12/12 Integrationsfälle** der Dreiermatrix bestanden. Gesamter Fokuslauf Exit **1** wegen drei ergänzter UI-Fälle (`p8-focused-matrix.log`).

`DataSection.tsx` verwirft eine frühere CSV-Vorschau jetzt auch bei Auswahl eines nicht unterstützten Formats. Vorher blieb der alte Stand bestätigbar. Neuer UI-Test mit einer kleinen echten OOXML-ZIP-Datei und einer realen sparsamen 134217729-Byte-Datei; Defaultlimit unverändert 134217728. Die erste neue Erwartung „Button fehlt“ war zu streng: der vorhandene Button bleibt bestimmungsgemäss deaktiviert. Auf deaktiviert korrigiert, keine fachliche Begrenzung geändert. Danach Chromium-Import-/Schema-Diff-Test bestanden (`p8-golden-first.log`, Gesamtlauf Exit 1 wegen Golden-Test).

Der neue gemischte Golden-UI-Test lädt Bevölkerung als echtes HTTP-Parquet und Gemeinden/Fahrzeuge lokal. Erster Lauf scheiterte: Playwright-IME-`insertText` erzeugte beim mehrzeiligen R-Text eine zusätzliche Auto-Closing-Klammer. Test verwendet nun den wirklichen Clipboard-Paste-Handler von Monaco und vergleicht den gesamten Editorinhalt bytegenau mit den unveränderten Fixtures vor dem Run. Prozessneustart und Import in ein zweites frisches Profil werden anschliessend geprüft; erste Dreiermatrix läuft, Ergebnis noch offen. TypeScript/Lint nach Korrektur Exit **0** (`p8-check4.log`); früherer Typecheck Exit 2 wegen zu breitem Test-UUID-Typ wurde korrigiert.

Tatsächlicher Safari-Pilot versucht: Safari/safaridriver **27.0.1 (22625.1.29.11.28)**, macOS **27.0.1 (26A434)**. WebDriver-Session wird mit `session not created` abgewiesen: „You must enable 'Allow remote automation' in the Developer section of Safari Settings“. [Originalantwort](verification/p8-safari-session.json). Keine Browserpräferenz still geändert; Nutzer um Aktivierung gebeten. Curl-Transport Exit 0 ist **kein bestandener Safari-Test**. Der vorgelagerte Node-fetch-Aufruf auf Port 4190 endete Exit 1 wegen dessen reservierter Portliste; curl erreichte anschliessend den tatsächlichen Driver. Safari bleibt blockiert bis zu einem erfolgreichen Pilotlauf.

P8-Golden-Nachweise: Import-/Schema-Diff-UI besteht in allen drei Browsern (`p8-golden-matrix.log`, Gesamtexit 1 wegen Golden-Testharness). Der erste Dreierlauf fand zwei Testannahmen: Firefox ignoriert synthetische ClipboardEvents, und portable Archivpfade dürfen vor dem tatsächlichen Import nicht als lokale OPFS-Pfade validiert werden. Der Test verwendet nun Monacos installierten `trigger(..., 'paste', ...)`-Handler mit anschliessendem bytegenauem Codevergleich; die portable Manifestkopie wird nur für die zusätzliche Testvalidierung normalisiert. Produktimport prüft weiterhin die unveränderten Archivbytes. Keine Goldenwerte geändert.

Zweiter Golden-Dreierlauf Exit **1** (`p8-golden-matrix-second.log`): Firefox/WebKit vollständig bestanden; Chromium erfasste die Workspace-URL vor Abschluss der Navigation. Explizites Abwarten der Projektüberschrift korrigiert diese Race-Bedingung. Chromium-Wiederholung Exit **0**, **1/1** (`p8-golden-chromium.log`). Damit öffentlicher Bevölkerungs-Parquet + zwei lokale CSV, unveränderte SQL/R-Sollwerte, PNG/Chart, lokales Sichern, Archiv, echter Browserprozessneustart und zweites frisches Importprofil in allen drei Browsern nachgewiesen. Reopen/Import starten keinen Code; Herkunft und kept Werte bleiben erhalten. TypeScript/Lint Exit **0** (`p8-check5.log`).

Auch der alternative native Safari-Zugriff wurde versucht: `cua.getApp("Safari")` meldete gesperrten Mac und fehlgeschlagenes automatisches Entsperren. Keine UI-Prüfung möglich, keine Safari-Einstellungen geändert. Nutzer um manuelles Entsperren/Aktivieren der Remoteautomation gebeten. WebKit bleibt ausdrücklich ein separater Nachweis.

Frischer P8-Kandidat: Git-Tree `f044f1ef6142a3d1121fa93829e0c784d5232c46`, Export über temporären Gitindex (echter Index/Branch unverändert), Beleg `verification/clean-source-p8.json`. `npm ci` und `npm run assets:prepare` im leeren Export jeweils Exit **0** (`p8-clean-install.log`, `p8-clean-assets.log`). Vollständiges Verify und Firefox-/WebKit-Matrix laufen gegen denselben frischen Kandidatenserver. Die vier Fälle je Browser, die absichtlich den gemeinsamen Fixtureportalzustand ändern, werden separat seriell ausgeführt; keine Tests deaktiviert. Ergebnis erst nach tatsächlichem Prozessende.


P8 ergänzende Prüfungen: `npm audit --json` Exit **0**, 0 bekannte Befunde (`npm-audit-p8.json`); `npx tsc -p contracts/tsconfig.json` und `git diff --check` Exit **0**, Quellportal sauber und SHA unverändert. `python3 tools/verify-package.py --report docs/verification/specification-check-p8.json` Exit **0**. Kein Testskip/-fixme in `tests/`/`src/`; gezielte statische Prüfung und Sichtprüfung der Golden-/R-Screenshots durchgeführt. `rg` ohne Treffer liefert Exit 1 als Suchergebnis, keinen behaupteten Testpass.

Vollständiger frischer Linux-Build `docker build -f deploy/Dockerfile --build-arg APP_BASE_PATH=/lab/ --build-arg BUILD_ID=p8-f044f1ef -t datenwerkstatt-p8:verified .` Exit **0** (`p8-clean-docker-build.log`). Image `sha256:690098f7010ca608e1896c32bdc0c9059b52a1f8d3964e3b194fdfa646ef99b2` tatsächlich unter UID `1000870000:0`, read-only/cap-drop ALL/no-new-privileges gestartet; Konfiguration ohne Portalprovider, tiefe Route 200, fehlendes WASM 404, HTTP-Prüfskript Exit **0** (`p8-clean-image.json`).

P8-Dateiinventar: 193 nicht generierte Dateien, SHA-256 `4537f64c4b0acea0c763d52ca73b10172f5ebaa80b4bf294651e6495f12996f3` (`code-fingerprint-p8.json`). Vergleich des frischen Exports mit dem Arbeitsbaum Exit **0**. Ein erster Inventurversuch über das gleichzeitig neu gebaute dist-Verzeichnis endete Exit 1 wegen einer verschwundenen generierten Datei; korrigiert durch Dateiauswahl aus dem unveränderlichen Git-Tree. Produktcodeunterschied seit P7 ausschliesslich `DataSection.tsx`; alle Engine-/Ressourcenbenchmarkdateien unverändert. Der bestandene 20-Zyklen-/10k-/100k-Nachweis bleibt damit gültig; kein unnötiger identischer Benchmarklauf behauptet. Berichtsdokumente entstehen nach dem Kandidatenexport.

P8 frisches Verify: `DW_REUSE_TEST_PORTAL=1 DW_REUSE_DEV_SERVER=1 npm run verify` Exit **0**, **40 Unit, 43 Chromium-Integration, 23 E2E**, Types/Lint/Build bestanden (`p8-clean-verify.log`). Firefox/WebKit-Portalnachlauf `npx playwright test tests/integration/portal.spec.ts tests/integration/archive-portal.spec.ts tests/e2e/portal.spec.ts --project=firefox --project=webkit --workers=1 --reporter=list,json` mit denselben Wiederverwendungsflags Exit **0**, **8/8** (`p8-browser-portal.log/.json`).

P8-Deploymentmatrix unter zusätzlicher gleichzeitiger Funktionsmatrix/Portalprüfung: vier Firefox-Fälle bislang fehlgeschlagen; noch kein Gesamtexit. Trace/Screenshot zeigen reguläre 60s-Init-TIMEOUTs, auch nach bereits erfolgreichem echten Cancel; UI meldet Workerbeendigung statt Erfolg. Ein Netzwerkfall erreicht das 240s-Testbudget. Unveränderte Runtime/Sollwerte/Timeouts; diese Fälle werden nach Ende der anderen Last ohne nebenläufige Funktionssuite erneut geprüft. Eine Lastursache ist bis zu diesem Vergleich eine Hypothese, kein als behoben erklärter Produktfehler. Fehlerauswertung `p8-deployment-failure-analysis.json`; Rohreport bleibt erhalten.

Firefox/WebKit-Funktionsmatrix beendet mit Exit **1**, **123 bestanden/1 fehlgeschlagen**, 0 Skips, 18,0min (`p8-browser-matrix.log/.json`). Der Firefox-Fall mit 350-Zeilen-Transfer, sieben Fresh-Scopes und R-Reset überschritt das unveränderte 120s-Gesamttestlimit. WebKit derselbe Fall bestand in 1,9min, Chromium im Verify ebenfalls. Gezielt erneut ohne parallel laufende andere Suites prüfen; kein Timeout/Sollwert geändert. Alle übrigen 131 Firefox/WebKit-Fälle inklusive der acht separaten Portaltests sind bereits bestanden.


P8 Deployment-Gesamtlauf beendet: `DW_REUSE_TEST_PORTAL=1 npx playwright test --config=playwright.deploy.config.ts --workers=3 --reporter=list,json` Exit **1**, **41/45 bestanden, vier Firefox-Fälle fehlgeschlagen**, 17,6min (`p8-deploy-matrix.log/.json`). Alle Chromium-/WebKit-Deploymentfälle bestanden. Der Screenshot `p8-firefox-init-timeout.jpeg` belegt die konkrete TIMEOUT-Meldung. Letzte unveränderte Kandidatenprüfung erfolgt für den langen Firefox-Funktionsfall und anschliessend alle 15 Firefox-Deploymentfälle ohne nebenläufige Suites; das unveränderte Zeitbudget wird nicht erhöht. Geometrie-/Golden-Daten und Screenshots des frischen Kandidaten separat unter `verification/p8-final/`, ohne historische P7-Belege zu überschreiben.


Gezielte Firefox-Wiederholung: `DW_REUSE_TEST_PORTAL=1 DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/r.spec.ts --project=firefox --grep '350 rows' --workers=1 --reporter=list,json` Exit **0**, **1/1**, 32,4s Testdauer (`p8-browser-r-repeat.log/.json`). Keine andere Browser-/Buildsuite parallel; Code, Assertions und 120s-Limit unverändert. Zusammen mit Verify und Portalnachlauf sind **198 verschiedene Funktionsfälle**, 66 je Chromium/Firefox/WebKit, erfolgreich geprüft. Kein verschwiegenes Runner-Retry: der erste Exit-1-Lauf und dieser bewusste Vergleich stehen getrennt im Bericht.

Safari-WebDriver am Ende erneut versucht: gleiche `session not created`-Antwort, Remoteautomation weiterhin deaktiviert (`p8-safari-session-final.json`). HTTP/curl Exit 0 bleibt Transportergebnis, kein Safari-Pass. Kein Produktionsportal konfiguriert oder verändert; keine Veröffentlichung/kein Remote-CI-Lauf.


**P8 automatisierte Prüfung abgeschlossen; Gesamtabnahme blockiert.** Anschliessend ausschliesslich die drei Firefox-Deploymentprofile ausgeführt: `DW_REUSE_TEST_PORTAL=1 npx playwright test --config=playwright.deploy.config.ts --project=firefox-0 --project=firefox-1 --project=firefox-2 --workers=3 --reporter=list,json` Exit **0**, **15/15**, 2,6min (`p8-deploy-firefox-repeat.log/.json`). Die vorherigen Init-/Testtimeouts traten ohne andere parallel laufende Suites nicht erneut auf. Unveränderte Produktionsbytes, Tests, Sollwerte und Budgets; kein automatisches Retry. PostMessage-Workerende und auto/SAB-Interrupt mit erfolgreicher Folgeausführung bestehen. Der erste Fehllauf wird nicht in einen Exit-0-Lauf umgedeutet; die erfolgreiche, begrenzte Wiederholung ist separat nachgewiesen. Standardbefehle/CI führen Funktions- und Deploymentsuite getrennt aus.

Abschlussumfang **40 Unit, 198 verschiedene Funktionsbrowserfälle (66 je Browser), 45 verschiedene Deploymentfälle (3 Browser × 3 Profile × 5 Fälle)**. Insgesamt keine deaktivierten/übersprungenen Abnahmetests. Vollständiger frischer Verify und Linux-Dockerbuild Exit **0**; Audit 0 bekannte Befunde. [Maschinenlesbare Zusammenfassung](verification/p8-release-results.json) enthält auch die beiden fehlgeschlagenen Erstläufe. Die letzten Code-/Testbytes stimmen mit dem frischen Git-Tree/Fingerprint überein. Berichte nach dem Export ergänzt; kein Commit-SHA für uncommittierten Code behauptet.

P8 / REQ-001–080 / AT-001–072: Dateien `tests/integration/p8-acceptance.spec.ts`, `tests/spike/migration.ts`, `tests/e2e/p8-imports.spec.ts`, `tests/e2e/p8-golden.spec.ts`, `src/features/data/DataSection.tsx`, Testharness-/Serverorchestrierung, [AT-Matrix](ACCEPTANCE_STATUS.md), [Releasecheckliste](RELEASE_CHECKLIST.md), [bekannte Einschränkungen](KNOWN_LIMITATIONS.md). P7 liefert zusätzlich `src/state/workspaceView.ts`, `src/infrastructure/storage/viewState.ts`, `src/ui/Modal.tsx`, Arbeitsflächen/Monaco, Diagnose-/Storageeinstellungen, Runtime-Init-/Freigabepfade, `deploy/`, `.github/workflows/verify.yml`, Asset-/Lizenzskripte und ADR-006–008; Requirements/Tests und tatsächliche Gates stehen im P7-Abschnitt.

**Offen:** echter Safari-Pilot nach manuellem Entsperren/Aktivieren von Remoteautomation; produktive Portal-URL/CORS-/Ingresskonfiguration vor realem Release. Entfernter CI-Lauf/Produktivdeployment nicht ausgeführt, nichts gepusht/veröffentlicht. Quellportal und Spezifikation/Fixtures/Goldenwerte unverändert. Eigene Prüfcontainer/-server/-driver beendet; frischer Kandidatenexport und Fehltraces bleiben als lokaler Diagnosebestand erhalten. **V1 ist nicht vollständig abgenommen.** Nächster konkreter Schritt ist der tatsächliche Safari-Pilot; keine weitere Implementierungsphase vorgetäuscht.

Abschliessende Dokument-/Fixtureprüfung `python3 tools/verify-package.py --report docs/verification/specification-check-p8.json` Exit **0** (80 Requirements, 72 AT, 104 JSON-Dateien), `git diff --check` Exit **0**. Quellportal erneut sauber am dokumentierten SHA; SPEC, AGENTS, Implementierungsplan, Abnahmekatalog und Fixtures haben keinen Diff. `docker ps` bestätigt keine verbliebenen Prüfcontainer.


## P8 — tatsächlicher Safari-Pilot nach Freigabe

Fortsetzung am 4. Oktober 2026. Die Nutzerfreigabe ist erfolgt. WebDriver erreicht Safari, scheitert aber weiterhin beim Erzeugen einer Session (curl-Timeout Exit **28**, danach Transport Exit **0** mit `session not created`; keine bestandenen Tests). Die direkte native Safari-Bedienung funktioniert. [Pilotbericht und Reproduktionsanleitung](SAFARI_PILOT.md).

**Bestanden:** Safari **27.0.1 (22625.1.29.11.28)** auf macOS **27.0.1 (26A434)**; echte DuckDB-/webR-Ausführung mit IndexedDB/OPFS auf eigener Origin 4184. Gemischter öffentlicher/lokaler Import → unverändertes Golden-SQL → vollständiger SQL→R-Transfer → Golden-R → Rück-SQL; PNG **53 679 Bytes**, vollständiges Archiv **107 398 Bytes**. Eigenes Safari-Fenster beendet und neues geöffnet: Metadaten/Code/Läufe ohne Auto-Run, aufbewahrte Daten lesbar; tatsächlicher Archivimport mit neuen IDs und gleichen Werten. R-Endlosschleife in **4 ms** abgebrochen, native `Worker.terminate()`-Aufrufe, Epoche 0→1; neue R-Ausführung liefert **42**, alle Testworker geschlossen. Nativer UI-Check: Monaco-Code, exakte drei Rück-SQL-Zeilen, aufbewahrter R-Plot und Vollbild/Escape. Worker-Close-Events und vollständige Geometriematrix stammen weiter aus den separat dokumentierten automatisierten Browserläufen.

Der erste neue Harness-Vergleich scheiterte an Stringdarstellung `750.0` versus `750`, bei fachlich gleichen Werten. Zwei Fehlberichte bleiben erhalten; der zweite enthält Ist-/Sollwerte. Nur der Test vergleicht jetzt kleine numerische Fixture-Zellen numerisch, Text-IDs und NULL exakt. **Keine Golden-/Produktcodeänderung.** Jeder Versuch erstellt einen neuen Arbeitsbereich; kein vorheriges Nutzer-/Testprojekt gelöscht. Das Nutzerprojekt auf Port 4173 und das Quellportal bleiben unberührt.

Dateien: `tests/safari/index.html`, `pilot.ts`, `server.mjs`, `assert-report.mjs`; [Rohbericht](verification/p8-safari-native-9cc4eeae-dba7-4c6c-a870-909e0bad5595.json), [Safari-Status](verification/p8-safari-status.json). Betroffene Requirements: REQ-017/041/045/048/049/052/053/068/069/077/078/079/080, ergänzend AT-070/072. Keine neue Implementierungsphase begonnen.

Tatsächlich ausgeführt:

| Befehl / Prüfung | Ergebnis |
|---|---|
| `node tests/portal/server.mjs` und `node tests/safari/server.mjs` | Lokale Server gestartet; eigene Safari-Testseite tatsächlich bedient, keine Produktivbereitstellung. |
| `node tests/safari/assert-report.mjs docs/verification/p8-safari-native-9cc4eeae-dba7-4c6c-a870-909e0bad5595.json` | **Exit 0**, Browserbericht mit Golden-/Archiv-/Cancel-Nachweisen validiert; `p8-safari-assert.log`. |
| `npm run typecheck` | **Exit 0**, `p8-safari-typecheck.log`. |
| `npm run lint` | **Exit 0**, `p8-safari-lint.log`. |
| `npx prettier --write tests/safari/...` | **Exit 0**, neue Testdateien formatiert. |
| SHA-256-Abgleich gegen `code-fingerprint-p8.json` | **Exit 0**, sämtliche **193** bereits verifizierten Dateien unverändert; neue Safari-Testdateien ergänzen den Kandidaten. |
| `git diff --check`; Quellportal `git status --porcelain` / `git rev-parse HEAD` | **Exit 0**, keine Whitespacefehler, Quellportal sauber bei dokumentiertem SHA. |

Das frische `npm run verify` bleibt der nachgewiesene Exit-0-Lauf aus dem vorherigen P8-Abschnitt; es wurde für reine zusätzliche Safari-Testdateien nicht nochmals als vollständig ausgeführt behauptet. Keine neue Deployment-/Benchmarkmatrix nötig, da Produkt/Engines/Fixtures bytegleich sind.

**Offen:** Vollständiges Beenden/Neustarten der Safari-App ist noch **nicht ausgeführt**. Der vorbereitete dritte Testbutton prüft danach gespeicherten Code, unveränderte Runs/Herkunft/Diagramme und echte PNG-/Parquetbytes. Nutzerfreigabe angefragt, weil ein anderes geöffnetes Projekt temporäre Ergebnisse enthält. Fensterneustart wird nicht als Prozessneustart umgedeutet; kein zweites frisches Safari-Profil behauptet. AT-072 und V1-Gesamtabnahme bleiben bis zur abschliessenden Bewertung offen. Produktive Portal-/Ingresskonfiguration, externer CI-Lauf und Veröffentlichung bleiben separate, nicht ausgeführte Schritte.


### P8 — Safari-Gate abgeschlossen

Nach ausdrücklicher Nutzerfreigabe „Ja, Safari jetzt neu starten“ Safari über native UI vollständig beendet. Prozess **51578** verschwunden (`pgrep` Exit **1** ohne Treffer, erwarteter Negativnachweis), neue Safari-App mit Prozess **26040** gestartet; ursprüngliche Fenster über „Reopen All Windows from Last Session“ wiederhergestellt. [Prozessbeleg](verification/p8-safari-process-restart.json). Danach dritter Pilotbutton tatsächlich ausgeführt: **bestanden**. Code/Analysen, **5 Runs**, historische Datasetversionen und Diagrammdefinition exakt unverändert; Metadaten/PNG ohne Runtime-Autostart, aufbewahrte PNG-Signatur korrekt und Grösse **53 679 Bytes**, Parquet-Rück-SQL exakt Golden. Keine automatische Skriptausführung. [Neustartbericht](verification/p8-safari-native-199dad27-4394-4105-bb98-4212c6839af2.json).

`node tests/safari/assert-report.mjs docs/verification/p8-safari-native-9cc4eeae-dba7-4c6c-a870-909e0bad5595.json docs/verification/p8-safari-native-199dad27-4394-4105-bb98-4212c6839af2.json` **Exit 0**, `p8-safari-assert-restart.log`. `python3 tools/verify-package.py --report docs/verification/specification-check-safari.json` **Exit 0**. Types/Lint inklusive ergänzendem Neustarttest ebenfalls **Exit 0**. Produktkandidat unverändert; Browser-/Container-/Ressourcennachweise bleiben dem ursprünglichen Dateifingerprint zugeordnet, zusätzliche Testdateien sind separat inventarisiert.

**Gate-Bewertung:** AT-001–072 sind für die dokumentierte Matrix bestanden: vollständige automatisierte Abnahme Chromium/Firefox, zusätzlich Playwright-WebKit, getrennter echter Safari-Pilot mit Golden-Datenpfad, UI, Archiv, Cancel und Prozessneustart. Safari wurde im normalen Profil mit eigener Test-Origin geprüft; kein zweites frisches Safari-Profil und keine vollständige 72-Fälle-Safari-Suite behauptet. Die zweite frische Profilprüfung bleibt der nachgewiesene Chromium-/Firefox-/WebKit-Testumfang. P0–P8 sind damit im vorgesehenen Testprofil technisch abgenommen. Kein pauschales Versprechen aller aktuellen Browser.

**Verbleibende externe Schritte:** bestätigte produktive Portalbasis/Origins und reale Ingressheader konfigurieren und testen, Distributions-/Quellbereitstellungspflichten erfüllen, produktiven Build identifizieren. Remote-CI und Veröffentlichung sind nicht ausgeführt. Die Entwicklungsconfig und ihr sichtbarer Status bleiben unverändert; technische Testabnahme ist keine Produktionsfreigabe. Kein neuer Funktionsabschnitt nötig, nichts gepusht oder veröffentlicht; Quellportal unverändert. Die Safari-Freigabe erfordert vom Nutzer keinen weiteren Schritt.

Abschluss: `npx prettier --check tests/safari`, erneute Paketprüfung nach den Berichtsedits und `git diff --check` jeweils **Exit 0**. [Zusätzlicher Testfingerprint](verification/code-fingerprint-safari.json). Eigene Testserver auf 4174/4184 beendet, kein Driver auf 4191; Nutzer-Devserver **PID 20217/Port 4173** erhalten. Ursprüngliche Safari-Tabs wiederhergestellt, eigene Pilotfenster geschlossen. [Aufräum-/Unverändertnachweis](verification/p8-safari-cleanup.json). Die aufbewahrten synthetischen Pilotprojekte bleiben ausschliesslich auf Origin 4184; keine Browserdaten gelöscht.

Beim Einsammeln des Serverlogs nach Testende wurde ein weiterer **offener Diagnosebefund** sichtbar: Monacos installierter Safari-Clipboard-Workaround meldet zwei `write`-Fehler und eine unbehandelte `Canceled`-Rejection während der Plot-/Escape-Bedienung. [Originalausgabe](verification/p8-safari-server.log), [Einordnung/nächster konkreter Schritt](SAFARI_PILOT.md#offener-diagnosebefund). Die ausgeführten Golden-/UI-/Persistenz-/Cancel-Prüfungen bestanden; kein fehlerfreies Konsolen-/vollständiges Clipboard-Versprechen. Produktbytes unverändert, keine Fehlerunterdrückung und kein ungeprüfter Fix. Nächster technischer Diagnosepunkt ist die Abgrenzung tatsächlicher Copy/Paste-Auswirkungen von Fokus-/Fullscreen-Wechseln. Das ist ein dokumentierter Befund neben der bestandenen Testabnahme, keine vorgetäuschte behobene Ursache.

Serverprozessenden: Fixtureportal nach beabsichtigtem SIGINT **Exit 130**, Safari-Testserver mit eigenem Signalhandler **Exit 0**. Diese Lifecycle-Exits sind keine Browsertestergebnisse.

### Commit-/Push-Vorbereitung

Am 4. Oktober 2026 hat der Nutzer Commit und Push ausdrücklich beauftragt. Ziel ist der vorhandene Branch `main` auf `origin` (`edigonzales/dateninfrastruktur-datenwerkstatt`); `git fetch origin` **Exit 0**, vor dem Commit keine Divergenz. Veralteten Safari-Zwischenstand in der README korrigiert. `python3 tools/verify-package.py`, `git diff --check` und gemeinsame Safari-Berichtprüfung erneut **Exit 0**. Hashvergleich bestätigt sämtliche **193** verifizierten Kandidatendateien plus **4** Safari-Testdateien unverändert. Deshalb kein erneuter vollständiger Engine-/Deploymentlauf behauptet. Commit enthält die Implementierung und ihre Prüfbelege; generierte Runtimeassets, Buildausgaben und Dependencies bleiben ignoriert. Ein Push ist keine Produktivbereitstellung; die oben dokumentierten externen Schritte und der Clipboard-Diagnosebefund bleiben bestehen.

Nach erstmaligem Staging aller neuen Dateien meldet `git diff --cached --check` **Exit 2**: 746 Whitespacehinweise in unveränderten Rohlogs und eine abschliessende Leerzeile im übernommenen webR-Lizenztext. Diese Originalbelege werden nicht nachträglich umgeschrieben. Derselbe Check mit ausschliesslich diesen Rohlogs/Lizenzdateien ausgeschlossen (`git diff --cached --check -- . ':!docs/verification/*.log' ':!licenses/*'`) **Exit 0**; keine übrigen Dateien betroffen. Der vorherige unstaged Check umfasste die damals ungetrackten Dateien noch nicht.

## UI — Designsystem (10. Oktober 2026)

Basisrevision **c1d4bc0**, vor Beginn sauberer Arbeitsbaum. Die historischen
P0–P8-Berichte oberhalb bleiben unverändert. Der neue Kandidat ist über
[Dateifingerprint](verification/design-system/code-fingerprint.json) identifiziert.

### Abschnitt A — Grundlage geliefert

REQ-061–067 / AT-054–058: [Gestaltungsvertrag](DESIGN_SYSTEM.md), README-Verweis,
UI-Folgeabschnitt im Implementierungsplan, Tokens und getrennte Grundlagen-/Komponenten-/Layout-CSS.
Lokale UI-Bausteine in `src/ui/`: Buttons, FormField/Controls, ActionGroup/Toolbar,
SVGs/Tooltips, ActionMenu, Navigation, Modal, Status/Notice, Panelkopf/Leerzustand.
Enginefreie Entwicklungsreferenz unter `/tests/design-system/`; nicht im Produktbuild.

Bootstrap Icons 1.13.1 (MIT), JetBrains Mono 2.304 (OFL) und Originalhinweise lokal.
Frutiger war zunächst mangels dokumentiertem Nutzungskontext zurückgestellt.
Der Projektverantwortliche hat am 10. Oktober die kantonalen Lizenzen und die
Verwendung/Auslieferung bestätigt. Anschliessend hat er ausdrücklich den Bestand
**aus sodata** gewählt: 55Roman/75Black mit CSS-Gewichten 400/700 wie im Portal.
LTCom-Zwischenstand entfernt. [Herkunft und Bestätigung](FONT_PROVENANCE.md),
[bytegenauer Abgleich](verification/design-system/font-source-check.json).

### Abschnitt B — Formulare und Dialoge geliefert

REQ-061/063/064/065/067, AT-055–058: Einstieg, Arbeitsbereichsliste/-details,
Daten-/Portalimport, Archive/Transfers, Einstellungen sowie Start-/Fehler-/Nur-Lesen-
und Sitzungsansichten verwenden gemeinsame Controls und Abstände. Sichtbare Labels,
Hilfen/Fehler, native Pflichtfelder und anklickbare Checkbox-/Radiolabels.
„Neuer Arbeitsbereich“ primär, „Projekt öffnen“ gemeinsamer sekundärer Dateiauslöser;
Wartung getrennt. Dialogfüsse mit 8px-Aktionsgruppen, bestehende Schliessregeln erhalten.

### Abschnitt C — Navigation und Arbeitsflächen geliefert

REQ-061–067 / AT-054–058: Sidebar mit lokalen Bootstrap-SVGs, Tooltip, Marker und
`aria-current`; Breiten 52/212 px. SQL/R: Analysename → Ausführen/Abbrechen → Speichern
→ Ansicht → Weitere Aktionen. Layout-/R-Reset im Tastaturmenü. Kompakte Ergebnis-/Paging-/
Plotaktionen, tatsächliche Layoutmessung, einblendbare Parameter. Vollbildgrafiken
halten die Grafik und ihre Aktionen gemeinsam sichtbar. Weisser Hintergrund,
Frutiger-Labels und JetBrains Mono auch in Monaco; keine globalen Control-Regeln in Monaco.
Domain, Engine-Lebenszyklen, Speicherformate, Contracts und Goldenwerte unverändert.

### Abschnitt D — Bereinigung und Abnahme geliefert

REQ-061–067, REQ-078 / AT-054–058 sowie fachliche Regressionen: abgelöste globale
Control-Regeln entfernt, lokale Font-/SVG-Dateien mit Originalhinweisen und
Inventar ausgeliefert. Bootstrap-Pfade und Frutiger-Dateien sind mit ihren
Originalen abgeglichen. Keine Buildabhängigkeit auf Nachbarrepositories.

Abschliessender Kandidat: Basis **c1d4bc0**, uncommittierter Arbeitsbaum mit
[196 Dateihashes](verification/design-system/code-fingerprint.json);
[Abgleich nach Testende](verification/design-system/fingerprint-check.json)
**Exit 0, alle Dateien unverändert**. Ausgeführte Befehle:

- `npm run verify` **Exit 0**: Types, Lint, Build, **40 Unit-, 43 Integrations-
  und 26 Chromium-E2E-Tests**. [Log](verification/design-system/verify-complete.log).
- `npx playwright test --project=firefox --project=webkit tests/e2e/design-system.spec.ts tests/e2e/p7-ui.spec.ts`
  **Exit 0, 14 bestanden**; übrige neun E2E-Dateien mit denselben Browserprojekten
  **Exit 0, 38 bestanden**. Damit vollständige Suite **26/26 je Browser**.
  [UI-Log](verification/design-system/cross-browser-ui-complete.log),
  [Regressionslog](verification/design-system/e2e-regression-matrix.log),
  [vollständige Befehle](verification/design-system/README.md#ausgeführte-prüfungen).
- `DW_REUSE_TEST_PORTAL=1 npx playwright test -c playwright.deploy.config.ts tests/deployment/static.spec.ts`
  **Exit 0, 27 bestanden**: drei Browser × drei Profile, `/` und `/lab/`,
  echte SQL/R-Engines, CSP/MIME/Cache, lokale SVGs/Fonts, absichtlicher
  Fontladefehler mit Systemfont-Fallback, Lizenzinventar und keine externen
  Font-/Iconabrufe. [Log](verification/design-system/deployment-final.log).
- `python3 tools/verify-package.py --report docs/verification/design-system/package-check.json`
  **Exit 0**: Dokumentlinks, Beispiele, Requirement-/Testabdeckung und dokumentierte
  Fonts. [Bericht](verification/design-system/package-check.json).
- Prettier auf allen geänderten UI-/Testdateien und `git diff --check` jeweils
  **Exit 0**. [Formatlog](verification/design-system/format-final.log).
- Nativer Safari 27.0.1: Fonts, Fokusfang/-rückgabe, Menüs, echter 200-%-Zoom
  und Plot-Vollbild manuell geprüft; [Scope und Befunde](verification/design-system/safari-smoke.md).

Gemessene Geometrie in den drei Browsern: Header 56 px, Sidebar 52/212 px,
Analysebedienung SQL 81 px / R 88 px, Arbeitsflächen über 75 % Viewporthöhe
und volle verfügbare Breite. 8 px Aktions-/Labelabstände einschliesslich Umbruch;
SQL bei 900 px Höhe mit rund 328 px Editor und 400 px Resultat. Neue PNG-/JSON-
Belege liegen ausschliesslich unter `docs/verification/design-system/`.

Der [UI-Abnahmebericht](verification/design-system/README.md) dokumentiert auch
fehlgeschlagene Zwischenversuche und ihre Korrekturen: DOMRect-Rundung und
FontFace-Verhalten zwischen Browsern, fehlendes Speichern im neuen Deploymenttest,
Firefox-Umbruch des R-Lauf-Labels sowie deaktivierte SQL-Revisions-Live-Ansagen.
Der statische Assetlauf liegt vor den letzten beiden rein lokalen UI-Korrekturen;
Assets/Buildpfade blieben unverändert. Verify und vollständige E2E-Matrix liefen danach.
Historische P0–P8-Berichte, Goldenwerte und beide Referenzrepositories sind unverändert.

Offene Grenzen: kein neuer vollständiger nativer Safari-Engine-/Persistenzlauf und
keine erneute Ressourcenbenchmark-Abnahme in diesem UI-Auftrag; der bereits
bekannte Monaco-/Safari-Clipboard-Diagnosebefund bleibt ausdrücklich offen.
Der zusätzliche breite Prettier-Check über ganz `src` fand eine schon vorhandene
Abweichung in `src/infrastructure/catalog/ExploreContext.ts` (Exit 1, Datei unverändert).
Keine offenen Implementierungspunkte im vereinbarten Designsystem-Umfang.
Nächster konkreter Schritt ist die gestalterische Durchsicht anhand des neuen
Abnahmeberichts; Commit, Push und Veröffentlichung wurden nicht ausgeführt.

### UI-Commit und Push

Am 10. Oktober 2026 hat der Nutzer Commit und Push ausdrücklich beauftragt.
Ziel: bestehender Branch `main`, Remote `origin`
(`edigonzales/dateninfrastruktur-datenwerkstatt`). `git fetch origin` und
`git diff --check` Exit 0; vor dem Commit keine Divergenz (0/0).
Erneuter Hashabgleich: alle 196 geprüften Code-/Test-/Fixture-Dateien unverändert.
Die oben dokumentierten erfolgreichen Tests gelten damit weiterhin; kein
zusätzlicher Testlauf behauptet. Commit umfasst Designsystem, UI-Migration,
Originalassets, Herkunfts-/Lizenzdokumentation und getrennte Prüfbelege.

### UI-Fix — SQL-/R-Navigation linksbündig (14. Oktober 2026)

**Geliefert und verifiziert:** `src/styles/app.css` setzt für
`.sidebar.expanded .dw-nav-item` explizit `justify-content: flex-start` und
`text-align: left`. SQL/R-Buttons übernehmen damit nicht mehr die Zentrierung
des allgemeinen Button-Stils. Bezug: Navigation aus REQ-061/066/067 und
Designsystem, gezielte Geometrie-/Semantikregression zu AT-054/055/058.

Prüfstand: Basis **45de19b4181983ea53cad27eab93a1aabbc7f6b9**, uncommittierte
CSS-Korrektur; SHA-256 von `src/styles/app.css`:
`93e0091c426746e78f634e46ab263fc898a891fa90a8be44e8971786e6c96f16`.
Node **22.23.1**, npm **11.18.0**. Echte ausgeführte Befehle:

- Aus `/tmp/datenwerkstatt-nav-align-H75tmU`:
  `DW_REUSE_DEV_SERVER=1 node /Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/node_modules/@playwright/test/cli.js test --config=/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/playwright.config.ts --project=chromium --project=firefox --project=webkit --reporter=list /Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/tests/e2e/design-system.spec.ts`
  **Exit 0, 9/9 Tests bestanden**. Derselbe lokale Vite-Arbeitsbaum wurde
  wiederverwendet; Screenshots/JSON gingen ins temporäre Verzeichnis,
  historische Abnahmebelege blieben unverändert.
- Dort `node navigation-geometry.mjs` **Exit 0, 6/6 Prüfungen bestanden**:
  Chromium/Firefox/WebKit bei **1440×900** und **1280×800**. Alle sechs
  Navigationseinträge: Icon links bei **15 px**, Text links bei **43 px**,
  Sidebar **212 px**. Ohne die neue Regel wurde die vorherige SQL-/R-Zentrierung
  reproduziert. Eingeklappte Sidebar **52 px** und Iconpositionen exakt
  unverändert. PNGs erstellt; Chromium/1440 und WebKit/1280 visuell geprüft.
  Der erste Messlauf hatte **Exit 1**, weil der Prüfcode eingeklappte mit
  ausgeklappten Positionen verglich; Vergleich auf eingeklappt vor/nach
  Entfernen der neuen Regel korrigiert, Produktcode unverändert.
- `npm run typecheck && npm run lint && npx prettier --check src/styles/app.css && git diff --check`
  **Exit 0**.

Temporäre Logs, Messskript, JSON und Screenshots:
`/tmp/datenwerkstatt-nav-align-H75tmU`. Keine neuen Repositorytests oder
Dependencies. `npm run verify`, Deployment-/Engine-/Ressourcenprüfungen und
nativer Safari-Smoke für diesen kleinen CSS-Fix **nicht erneut ausgeführt**;
keine neue vollständige V1-Abnahme behauptet. Keine Blocker. Nächster Schritt:
reguläre gestalterische Durchsicht gemäss Designsystem-Abnahme; der angeforderte
Navigationsfix ist abgeschlossen.

### UI-Fix — Tooltip-Position und Flackern (14. Oktober 2026)

**Geliefert und für Tooltips verifiziert:** REQ-061/066/067, gezielte Regression
zu AT-054/055/058. `src/ui/Controls.tsx` steuert Sichtbarkeit nach abgeschlossener
Messung, 250-ms-Hover, sofortigen Tastaturfokus, Escape/Klick/Fokusverlust,
abbrechbare Timer und einen aktiven Auslöser pro Dokument. Rechte Platzierung
mit 8 px Abstand und vertikaler Zentrierung, Links-Ausweichung und Viewportrand;
Scroll-/Resize-/Grössenänderungen aktualisieren die Position. CSS zeigt keine
Tooltips mehr selbstständig durch Hover oder Mausfokus.

Implementiert: `src/ui/Controls.tsx`, `src/styles/components.css`; echte
Browserregressionen in `tests/e2e/design-system.spec.ts`, Unmount-Prüfmöglichkeit
ausschliesslich in der enginefreien Entwicklungsreferenz. Gestaltungsvertrag
aktualisiert. SQL-/R-Linksbündigkeit unverändert. Basis
**45de19b4181983ea53cad27eab93a1aabbc7f6b9**, uncommittierter Arbeitsbaum;
[Dateihashes und Abgleich nach Testende](verification/tooltips/code-fingerprint.json)
belegen den geprüften Code. Node 22.23.1, npm 11.18.0.

Ausgeführte Befehle, aus `/tmp/datenwerkstatt-tooltips-chZKkC` mit
`DW_REPO=/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt`:

- `DW_REUSE_DEV_SERVER=1 node "$DW_REPO/node_modules/@playwright/test/cli.js" test --config="$DW_REPO/playwright.config.ts" --project=chromium --project=firefox --project=webkit --reporter=list "$DW_REPO/tests/e2e/design-system.spec.ts"`
  **Exit 0, 18/18 bestanden**. [Finaler Log](verification/tooltips/design-system-final.log).
- Derselbe Aufruf mit zusätzlich `"$DW_REPO/tests/e2e/p7-ui.spec.ts"`:
  **Exit 1, 27 bestanden / 3 gescheitert**.
  [Breitere Matrix](verification/tooltips/browser-matrix-second.log).
  Reale SQL-Ausführung, Auswahl-Snapshot, Routen/Viewzustand und die Tooltipfälle
  bestanden; die drei SQL/R-Geometriefälle scheitern erst beim R-Start.
- Aus dem Repository: `npm run assets:prepare` **Exit 1**. Basis-DuckDB/webR
  und geprüfte DuckDB-Erweiterungen vorbereitet; Paketmirror lehnt Upstream-Index
  ab: `bit64` erwartet **4.8.2**, gefunden **4.8.6**. Pins/Prüfsummen/Skripte
  unverändert. [Console-Ausgabe](verification/tooltips/assets-prepare.log),
  [R-Fehlerdiagnose](verification/tooltips/r-init-failure.md).
- `npm run typecheck && npm run lint && npx prettier --check src/ui/Controls.tsx src/styles/components.css tests/e2e/design-system.spec.ts tests/design-system/reference.tsx docs/DESIGN_SYSTEM.md && git diff --check`
  **Exit 0**. Prettier auf denselben Dateien mit `--write` **Exit 0**.

Die separaten [Tooltip-Belege](verification/tooltips/README.md) enthalten
Screenshots, Geometrie, Frames und fehlgeschlagene Zwischenläufe mit deren
Korrekturen. Kein erfasster Frame mit falscher Position oder mehreren Tooltips.
Hover-/Timer-/Unmount-/Escape-/Fokusfälle in allen drei Browsern bestanden;
WebKit auf macOS mit nativer Option+Tab-Bedienung. Zielviewports 1440×900 und
1280×800 sowie enge Ansichten 720×300/450. Neue PNGs visuell geprüft;
historische Belege unverändert.

**Verbleibende Abnahmegrenze:** R-Paketmirror fehlt wegen des Indexkonflikts;
keine vollständige P7-Matrix bestanden. Nächster konkreter Schritt für diese
Abnahme: passenden gepinnten Mirror wiederherstellen und die drei R-Geometriefälle
erneut ausführen. `npm run verify`, Deployment-/Ressourcenprüfungen und nativer
Safari-Smoke **nicht erneut ausgeführt**. Kein neuer V1-Release-Nachweis.

### UI-Fix — Linke Akzentstriche entfernt (14. Oktober 2026)

**Geliefert und verifiziert:** gestalterische Präzisierung zu REQ-065/066/067,
gezielte UI-Prüfung zu AT-054/055/058. `src/styles/components.css` entfernt den
linken Rahmen aller Notice-Töne; `src/styles/app.css` entfernt den Rahmen der
Fehlerbanner und das Pseudoelement der aktiven Navigation. Getönte Flächen,
Text-/Iconfarben, Innenabstände, Abrundungen, Meldungstexte, Rollen,
`aria-current` und Tastaturfokus erhalten. Gestaltungsvertrag aktualisiert;
keine API-/Domain-/Engine-/Speicheränderung und keine neuen Repositorytests.

Prüfstand: Basis **2d3632ae0ad971462a60058c94052327ced83563**, uncommittierte
CSS-Korrektur mit [Dateihashes](verification/borderless-ui/code-fingerprint.json).
Echte ausgeführte Befehle:

- Aus `/tmp/datenwerkstatt-borderless-yRXOu4`, mit
  `DW_REPO=/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt`:
  `DW_REUSE_DEV_SERVER=1 node "$DW_REPO/node_modules/@playwright/test/cli.js" test --config="$DW_REPO/playwright.config.ts" --project=chromium --project=firefox --project=webkit --reporter=list "$DW_REPO/tests/e2e/design-system.spec.ts"`
  **Exit 0, 18/18 Tests bestanden**.
- Dort `node verify-borderless.mjs` **Exit 0, 18/18 Layoutszenarien bestanden**:
  vier Meldungstöne und tatsächlicher globaler Namensfehler, aktive Navigation
  eingeklappt/ausgeklappt, 1440×900/1280×800, Chromium/Firefox/WebKit. Linke
  Rahmenbreiten 0 px, kein erzeugter Navigationsmarker; Farben und Padding wie
  zuvor, Fokus 3 px blau. Erster Messlauf **Exit 1** wegen fehlendem Blur im
  Prüfablauf; Fokuswechsel ergänzt, Sollwerte und Produktcode unverändert.
- `npm run typecheck && npm run lint && npx prettier --check src/styles/app.css src/styles/components.css docs/DESIGN_SYSTEM.md && git diff --check`
  **Exit 0**.

[Prüfbericht, JSON und neue Screenshots](verification/borderless-ui/README.md)
liegen separat von historischen Belegen. Alle 18 Ansichten visuell in der
Übersicht geprüft; Chromium/1440 zusätzlich in Originalgrösse. Keine offenen
Punkte für diesen CSS-Fix. Nächster konkreter Schritt: reguläre gestalterische
Durchsicht; die zuvor dokumentierte R-Mirror-Abhängigkeit bleibt separat offen.
`npm run verify`, Engine-/Deployment-/Ressourcenprüfungen und nativer Safari-Smoke
für diesen Fix **nicht erneut ausgeführt**; keine neue V1-Fertigmeldung.

### UI — Einstellungen links und Schliessen-SVG (14. Oktober 2026)

**Geliefert, gezielte UI-Prüfungen bestanden:** REQ-061/064–067, Regression zu
AT-054/055/057/058. `src/app/router.tsx` verwendet eine gemeinsame Navigation
auf Arbeitsbereichsliste, Einstellungen, Portaleinstieg und im Projekt.
Einstellungen mit vorhandenem Gear-SVG direkt nach R; im Header entfernt.
Ohne geöffnetes Projekt erscheinen nur globale Ziele. Einklappen, aktive Route,
Tooltip und gespeicherte Projektansichten erhalten; globales Umschalten bleibt
sitzungslokal. Der globale Fehlerhinweis nutzt den vorhandenen IconButton mit
x-lg-SVG, blau, 40×40 px, rechts und auch bei mehrzeiligem Text vertikal mittig.
Layout in `src/styles/app.css`, Gestaltungsvertrag aktualisiert; keine neuen
Dependencies, öffentlichen Schnittstellen oder Speicherformate.

Neue Browserregressionen in `tests/e2e/navigation.spec.ts`, zusätzliche
Navigationseinträge in bestehender Designsystem-/Deploymentprüfung berücksichtigt.
Prüfstand: Basis **b117b80ffcc644d662582ef92461d0ad769e28e1**, uncommittierter
Arbeitsbaum; [Hashes, tatsächliche Befehle und Belege](verification/navigation-settings/README.md).
Node **22.23.1**, npm **11.18.0**:

- `npm run verify` **Exit 1**: Typecheck, Lint/Modulgrenzen und **40 Unit-Tests**
  bestanden; Build stoppt beim bekannten Paketmirror-Konflikt bit64
  **4.8.2 erwartet / 4.8.6 gefunden**. Integrations-/E2E-Stufen nicht erreicht.
- Playwright mit `navigation.spec.ts`, `design-system.spec.ts`, `workspaces.spec.ts`
  und `p7-ui.spec.ts` über Chromium/Firefox/WebKit **Exit 1**:
  **51 bestanden / 3 gescheitert**. Alle **9 neuen UI-Fälle** bestanden;
  die drei SQL/R-Geometriefälle scheitern beim R-Start am fehlenden Mirror-Lock-JSON.
  Historische PNGs/JSON unverändert; neue Nachweise separat gespeichert.
- Betroffene reguläre Deploymenttests **Exit 1 vor Browserstart**:
  Lizenzinventar kann das fehlende gepinnte R6-Archiv nicht lesen; Tests nicht ausgeführt.
- Zusätzlicher Frontendbuild unter `/lab/` **Exit 0** und gebündelter
  Navigations-/Schliessen-Smoke **3/3 Browser bestanden, Exit 0**. Direktaufruf,
  Reload und Basispfade geprüft; kein Ersatz für Container-/CSP-Abnahme.
- Abschliessender Typecheck, Lint/Modulgrenzen, Prettier der geänderten Code-/
  Gestaltungs-/Testdateien sowie des neuen Berichts und `git diff --check`
  **Exit 0**. Paket-/Dokumentlinkprüfung **Exit 0**;
  Dateihashabgleich nach Testende **Exit 0**.

1440×900, 1280×800 und CSS-Zoom 200 % geprüft. Zwölf Geometriefälle bestätigen
Zentrierung, 40×40-px-Bedienfläche, Farbe und Textumbruch ohne Überbreite.
Vorprüfung der neuen Tastaturfälle wurde von programmatischem Fokus auf echte
Tab-Navigation korrigiert; vollständige Einordnung im verlinkten Bericht.
Kein neuer vollständiger Engine-/Ressourcenlauf oder nativer Safari-Smoke.
Der beauftragte UI-Umfang ist umgesetzt. Nächster technischer Abnahmeschritt:
gepinnten Mirror wiederherstellen und die blockierten Gesamt-/Deployment- und
R-Geometrieprüfungen erneut ausführen. Kein Commit, Push oder Release ausgeführt.

### Commit-/Push-Vorbereitung (15. Oktober 2026)

Der Nutzer hat Commit und Push dieses UI-Abschnitts ausdrücklich beauftragt.
Ziel: bestehender Branch `main`, `origin` unter
`sogis/dateninfrastruktur-datenwerkstatt`. `git fetch origin` und
`git diff --check` **Exit 0**; keine Divergenz zu `origin/main`.
Hashabgleich aller sechs Dateien des geprüften Produkt-/Testkandidaten
**Exit 0, unverändert**. Deshalb keine erneuten Engine-/Browserläufe für die
Commitvorbereitung; die oben dokumentierte webR-Mirror-Abhängigkeit und die
fehlgeschlagenen Gesamt-/Deploymentprüfungen bleiben bestehen.

`git diff --cached --check` **Exit 2** ausschliesslich wegen Whitespace in den
drei unveränderten Originalausgaben `browser-matrix.log`, `deployment.log` und
`lab-build.log`. Derselbe Check mit genau diesen drei Rohlogs ausgeschlossen
**Exit 0**; Prüfbelege werden nicht nachträglich umgeschrieben.
`python3 tools/verify-package.py --report /tmp/datenwerkstatt-navigation-commit-package-check.json`
**Exit 0**. Commit enthält UI, Regressionstests, Dokumentation und separate
Prüfbelege; der anschliessende Push ist keine Produktivbereitstellung.

### UI — Projekte und nachvollziehbare Beziehungen (15. Oktober 2026)

**Geliefert und verifiziert am 16. Oktober 2026.** REQ-011–015/059–067, AT-006/018/054–058. Die drei beauftragten Abschnitte sind implementiert: einheitlicher Projektbegriff und `/projects` ohne Legacy-Aliase, getrennte Übersicht/Daten sowie lesbare Datenstände, Herkunft und Laufdetails. Domain-IDs, IndexedDB/OPFS, Locks und Archivformat bleiben unverändert. Der [Liefer- und Prüfbericht](verification/projects/README.md) enthält Zuordnung, Screenshots, Grenzen und die unveränderten Originalausgaben.

Basisrevision `f460278a351aedafe667990e6dbfd164105a1301`; Quellbaseline `sogis/datenportal-sodata` am Commit `6b45fc4e22116fba8fc00bd48175e347aa740562`, ausschliesslich gelesen. Aktueller [Codefingerprint](verification/projects/code-fingerprint.json): **`45dae17f976e1d77d4df5a42398463bc5fd11ef70997d16e3a816659c0b0b96a`**, **169 Dateien**. Node 22.23.1, npm 11.18.0.

#### Umgesetzte Abschnitte

| Abschnitt / Requirements                          | Konkrete Dateien                                                                                                                                    | Geliefertes Verhalten und tatsächliche Prüfung                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Projektbegriff und Routen — REQ-060/061/067    | `src/app/router.tsx`, `scripts/deployment.mjs`, `SPEC.md`                                                                                           | Einheitliche Begriffe und Navigation, kanonische Direktaufrufe/Reload unter Root und `/lab/`, kontrollierte ungültige IDs und alte URL-/Asset-404. [Gezielte statische Routenprüfung](verification/projects/deployment-routes-focused.log): **2/2, Exit 0**; reguläre Deploymentmatrix **63/63, Exit 0**.                  |
| 2. Übersicht und Daten — REQ-059/061/066/067      | `src/features/workspaces/Workspaces.tsx`, `src/features/data/DataSection.tsx`                                                                       | Eigene Seiten, Projektangaben/Analysen/kompakte Datenliste in der Übersicht, Import und Verwaltung auf Daten; gemeinsame SQL/R-Sitzung, Autosave und Navigationsschutz. In der E2E-Matrix mit **111/111, Exit 0** geprüft; Geometrie, History/Cursor/Undo und verzögertes Editorladen zusätzlich **9/9, Exit 0**.          |
| 3. Beziehungen und Herkunft — REQ-011–015/062/063 | `src/features/data/DatasetHistory.tsx`, `src/features/results/RunDetails.tsx`, `src/features/sql/SqlWorkbench.tsx`, `src/features/r/RWorkbench.tsx` | Unveränderliche Datenstände und lesbare Datei-/Portal-/Ergebnisherkunft; eingefrorene Läufe mit konkreten Eingaben, Ergebnissen und ehrlicher Verfügbarkeit. **7/7** reine Herkunfts-/Renderfälle innerhalb der **47 Unit-Tests**, ergänzt durch reale Integrations- und E2E-Abläufe; alle genannten Prüfungen **Exit 0**. |

#### Aktueller Prüfstand

- `DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 0**, TypeScript/Lint/Modulgrenzen, **47 Unit-/Regressionstests**, Produktionsbuild, **43 Chromium-Integrationen und 37 Chromium-E2E** bestanden ([Log](verification/projects/verify.log)).
- Zusätzliche Firefox-/WebKit-E2E-Matrix: **74/74, Exit 0**, je 37 Fälle; mit Chromium **111/111 E2E** ([Log](verification/projects/browser-matrix.log), [JSON](verification/projects/browser-matrix.json)).
- Geometrie, History-/Cursor-/Undo-Wiederherstellung und verzögertes Editorladen in drei Browsern: **9/9, Exit 0** ([Log](verification/projects/editor-focus-intent-regression.log)).
- Gezielte statische Routenprüfung Root und `/lab/`: **2/2, Exit 0** ([Log](verification/projects/deployment-routes-focused.log)). Nach der ausschliesslichen Korrektur der Deployment-Testvorbereitung blieben Produkt-, Engine- und E2E-Code unverändert.
- `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/deployment.json npm run test:deployment -- --reporter=list,json`: **Exit 0, 63/63 bestanden**, je sieben Fälle in allen neun Browser-/Basispfadprofilen; keine Flakes oder übersprungenen Fälle ([Log](verification/projects/deployment.log), [JSON](verification/projects/deployment.json)).
- Typecheck/Lint nach den ausschliesslichen Deployment-Testvorbereitungskorrekturen **Exit 0**; [Prüfzahlen](verification/projects/checks-summary.json) und [Dateiabgleich](verification/projects/final-check.json) bestätigen den finalen Stand und unveränderte Schutzbereiche. Nächster konkreter Schritt: fachliche Sichtung unter `/projects`; keine weitere Implementierungsphase innerhalb dieses abgeschlossenen Auftrags. Kein Commit, Push oder Release ausgeführt.

Der gepinnte lokale webR-Mirror ist aus dem vorhandenen Image exakt wiederhergestellt (**44/44 Original-SHA-256-Pins**, keine Skript-/Pin-/Lockfileänderung). Ein frischer Neuabruf aus dem veränderten Upstreamindex bleibt eine separate Abhängigkeit. Keine Versionswiederherstellung, globale Ergebnisverwaltung oder zusätzlichen Historienrouten. Nativer Safari-Pilot und Ressourcenbenchmark wurden für diesen UI-Abschnitt nicht erneut ausgeführt.

#### Ausführungsprotokoll dieses UI-Abschnitts — zeitlicher Verlauf mit Zwischenfehlern

Die folgenden Einträge bewahren die damaligen Kandidaten, offenen Zwischenstände und tatsächlich ausgeführten Befehle; der aktuelle Stand steht oberhalb.

**In Arbeit:** REQ-011–015/059–067, AT-006/018/054–058. Nutzerfreigabe: einheitlicher Projektbegriff, getrennte Übersicht/Daten, lesbare Herkunft und Laufdetails, `/projects` ohne Legacy-URLs. Domain-IDs, IndexedDB/OPFS/Locks/Archivformat unverändert.

Basis: `f460278` (vor Beginn sauber), Node 22.23.1, npm 11.18.0. Spezifikation/Verträge/Abnahme und bestehende P7/UI-Nachweise gelesen. Originalbaseline am dokumentierten Commit unter dem inzwischen verschobenen Pfad `/Users/stefan/sources/datenportal/datenportal-sodata` gelesen; Quellbaum sauber, keine Änderung/Übernahme/Versionsaktualisierung.

Abschnitt 1: Route-/Textumstellung und Caddy-Fallback vorbereitet. Abschnitt 2: eigene Projektübersicht/Datenseite in Arbeit. Abschnitt 3: metadatenbasierte Datenstände/Herkunft und gemeinsame SQL/R-Laufdetails in Arbeit. Tests werden an die fachlich beschlossenen Seiten-/Routenziele angepasst; keine Goldenwerte geändert.

Zwischenprüfung nach Integration von Abschnitt 1/2: `npm run typecheck && npm run lint && npm run test:unit` **Exit 0**, 40 Unit-/Regressionstests. Strukturprüfung `python3 tools/verify-package.py --report /tmp/datenwerkstatt-projects-package-check.json` **Exit 0** (keine Engineabnahme). Komponenten- und Dokumentformatierung **Exit 0**; Abschlussprüfung folgt auf stabilem Kandidaten.

Die bisherige webR-Mirrorblockade ist lokal behoben: vorhandenes Image `datenwerkstatt-p8:verified`, nur dessen originale Paketdateien nach ignoriertem `public/vendor/webr-packages` kopiert. Alle **44 vorhandenen SHA-256-Pins einschliesslich Indizes und lock.json stimmen**; `node scripts/prepare-r-packages.mjs` **Exit 0**. Keine Paket-/Lock-/Prüfsummenänderung. [Wiederherstellungsnachweis](verification/projects/mirror-recovery.json).

Nächster Schritt: fokussierte Browserprüfungen, gemeinsame Laufdetails abschliessen, danach vorgeschriebene Gesamtläufe und tatsächliche Ergebnisse dokumentieren.

Zwischenprüfung Abschnitt 3: gemeinsame Laufdetails und ehrliche Datei-/Hashverfügbarkeit integriert, sieben reine Darstellungs-/Präzisions-/Herkunftsfälle (`npx vitest run tests/unit/provenance.test.ts`) **Exit 0, 7/7**. Reviewbefund korrigiert: eine leere Inventur darf einen expliziten Missing-/Corrupt-Nachweis nicht überdecken. `npm run build` **Exit 0**, Original-Runtimeassets und 40 gepinnte R-Pakete validiert, Lizenzinventar erzeugt ([Buildlog](verification/projects/build-initial.log)).

Erste fokussierte Browserläufe: **13/16** bzw. **8/10 bestanden**, beide **Exit 1**. Neue Textannahmen wurden an die abschliessende Darstellung angepasst; Schema bleibt bei fehlenden Daten lesbar, deshalb wird Nichtverfügbarkeit anhand fehlender Datenzeilen/deaktivierter Aktionen statt fehlendem Schema geprüft. Monaco-Undo bestand unverändert nach Ende paralleler HMR-Änderungen. Die neue Speicherfehlerinjektion wird auf die tatsächlich aktive Repositoryinstanz begrenzt und auf erreichten Commit geprüft; kein verdecktes Abschwächen der Speichersicherung. Abschliessende Wiederholung/Gesamtläufe noch offen.

Fokussierter Abschluss: neue Projektabläufe **4/4, Exit 0** mit tatsächlicher App-Sitzung, echtem SQL/R, Versionshistorie, Speicherfehler/Retry und Recipe-Herkunft. Der zusätzliche zwischenzeitliche Lauf mit **3/4, Exit 1** legte den falschen Testmodulimport offen. Browserauswertungen verwenden nun einen Testharness mit statischem Reexport der App-Services; Vite lädt dadurch dieselbe modulversionierte Instanz wie die Oberfläche. Kein Produktions-Testhook und keine geänderte Lockregel.

Erstes vollständiges `DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 1**; Typecheck/Lint, **47 Unit-Tests** und Build bestanden, **41/43 Chromium-Integrationen** bestanden, E2E-Stufe nicht erreicht ([Originalausgabe](verification/projects/verify-initial.log)). Die beiden Fehler: Projektüberschrift wurde noch auf der neuen Datenseite gesucht; dynamischer Testimport erzeugte nach HMR eine zweite Servicesinstanz und erhielt zu Recht nur Leserechte. Navigation/Testharness korrigiert, unveränderte Orphan-/Fremddatei-/Tabtod-/Hash-/Lock-Assertions erhalten. Gezielte Wiederholung mit `DW_REUSE_DEV_SERVER=1 node node_modules/@playwright/test/cli.js test --project=chromium tests/integration/imports.spec.ts tests/integration/recovery.spec.ts --grep 'reload finds true orphans|tab death interrupts real query' --reporter=list`: **Exit 0, 2/2**.

Visuelle Zusatzprüfung: echte SQL- und R-Ausführung, lesbare Details und erreichbare Scrollenden, keine Console-/Page-Errors, keine horizontale Überbreite. Eigenes temporäres Profil/OPFS-Namespace bereinigt; [Geometrie](verification/projects/chromium-run-details-qa.json). Die geforderten Gesamtläufe laufen erneut auf dem stabilen Kandidaten.

Fortsetzung am 16. Oktober 2026: zweiter Gesamtlauf **Exit 1**, Typecheck/Lint/**47 Unit**/Build/**43 Integrationen** bestanden, **35/36 Chromium-E2E** bestanden ([Originalausgabe](verification/projects/verify-before-portal-selector.log)). Ein Portaltest fand denselben Verfügbarkeitstext zusätzlich in der eingeklappten Historie und scheiterte an Playwright Strict Mode. Der Selektor ist nun auf den sichtbaren Status der Datensatzzeile begrenzt; Statusinhalt und Produktcode unverändert. Gezielter `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/portal.spec.ts --reporter=list`: **Exit 0, 1/1**. Vollständiges Verify erneut gestartet.

**Verify-Abschluss am 16. Oktober 2026 bestanden:** `DW_REUSE_DEV_SERVER=1 npm run verify` **Exit 0**, **47 Unit-/Regressionstests, Build, 43 Chromium-Integrationen und 36 Chromium-E2E**, TypeScript/Lint/Modulgrenzen ebenfalls bestanden ([Log](verification/projects/verify-before-editor-focus.log)). Kandidat `94ab1e5d92b7380cb8b1c760c1726190bb8f9603424848215ef975dcd787a980` über 169 Dateien ([Inventar](verification/projects/code-fingerprint-before-editor-focus.json)). Firefox-/WebKit-E2E und reguläre Deploymentmatrix stehen noch aus; noch kein Abschluss dieses UI-Abschnitts behauptet.

Erste vollständige Firefox-/WebKit-E2E-Matrix: **Exit 1, 71/72 bestanden** (Firefox 36/36, WebKit 35/36; [Originalausgabe](verification/projects/browser-matrix-before-editor-focus.log)). Die unveränderte WebKit-Geometrieprüfung deckte einen echten Fokusfehler auf: der verspätet geladene Monaco-Editor schloss ein inzwischen bedientes Aktionsmenü durch Fokusübernahme. Kontrolliert verzögerte echte Modulantworten reproduzieren die Ursache ([Fokusbeleg](verification/projects/webkit-editor-focus-qa.json)); ein Guard in `src/ui/CodeEditorImpl.tsx` erhält den vorhandenen Menüfokus. Ein zusätzlicher deterministischer E2E-Fall prüft Modulverzögerung, Menüfokus und ausgeführten Reset. Bestehende Geometrieassertions, Timeouts, Paketpins und Goldenwerte unverändert. Verifikation des finalen Kandidaten folgt.

Fokusnachprüfung: ursprüngliche SQL/R-Geometrie in allen drei Browsern bestanden; der erste neue Fokuslauf insgesamt **5/6, Exit 1**, weil Firefox Monacos unfokussierte interne Textarea unsichtbar hält. Der neue Test verlangt deren Existenz und den sichtbaren Editor; Menü-, Fokus- und ausgeführte Resetassertions bleiben erhalten. Anschliessend `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/projects.spec.ts --project=chromium --project=firefox --project=webkit --grep 'a late real editor' --reporter=list` **Exit 0, 3/3** ([Log](verification/projects/editor-focus-regression.log)). Finaler Kandidat: `875bd788ff71b33b7d54bc87d5863987b5d434526dcbe330b5cd1a7f4278c26d`, 169 Dateien; vollständige Abschlussläufe erneut gestartet.

Die zusätzlich ergänzte Invalid-ID-/Back-Forward-Deploymentprüfung stoppte den ersten finalen Verify-Anlauf im Typecheck (**Exit 2**, [Log](verification/projects/verify-deployment-types.log)): das Testfallarray brauchte bei `exactOptionalPropertyTypes` eine unveränderliche Tupeltypisierung. `as const` ergänzt; `npm run typecheck` und Prettier **Exit 0**, Assertions unverändert. Finaler Fingerprint nun `c58cb48c2336fbaeae7e3e2ded6c5f58ee04068a5367d8fdf022a7a00931c1b8` über 169 Dateien.

Vollständiges Verify des ersten Fokusguards: **Exit 1**, TypeScript/Lint/**47 Unit**/Build/**43 Integrationen** bestanden, **36/37 Chromium-E2E** bestanden ([Originalausgabe](verification/projects/verify-before-focus-intent.log)). Die bestehende History-/Cursorprüfung deckte eine Regression auf: ein unverändert fokussierter Navigationsbutton verhinderte Editorfokus nach Back. Der Fokusauftrag wird deshalb vor der Lazy-Grenze erfasst und nur bei zwischenzeitlichem Fokuswechsel zurückgestellt. Bestehende History-/Undo-/Geometrieassertions bleiben erhalten; erneute gezielte und vollständige Prüfungen folgen.

Gezielte Prüfung des finalen Fokusauftrags: `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/projects.spec.ts tests/e2e/p7-ui.spec.ts --project=chromium --project=firefox --project=webkit --grep 'a late real editor|measured SQL/R geometry|browser history restores' --reporter=list` **Exit 0, 9/9** ([Log](verification/projects/editor-focus-intent-regression.log)): ursprüngliche Geometrie, Cursor-/Undo-/Historywiederherstellung und verzögertes Menü in jedem Browser. Finaler Codefingerprint `9a75e75eb037cbb39a26a3f8908705777007b12c86fdfd9be2777c087c11242c`, 169 Dateien. Vollständige Abschlussläufe erneut gestartet; keine parallelen Source-Edits.

Finaler Verify-Gesamtlauf: `DW_REUSE_DEV_SERVER=1 npm run verify` **Exit 0**, TypeScript/Lint/Modulgrenzen, **47 Unit**, Produktionsbuild, **43 Chromium-Integrationen und 37 Chromium-E2E** bestanden ([Log](verification/projects/verify.log)). Produkt-, Engine- und E2E-Code seit Beginn dieses Laufs unverändert. Ein während dieses Laufs vorgenommener lesender Review fand ausschliesslich im noch nicht ausgeführten Deploymenttest eine fehlende Persistenzbarriere vor harten Reloads; dort explizites Speichern/gespeicherten Status ergänzt. Typecheck, gezieltes ESLint und Prettier danach **Exit 0**. Alle Assertions erhalten. Deshalb umfasst das finale [Dateiinventar](verification/projects/code-fingerprint-before-route-wait.json) nun `005c1e4b9766ec457201114f01d6ccfdc0f23c40012bcf25df829d65c5a796f9`, 169 Dateien; vorheriger Inventarstand separat erhalten. Keine erneute Engineprüfung wegen ausschliesslicher Testvorbereitungsänderung. Firefox/WebKit-E2E und reguläre Deploymentmatrix folgen.

Finale zusätzliche E2E-Matrix: `DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/browser-matrix.json npx playwright test tests/e2e --project=firefox --project=webkit --reporter=list,json` **Exit 0, 74/74 bestanden**, je 37 in Firefox und WebKit ([Log](verification/projects/browser-matrix.log), [JSON](verification/projects/browser-matrix.json)). Zusammen mit Chromium **111/111 E2E**, keine Flakes oder übersprungenen Fälle. `python3 tools/verify-package.py --report docs/verification/projects/package-check.json` **Exit 0**, 80 Requirements/72 Abnahmeszenarien samt lokalen Links und unveränderten Golden-Fixtures konsistent; kein Ersatz für Engineabnahme. Reguläre Deploymentprüfung gestartet.

Erster regulärer Deploymentlauf nach den Containerbuilds vorzeitig beendet: **Exit 130**, 7 bestanden, 1 fehlgeschlagen, 1 unterbrochen, 54 noch nicht ausgeführt ([Log](verification/projects/deployment-initial.log), [JSON](verification/projects/deployment-initial.json)). Der neue Routentest las `page.url()` direkt nach einem asynchronen Erstellungs-/Navigationsklick und merkte sich noch die Projektliste statt der Projekt-UUID. Trace und gespeichertes Projekt mit beiden Analysen belegen einen Testablauffehler. Vor allen URL-Aufnahmen wird jetzt die Zielroute abgewartet; Sichtbarkeits-, Reload-, Invalid-ID-, Back/Forward- und 404-Assertions unverändert. Typecheck/gezieltes ESLint/Prettier **Exit 0**, keine Produktänderung. Finales Inventar `45dae17f976e1d77d4df5a42398463bc5fd11ef70997d16e3a816659c0b0b96a`, 169 Dateien. Zuerst Root-/Lab-Routentest gezielt, danach gesamte reguläre Matrix erneut.

Gezielte statische Wiederholung: `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/deployment-routes-focused.json npm run test:deployment -- tests/deployment/projects.spec.ts --project=chromium-0 --project=chromium-1 --reporter=list,json` **Exit 0, 2/2 bestanden** ([Log](verification/projects/deployment-routes-focused.log)): Root und `/lab/`, kanonische Direktaufrufe/Reload, Back/Forward, ungültige IDs und alte URL-/Asset-404. Anschliessend komplette 63-Fälle-Deploymentmatrix erneut gestartet.

Regulärer Deploymentabschluss: `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/deployment.json npm run test:deployment -- --reporter=list,json` **Exit 0, 63/63 bestanden** (20,3 Minuten), Chromium/Firefox/WebKit jeweils Root, `/lab/` mit PostMessage und `/lab/` mit isoliertem Auto-Kanal. Keine Flakes, keine übersprungenen Fälle. Neue Routen, Reload/History, ungültige IDs, Legacy-/Asset-404 sowie reale SQL/R-, Timeout-/Retry-/Abbruch-, Netzwerk-/CSP- und lokale Assetprüfungen bestanden. Finale Prüfzahlen und Hashabgleich **Exit 0**. Historische Nachweise und Schutzbereiche unverändert; eigener Testcontainerbestand bereinigt, vorhandener Nutzer-Devserver PID 57769 auf 4173 erhalten. Der beauftragte UI-Abschnitt ist abgeschlossen; nativer Safari-Pilot/Ressourcenbenchmark nicht erneut ausgeführt, keine neue produktive V1-Freigabe.

Abschliessende Dokument-/Formatkontrolle: `python3 tools/verify-package.py --report docs/verification/projects/package-check.json` **Exit 0** (80 Requirements, 72 Abnahmeszenarien, 175 JSON-Dateien und lokale Markdownlinks). Prettier-Check sämtlicher geänderter/neuer TS-/TSX-/MJS-/CSS-Dateien und aktiver Spezifikations-/Design-/Betriebs-/Berichtsdateien **Exit 0**; ausschliesslich neuer Implementierungsstatusabschnitt formatiert, historischer Präfix unverändert. `git diff --check` **Exit 0**. Keine nachträglichen Produkt-/Teständerungen.

### Commit-/Push-Vorbereitung — Projekte (16. Oktober 2026)

Der Nutzer hat Commit und Push dieses Abschnitts ausdrücklich beauftragt. Ziel ist der bestehende Branch `main` auf `origin` (`sogis/dateninfrastruktur-datenwerkstatt`). `git fetch origin`, `git diff --check` und erneuter Hashabgleich des geprüften Code-/Testkandidaten **Exit 0**; `HEAD...origin/main` ohne Divergenz (0/0). Alle 169 Dateihashes stimmen weiterhin mit dem finalen Kandidaten `45dae17f976e1d77d4df5a42398463bc5fd11ef70997d16e3a816659c0b0b96a` überein. Die dokumentierten Verify-/E2E-/Deploymentnachweise bleiben gültig; für die reine Commitvorbereitung keine erneuten Engine-/Browserläufe. Historische Prüfbelege und Schutzbereiche unverändert.

`git diff --cached --check` **Exit 2** ausschliesslich wegen Whitespace in 15 original generierten Rohlogs/Fehlerkontexten unter `docs/verification/projects/`. Derselbe Check mit genau diesen Dateien ausgeschlossen **Exit 0**; Rohbelege bleiben unverändert. `python3 tools/verify-package.py --report /tmp/dw-projects-commit-package-check.json` **Exit 0**. Lesender Review ohne Commit-Blocker; Commit enthält den gesamten fachlich abgeschlossenen Projekt-/Herkunftsabschnitt samt separaten Nachweisen. Der anschliessende Push ist keine Produktivbereitstellung.

### UI — Fehlerhinweis: normale Schrift und rote Schliessen-Aktion (20. Oktober 2026)

**Geliefert und gezielt verifiziert:** gestalterische Präzisierung zu REQ-065/066/067, Regression zu
AT-054/055. Basis `1572f32e5fac65f737723e01db28974e21740d1e`, vor Beginn sauber;
Node **22.23.1**, npm **11.18.0**. Nutzerentscheidung: Fehlertext in Schriftgewicht
400, Schliessen-Icon in derselben Fehlerfarbe (#B80F17), transparente rote
Hover-/Drückflächen mit 10 % bzw. 16 % Deckkraft.

Implementiert in `src/app/router.tsx` und `src/styles/app.css`; Gestaltungsvertrag
in `docs/DESIGN_SYSTEM.md` angepasst. Bestehende Regression in
`tests/e2e/navigation.spec.ts` prüft Textgewicht, Text-/SVG-Farbgleichheit,
Normal-/Hover-/Drückzustand, unveränderte Geometrie, Tooltip und Tastaturbedienung.
Kurze und mehrzeilige reale Fehler werden bei 1440×900 und 1280×800 jeweils mit
100 % und 200 % CSS-Zoom geprüft. Keine Schnittstellen-/Dependencyänderung.

Vorprüfung der lokalen Browserinstallation **Exit 0**: Chromium **153.0.8010.12**,
Firefox **155.0**, WebKit **26.6**; alle unterstützen die verwendete transparente
Farbmischung. `node node_modules/prettier/bin/prettier.cjs --write
src/app/router.tsx src/styles/app.css tests/e2e/navigation.spec.ts` **Exit 0**.

Prüfstand: uncommittierter Stand auf der genannten Basis, Produkt-/Test-/Vertragsdateien
über [SHA-256-Inventar](verification/error-notice/code-fingerprint.json) identifiziert.
Tatsächlich ausgeführte Checks:

- `npm run typecheck` **Exit 0**, [Log](verification/error-notice/typecheck.log).
- `npm run lint` **Exit 0**, einschliesslich Modulgrenzen,
  [Log](verification/error-notice/lint.log).
- `npm run build` **Exit 0**, gepinnte lokale Runtime-/R-Pakete und Lizenzinventar
  geprüft; bestehende Chunkgrössenwarnung, [Log](verification/error-notice/build.log).
- `DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/error-notice/browser-matrix.json node node_modules/@playwright/test/cli.js test tests/e2e/navigation.spec.ts --grep 'Notices:' --project=chromium --project=firefox --project=webkit --output=test-results/error-notice --reporter=list,json`
  **Exit 0, 3/3 bestanden**, keine Wiederholungen oder übersprungenen Fälle;
  [Log](verification/error-notice/browser-matrix.log),
  [JSON](verification/error-notice/browser-matrix.json).
- `node node_modules/prettier/bin/prettier.cjs --check src/app/router.tsx src/styles/app.css tests/e2e/navigation.spec.ts`
  **Exit 0**, [Log](verification/error-notice/format-check.log);
  `git diff --check` **Exit 0**, [Log](verification/error-notice/diff-check.log).
- `python3 tools/verify-package.py --report docs/verification/error-notice/package-check.json`
  **Exit 0**: 80 Requirements, 72 Abnahmeszenarien, lokale Markdownlinks und
  178 JSON-Dateien konsistent; [Bericht](verification/error-notice/package-check.json).

Die drei Browser prüfen insgesamt **24 Geometriefälle** sowie je Normal-, Hover-
und Drückzustand. [Messwerte](verification/error-notice/geometry.json) und visuell
kontrollierte Screenshots für [Hover](verification/error-notice/chromium-notice-name-error-1440-zoom-1-hover.png)
und [Drücken](verification/error-notice/chromium-notice-name-error-1440-zoom-1-active.png)
sowie 200 % Zoom in [Firefox](verification/error-notice/firefox-notice-name-error-1280-zoom-2-hover.png)
und [WebKit](verification/error-notice/webkit-notice-name-error-1280-zoom-2-hover.png)
sind separat gespeichert. Der vorhandene Devserver im Zielrepository auf Port 4173
wurde verwendet und beibehalten; Tests verwenden eigene Browserprofile und
abgegrenzte OPFS-Verzeichnisse.

Keine offenen Blocker im beauftragten Umfang. Vollständiges `npm run verify`,
weitere Engine-/Deployment-/Ressourcentests und nativer Safari-Pilot für diesen
lokalen Darstellungsfix **nicht erneut ausgeführt**. Nächster konkreter Schritt:
reguläre UI-Durchsicht; keine neue P0–P8-Phase begonnen. Kein Commit, Push oder
Release ausgeführt.


### UI — Entwicklungs- und Speicherhinweis ersatzlos entfernen (20. Oktober 2026)

**Status: bestanden im beauftragten Umfang.** Nutzerbeauftragte Darstellungsänderung zu
REQ-019/065/066; Regressionen insbesondere AT-003/012/016/054/055/058/066–068.
Basis `1572f32`, uncommittierter Arbeitsbaum; vorhandene Änderungen am
Fehlerhinweis einschliesslich Designvertrag und bisherigen Nachweisen beibehalten.
Node **22.23.1**, npm **11.18.0**, Playwright **1.63.0**;
Chromium **153.0.8010.12**, Firefox **155.0**, WebKit **26.6**.

`src/app/router.tsx` entfernt „Entwicklungsstand · nicht abgenommen“ aus dem
normalen Header. Bei vollständig gespeicherten dauerhaften Projekten entfällt
die gesamte Speicherstatuszeile samt Platzbedarf; kein Ersatztext oder Symbol.
Temporärer Modus, Lesemodus, ungespeicherte Änderungen, laufendes Speichern und
Fehler behalten ihre bisherigen Hinweise. Das unsichtbare `data-save-state`
am vorhandenen Workspace-Container spiegelt den bestehenden PersistenceCoordinator;
Speicherlogik, Domainverträge, Datenformate und Dependencies bleiben unverändert.

Die bisherigen textabhängigen Persistenzbarrieren in sechs E2E-/Navigationsdateien
und zwei Deploymentdateien warten jetzt auf diesen tatsächlichen Speicherzustand.
Die Navigation prüft zusätzlich das Fehlen beider Texte und der Statuscontainer,
keinen reservierten Raum und keinen horizontalen Überlauf in Übersicht, Daten,
SQL und R bei 1440×900 sowie 1280×800. Browserfehler werden ebenfalls erfasst.

Die erste statische Matrix hatte **Exit 1, 26/27 bestanden**:
WebKit unter `/lab/` meldete beim Öffnen der SQL-Fläche einen
`ResizeObserver loop completed with undelivered notifications.`
[Originalausgabe](verification/removed-status/deployment-initial.log),
[JSON](verification/removed-status/deployment-initial.json).
Die unveränderte gezielte Wiederholung mit `--project=webkit-1 --repeat-each=3`
hatte **Exit 1, 1/3 bestanden**, denselben Fehler zweimal reproduziert
([Log](verification/removed-status/deployment-repro.log)).
`src/ui/PanelLayout.tsx` verschiebt deshalb die durch Panelminima ausgelöste
Höhenanpassung in `requestAnimationFrame`, bündelt Benachrichtigungen und
beendet einen ausstehenden Frame beim Unmount. Keine Fehlermeldung wird gefiltert.
Die unveränderte statische Wiederholung danach: **Exit 0, 3/3 bestanden**
([Log](verification/removed-status/deployment-panel-fix.log),
[JSON](verification/removed-status/deployment-panel-fix.json)).
Ein zusätzlicher echter WebKit-Belastungslauf mit 30 SQL-Editorwechseln,
Editieren/Speichern und wechselnden Fenstergrössen: **Exit 0, keine Browserfehler**
([Log](verification/removed-status/panel-stress.log),
[Messwerte](verification/removed-status/panel-stress.json)).
Die bestehende P7-Flächenprüfung schreibt neue Bilder/Messwerte nun in ihr
aktuelles Testausgabeverzeichnis, um historische Nachweise nicht zu überschreiben.

Finaler Kandidat: [SHA-256-Inventar über 162 Dateien](verification/removed-status/code-fingerprint.json).
Tatsächlich ausgeführte abschliessende Befehle:

- `npm run typecheck` **Exit 0**, [Log](verification/removed-status/typecheck-final.log).
- `npm run lint` **Exit 0**, einschliesslich Modulgrenzen,
  [Log](verification/removed-status/lint-final.log).
- `npm run build` **Exit 0**, einschliesslich lokaler Runtimeassets und
  Lizenzinventar; bestehende Chunkgrössenwarnung, [Log](verification/removed-status/build.log).
- `DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/removed-status/browser-matrix.json node node_modules/@playwright/test/cli.js test tests/e2e/navigation.spec.ts tests/e2e/workspaces.spec.ts tests/e2e/imports.spec.ts tests/e2e/multitab.spec.ts tests/e2e/projects.spec.ts tests/e2e/p7-ui.spec.ts --grep 'Navigation:|Notices:|AT-003:|AT-005 AT-058:|AT-012:|AT-054 AT-057 partial:|AT-058 / REQ-060:|P2 /|P6 AT-065:|Projects: a failed metadata save|P7 AT-058: browser history|measured SQL/R geometry' --project=chromium --project=firefox --project=webkit --output=test-results/removed-status-browser-complete --reporter=list,json` **Exit 0, 48/48 bestanden**, [Log](verification/removed-status/browser-matrix.log), [JSON](verification/removed-status/browser-matrix.json).
- `DW_REUSE_TEST_PORTAL=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/removed-status/deployment.json npm run test:deployment -- tests/deployment/projects.spec.ts tests/deployment/static.spec.ts --grep 'Projects:|arbitrary UID static container|UI assets:' --output=test-results-deployment/removed-status-final --reporter=list,json` **Exit 0, 27/27 bestanden**, Chromium/Firefox/WebKit jeweils unter Root, `/lab/` mit PostMessage sowie `/lab/` isoliert mit Auto-Kanal; [Log](verification/removed-status/deployment.log), [JSON](verification/removed-status/deployment.json).
- `node node_modules/prettier/bin/prettier.cjs --check src/app/router.tsx src/ui/PanelLayout.tsx tests/e2e/navigation.spec.ts tests/e2e/workspaces.spec.ts tests/e2e/imports.spec.ts tests/e2e/multitab.spec.ts tests/e2e/projects.spec.ts tests/e2e/p7-ui.spec.ts tests/deployment/projects.spec.ts tests/deployment/static.spec.ts` **Exit 0**, [Log](verification/removed-status/format-check.log). Ausschliesslich der neue Statusabschnitt wurde separat formatiert; historischer Präfix unverändert.
- `python3 tools/verify-package.py --report docs/verification/removed-status/package-check.json` **Exit 0**: 80 Requirements, 72 Abnahmeszenarien, lokale Markdownlinks und 201 JSON-Dateien konsistent; [Log](verification/removed-status/package-check.log), [Bericht](verification/removed-status/package-check.json).
- `git diff --check` **Exit 0**, [Log](verification/removed-status/diff-check.log).

Frühere Testentwicklungsfehler bleiben dokumentiert: erster Typecheck **Exit 2**
wegen fehlender Tupeltypisierung im neuen Testarray, mit `as const` korrigiert
([Log](verification/removed-status/typecheck-initial.log)); erster Navigationslauf
**Exit 1, 6/9 bestanden**, fehlende R-Bereitschaftsbarriere ergänzt
([Log](verification/removed-status/navigation-initial.log)); erste E2E-Matrix
**Exit 1, 42/45 bestanden**, neue App-Fehlerprüfung erfasste fälschlich Monacos
unsichtbare Melderegionen und wurde auf tatsächliche App-Fehler begrenzt
([Log](verification/removed-status/browser-matrix-initial.log)). Danach vor der
Panelkorrektur **Exit 0, 45/45 bestanden**
([Log](verification/removed-status/browser-matrix-before-panel-fix.log)).
Keine bestehenden fachlichen Assertions entfernt oder abgeschwächt.

Vollständiges `npm run verify`, Unit- und übrige Integrations-/Deploymenttests,
Ressourcenbenchmark und nativer Safari-Pilot **nicht erneut ausgeführt**.
Keine neue V1-Abnahme, kein Commit, Push oder Release.
Keine offenen Blocker im beauftragten Umfang. Nächster konkreter Schritt: reguläre UI-Durchsicht; keine neue P0–P8-Phase begonnen.

Finale Nachweise: **75/75 Browserfälle bestanden**, keine Flakes oder übersprungenen Fälle.
24 neue [Abstands-/Höhenmessfälle](verification/removed-status/geometry.json) und
12 bestehende SQL/R-Flächenmessfälle bestanden. Visuell kontrollierte Beispiele:
[Übersicht 1440](verification/removed-status/chromium-overview-1440.png),
[SQL 1280](verification/removed-status/firefox-sql-1280.png),
[Daten 1280](verification/removed-status/webkit-data-1280.png),
[SQL mit Ergebnis](verification/removed-status/p7-sql-chromium-1440.png) und
[R mit Plot](verification/removed-status/p7-r-chromium-1280.png).
Alle 162 Kandidatenhashes stimmen nach den Abschlussläufen überein.
Der eigene Fixture-Server ist beendet; der vorhandene Nutzer-Devserver bleibt erhalten.

## UI — Dateiname erst nach Dateiauswahl (20. Oktober 2026)

**REQ-061 / Dateiwähler: bestanden.** In `src/ui/Controls.tsx` ist der
gemeinsame `FileInput` zunächst leer; „Keine Datei ausgewählt“ entfällt
ersatzlos. Das Dateinamenelement erscheint erst bei ausgewählter Datei.
Der ausgewählte Name bleibt beim nativen Eingabe-Reset des Projektimports erhalten.

Verifizierter Arbeitsstand: HEAD `1572f32e5fac65f737723e01db28974e21740d1e`
mit dieser lokalen Änderung; SHA-256 von `src/ui/Controls.tsx`:
`e67fed4e9f9ba8dfa48ee0b600f9c12d297ca0355e3b8b1ab75a56d3ff0642c0`.
Vorhandene lokale Änderungen wurden erhalten.

Tatsächlich ausgeführte Prüfungen:

- `npm run typecheck`: **Exit 0**.
- `node --experimental-strip-types --input-type=module` mit Inline-Playwright-Smoketest:
  **Exit 0**, Chromium auf dem vorhandenen Devserver, eigenes temporäres Profil
  und isoliertes OPFS. Auf `/projects` vor Auswahl kein Dateinamenelement oder
  Ersatztext; nach Auswahl von `fixtures/sample.dwproj` sichtbarer Dateiname
  trotz leerem nativen Input; nach Schliessen des Importdialogs und
  `setInputFiles([])` wieder kein Dateinamenelement oder Ersatztext.
  Testprofil und Test-OPFS anschliessend bereinigt.
- `git diff --check`: **Exit 0**.

Auf Nutzerwunsch nur diese gezielten Prüfungen; vollständige Suite, `verify`,
Build, Lint und weitere Browser **nicht erneut ausgeführt**.
Keine offenen Blocker. Nächster konkreter Schritt: reguläre UI-Durchsicht.

## UI — Bereinigung ausschliesslich in den Einstellungen (20. Oktober 2026)

**REQ-061/064/066/067, AT-055–057: umgesetzt und gezielt geprüft.**
Der Bereich „Wartung“ samt doppelter Bereinigungsaktion entfällt auf der
Projektliste. Unter Einstellungen → Browser-Speicher bleibt der vorhandene
Button „Nicht referenzierte Projektreste bereinigen“ direkt sichtbar, ohne
Aufklappbereich. Speicherstatus und Projektverwaltung verwenden einheitliche
Buttonoptik mit 8 px Abstand; die Bereinigung folgt 16 px darunter.
Die Projektverwaltung bleibt ein Navigationslink. Bestätigungsdialog und
Bereinigungsservice sind unverändert. Der Hinweis nach unvollständiger
Dateilöschung verweist jetzt auf die Einstellungen.

Implementiert in `src/features/archive/ArchiveActions.tsx`,
`src/features/workspaces/StorageSettings.tsx` und `src/styles/app.css`;
Designvertrag in `docs/DESIGN_SYSTEM.md`, bestehende Regression in
`tests/e2e/p7-ui.spec.ts` ergänzt. Vorhandene lokale Änderungen einschliesslich
Dateiwähler und früherer UI-Korrekturen erhalten. Quellenbaseline am dokumentierten
Commit im lokalen Quellrepository gelesen; dort keine Änderungen vorgenommen.

Verifizierter Stand: HEAD `1572f32e5fac65f737723e01db28974e21740d1e` mit lokalen
Änderungen; Node **22.23.1**, npm **11.18.0**. SHA-256 der geprüften Dateien:

| Datei | SHA-256 |
| --- | --- |
| `src/features/archive/ArchiveActions.tsx` | `f1a3b1a9a1ef002abc37969150ad9261f1066185442ead428089f151c3b2b4a6` |
| `src/features/workspaces/StorageSettings.tsx` | `062c5da5aacc993bcaaab7fc83f8ab56db5068413b5122b299d1753ea3928646` |
| `src/styles/app.css` | `48bec4267441c3bbcd28c95d0f617af0ee4c4b93c2604769acfc33547ab41b67` |
| `tests/e2e/p7-ui.spec.ts` | `8333d0d465486490faf9c3dbe53c5a57ed93e9387c7006152ec8dfede58c3990` |

Tatsächlich ausgeführte Prüfungen:

- `npm run typecheck`: **Exit 0**.
- `node node_modules/eslint/bin/eslint.js src/features/archive/ArchiveActions.tsx src/features/workspaces/StorageSettings.tsx tests/e2e/p7-ui.spec.ts`: **Exit 0**.
- `DW_REUSE_DEV_SERVER=1 node node_modules/@playwright/test/cli.js test tests/e2e/p7-ui.spec.ts --project=chromium --grep 'native focus trap/return' --reporter=list --output=/tmp/datenwerkstatt-settings-cleanup-20261020`:
  **Exit 0, 1/1 bestanden**. Prüft fehlende Wartung auf der Projektliste,
  weiterhin sichtbaren Projektimport, genau eine direkt zugängliche Bereinigung,
  Dialog/Escape/Fokusrückgabe und Navigation zur Projektliste. Bei 1440×900 und
  1280×800 gleiche Buttonhöhe, 8/16-px-Abstände und keinen horizontalen Überlauf
  gemessen. Screenshot bei 1280×800 visuell kontrolliert. Eigenes Browserprofil
  und isolierter OPFS; vorhandenen Devserver beibehalten, Testportal beendet.
- `node node_modules/prettier/bin/prettier.cjs --write src/features/archive/ArchiveActions.tsx src/features/workspaces/StorageSettings.tsx tests/e2e/p7-ui.spec.ts`: **Exit 0**.
- `git diff --check`: **Exit 0**.

Auf ausdrücklichen Nutzerwunsch nur die gezielten Prüfungen; vollständiges
`npm run verify`, Build, weitere Unit-/Integrations-/E2E-/Deploymenttests,
Firefox/WebKit, Zoomprüfung und nativer Safari-Pilot **nicht erneut ausgeführt**.
Keine offenen Blocker im beauftragten Umfang. Nächster konkreter Schritt:
reguläre UI-Durchsicht; keine weitere P0–P8-Phase begonnen.
Kein Commit, Push oder Release ausgeführt.

## Review aller lokalen Änderungen und Commitvorbereitung (20. Oktober 2026)

**Ergebnis: keine Commit-Blocker.** Der Nutzer hat die Analyse aller Änderungen,
einen gemeinsamen Commit und den Push ausdrücklich beauftragt. Ziel ist `main`
auf `origin` (`sogis/dateninfrastruktur-datenwerkstatt`). Basis des geprüften
Arbeitsstands ist `1572f32e5fac65f737723e01db28974e21740d1e`; das
[SHA-256-Inventar](verification/commit-review/code-fingerprint.json) identifiziert
178 unveränderte Quell-, Test-, Vertrags- und Konfigurationsdateien samt beiden
Designsystemdokumenten. `git fetch origin` und der anschliessende Vergleich
`git rev-list --left-right --count HEAD...origin/main`: **Exit 0, 0/0**.

Geprüfter Umfang: Fehlerhinweise mit normaler Schrift und roter Schliessen-Aktion,
Entfall der normalen Entwicklungs-/Speicherstatuszeilen bei erhaltenen Ausnahme-
und Fehlerzuständen, Dateinamen erst nach Auswahl, Bereinigung ausschliesslich in
den Einstellungen und die entkoppelte Panelhöhenmessung. Betrifft insbesondere
REQ-019–022/061/064–067 und AT-003/012/016/054–058/065–068. Relevante Dateien:
`src/app/router.tsx`, `src/styles/app.css`, `src/ui/Controls.tsx`,
`src/ui/PanelLayout.tsx`, `src/features/archive/ArchiveActions.tsx` und
`src/features/workspaces/StorageSettings.tsx` sowie die geänderten E2E- und
Deploymenttests. Die Speicherbarrieren lesen den bestehenden PersistenceCoordinator;
Domain-/Engine-/Speicherverträge, Dependencies und Goldenwerte bleiben erhalten.
Keine fachliche Codekorrektur aus dem Review erforderlich.

`docs/DESIGN_SYSTEM_NEUTRAL.md` wird als ausdrücklich noch nicht implementierter
Gestaltungsentwurf mit aufgenommen. Er ist kein Nachweis einer Theme-/Fontmigration.
Die bisherigen Nachweise unter `error-notice/` und `removed-status/` sind historische
Prüfstände vor den nachfolgenden UI-Änderungen; ihre Hashdifferenzen sind damit erklärt.
Die Quellenbaseline wurde am dokumentierten Commit im lokalen Portalrepository
gelesen, ohne dort Änderungen vorzunehmen.

Tatsächlich ausgeführte Abschlussprüfungen auf macOS/ARM64 mit Node **22.23.1**,
npm **11.18.0**, Chromium **153.0.8010.12**, Firefox **155.0**, WebKit **26.6**
([Umgebung](verification/commit-review/environment.json)):

- `DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 0**. Typecheck, Lint einschliesslich
  Modulgrenzen, **47/47 Unit-, 43/43 Integrations- und 37/37 Chromium-E2E-Tests**
  sowie Build mit lokalem Runtime-/Paket-/Lizenzinventar bestanden.
  Enthält den echten Golden Path, Typrundlauf, Workerabbruch, Multitab,
  Speicherfehler und Archive; [vollständiges Log](verification/commit-review/verify.log).
  Die bekannte Chunkgrössenwarnung bleibt bestehen.
- `DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/commit-review/browser-matrix.json node node_modules/@playwright/test/cli.js test tests/e2e/navigation.spec.ts tests/e2e/workspaces.spec.ts tests/e2e/imports.spec.ts tests/e2e/multitab.spec.ts tests/e2e/projects.spec.ts tests/e2e/p7-ui.spec.ts --project=firefox --project=webkit --output=test-results/commit-review --reporter=list,json`:
  **Exit 0, 44/44 bestanden**, keine übersprungenen oder instabilen Fälle;
  [Log](verification/commit-review/browser-matrix.log),
  [JSON](verification/commit-review/browser-matrix.json).
- `DW_REUSE_TEST_PORTAL=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/commit-review/deployment.json npm run test:deployment -- tests/deployment/projects.spec.ts tests/deployment/static.spec.ts --output=test-results-deployment/commit-review --reporter=list,json`:
  **Exit 0, 36/36 bestanden**. Chromium/Firefox/WebKit jeweils mit Root,
  `/lab/` PostMessage und `/lab/` isoliert/Auto; reale Engines, beliebige UID,
  Routen/Reload, MIME/404/CSP, lokale Assets und ungültige Runtimekonfiguration;
  [Log](verification/commit-review/deployment.log),
  [JSON](verification/commit-review/deployment.json).
- `node node_modules/prettier/bin/prettier.cjs --check` mit allen 14 geänderten
  TS/TSX/CSS-Dateien: **Exit 0**; [Log](verification/commit-review/format-check.log).
- `node --experimental-strip-types --input-type=module` mit Inline-Playwright-Smoke
  für den Dateiwähler: **Exit 0**. Leerer Anfangszustand, Dateiname nach Auswahl
  trotz nativem Input-Reset und erneutes Leeren geprüft, eigenes Profil/OPFS
  anschliessend bereinigt; [Log](verification/commit-review/file-input.log).
- `python3 tools/verify-package.py --report docs/verification/commit-review/package-check.json`:
  **Exit 0**, Requirements/Abnahmeszenarien, Dokumentlinks, JSON-/Archivbeispiele
  und lokale Assets konsistent; [Log](verification/commit-review/package-check.log),
  [Bericht](verification/commit-review/package-check.json).
- `git diff --cached --check -- src tests`: **Exit 0**.
  Der vollständige Stagingcheck hat **Exit 2** ausschliesslich wegen Whitespace
  in original generierten Rohlogs und den drei beabsichtigten Markdown-Hardbreaks
  am Anfang des neutralen Designentwurfs; Inhalte bleiben unverändert.
  Die genaue Abgrenzung steht im [Whitespacebericht](verification/commit-review/whitespace.json).

Neue visuell kontrollierte Beispiele: [Speichereinstellungen bei 1280×800](verification/commit-review/settings-storage-chromium-1280.png)
und [Firefox-Fehlerhinweis bei 200 % Zoom](verification/commit-review/notice-firefox-1280-zoom-2.png).
Bestehende Tests schreiben teilweise noch in historische Belegpfade. Die 26 dabei
erneuerten Dateien sind separat unter `verification/commit-review/rerun-artifacts/`
gesichert; die ursprünglichen Dateien wurden bytegleich wiederhergestellt und
per Hash geprüft ([Inventar](verification/commit-review/historical-evidence.json)).
Alle 178 Kandidatenhashes stimmen nach den Browserläufen weiterhin überein.
Der eigene Fixture-Server wurde beendet; der vorhandene Nutzer-Devserver bleibt erhalten.

**Verbleibend:** nativer Safari-Pilot, Ressourcenbenchmark, die vollständige
Firefox-/WebKit-Integrationsmatrix sowie die übrigen Deploymentdateien wurden
für diesen Review nicht erneut ausgeführt. Keine neue V1-Gesamtabnahme und kein
Release. Nächster konkreter Schritt nach dem beauftragten Commit/Push ist die
reguläre UI-Durchsicht; eine Umsetzung des neutralen Designentwurfs ist ein
separater Abschnitt.


## UI — Pflichtfelder und Feldvalidierung (20. Oktober 2026)

REQ-014/019/067, AT-003/004/018/054/055/058; Status: **implementiert und automatisiert abgenommen**.
Native Safari-Prüfgrenze siehe Abschluss dieses Abschnitts.
Ausgangsrevision `b20ce0e`, Arbeitsbaum vor Beginn sauber. Node 22.23.1, npm
11.18.0; keine Paketänderung. Quellbaseline-Paketdatei am dokumentierten Commit
über raw.githubusercontent.com gelesen; der früher dokumentierte lokale
Quellcheckout ist auf diesem Host nicht vorhanden. Keine Quellportaländerung.

Abschnitt A: gemeinsame UI-Validierung, gemeinsame Namensmeldungen,
Pflichtkennzeichnung/Inlinefehler bei Erstellung und Umbenennung, natives
`required`, getrennte zugängliche Labels und Sternchen, Dateiauswahl mit
kontrolliertem Dateizustand. Implementiert in `src/ui/Controls.tsx`,
`src/ui/useFormValidation.ts`, `src/domain/fieldValidation.ts` und
`src/features/workspaces/Workspaces.tsx`; neue Tests in
`tests/e2e/required-fields.spec.ts`, `tests/unit/field-validation.test.ts`.

Tatsächliche Checks des Zwischenstands:

- `npm run typecheck`: Exit 0 (erster Abschnitt).
- `npm run test:unit -- tests/unit/field-validation.test.ts`: Exit 0, zunächst 3/3 Tests.
- Erster Chromiumlauf der zwei neuen Projekttests: Exit 1, 1/2 bestanden.
  Das Sternchen war trotz aria-hidden Bestandteil von Playwrights getByLabel;
  explizite Verknüpfung zum Labeltext ergänzt, zugängliche Namen bleiben stabil.
- Zweiter Chromiumlauf: Exit 1, 1/2 bestanden. Der neue Reloadtest wartete noch
  nicht auf den asynchronen Flush; dieselbe Saved-State-Prüfung wie in den
  bestehenden Persistenztests ergänzt. Kein Sollwert geändert.
- `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/required-fields.spec.ts --project=chromium --reporter=list --output=test-results/required-fields-a-pass`:
  Exit 0, 2/2 bestanden. Bestehender Vite-Server auf Port 4173 gehört diesem
  Repository; eigener Portal-Testserver wird durch Playwright verwaltet.
- Weiterer Typecheck beim Herauslösen des CSV-Schemas: Exit 2, fehlender
  weiterhin benötigter Zod-Import im Importadapter; Import wieder ergänzt.
- Anschliessend `npm run typecheck` und `npm run lint`: beide Exit 0.

Abschnitt B: Analyse-/Datensatznamen, Datei-/Portalimport, typabhängige Parameter
und Transfers ergänzt; gezielte Browserprüfung läuft. Fachliche Schemas und
Engine-/Speicherverträge bleiben erhalten. Nächster Schritt: neue Prüfungen und
SQL/R-Geometrie auswerten, danach vollständige Verify-/Browser-/Deploymentabnahme.
Finale Revision/Dateifingerprint, Befehle mit Exitcodes und verbleibende Grenzen
folgen nach der Abnahme. Aktuell keine abschliessende V1-Fertigmeldung.


### Fortsetzung und Browserabnahme (21. Oktober 2026)

Abschnitt B geprüft: `DW_REUSE_DEV_SERVER=1 npx playwright test
tests/e2e/required-fields.spec.ts tests/e2e/p7-ui.spec.ts --project=chromium
--reporter=list --output=test-results/required-fields-b-final`: **Exit 0, 13/13**
([Log](verification/required-fields/section-b.log)). Anschliessend zusätzliche
Prüfung von vorhandenen Transferbestätigungen und Nur-Lesen:
`DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/required-fields.spec.ts
--project=chromium --grep 'SQL dataset|read-only' --reporter=list
--output=test-results/required-fields-extra`: **Exit 0, 2/2**
([Log](verification/required-fields/section-b-extra.log)). Neue Endfassung hat
10 Pflichtfeld-E2E-Fälle; der gemeinsame Endlauf folgt weiter unten.

Beim Zwischenlauf 11/13 bestanden; zwei Fokusprüfungen deckten einen echten
Bedienfehler auf: Blur-Fehler verschoben den Aktionsbutton zwischen pointerdown
und click. Gemeinsame Hilfe verzögert diese Blur-Darstellung bis nach pointerup;
Aktionsvalidierung und Fehlerfokus bleiben unmittelbar. Nachweis über dieselben
Tests ohne gelockerte Fokusanforderung. Der anschliessende neue SQL→R-Test
benötigte den bereits bestehenden 60-s-Kaltstartvertrag für webR statt des
allgemeinen 10-s-Locatorlimits; vor Ablauf war der echte R-Transfer noch busy,
kein fachlicher Fehler. Keine Engineergebnisse, Goldenwerte oder Fixtures geändert.

Der erste vollständige Verify-Aufruf vom 20. Oktober wurde während der
Integrationstests unterbrochen: 28/43 bis zum Protokollende, kein Exitcode und
kein vollständiger Pass behauptet
([Zwischenlog](verification/required-fields/verify-interrupted.log)).
Der erste Wiederanlauf am 21. Oktober endete **Exit 1** vor den Browsertests,
weil dessen eigener verwaister Portal-Testserver PID 3182 noch Port 4174 hielt
([Log](verification/required-fields/verify-port-conflict.log)). Identität per
Prozessliste geprüft; ausschliesslich diesen Server mit `kill -TERM 3182` beendet.
Neuer vollständiger Verify-Aufruf läuft mit regulärer Playwright-Serververwaltung.

Nativer Safari-Smoke bestanden auf Safari **27.0.1 (22625.1.29.11.28)**,
macOS **27.0.1 (26A434)**, eigener Origin **127.0.0.1:4195**. Leere Erstellung und
Projektumbenennung mit Feldfehler/korrektem Fokus, korrigierter Unicode-Name
`Safari-Ölten` nach Reload erhalten. Fehlende Datei fokussiert sichtbaren
Auswahlbutton. Native Dateiauswahl von synthetischem `fixtures/gemeinden.csv`,
echte DuckDB-Vorschau mit IDs 001–004, leerer Anzeigename abgewiesen, korrigierter
Import als `data.gemeinden` mit vier Zeilen erfolgreich.
[AX-Nachweise](verification/required-fields/native-safari.json),
[Importfehler](verification/required-fields/safari-import-name-error.png),
[Erfolg](verification/required-fields/safari-import-success.png).
Nur eigenes zusätzliches Testfenster geschlossen; vorhandene Fenster/Dateidialoge
erhalten. Eigenen Testserver PID 5733 anschliessend beendet; bestehender
Nutzerserver auf Port 4173 blieb erhalten. Kein vollständiger Safari-Enginepilot
oder Safari-Prozessneustart für diese UI-Änderung behauptet.


Der vollständige E2E-Lauf zeigte zwei bisherige Erwartungen, die der ausdrücklich
geänderten Bedienung widersprachen. `navigation.spec.ts` erwartete den globalen
englischen Zod-Fehler bei leerem Projektnamen; jetzt wird der deutsche Inlinefehler
und die Abwesenheit eines globalen Banners geprüft. Die vorhandenen Banner-,
Zoom-, SVG- und Tastaturprüfungen bleiben mit einer ausdrücklich testlokalen
langen UI-Fehlermeldung bestehen (keine vorgetäuschten Engine-/Speicherergebnisse).
`p8-imports.spec.ts` erwartete eine deaktivierte Vorschau nach XLSX-Auswahl. Jetzt
prüft er die vereinbarte aktive Aktion mit Feldfehler/Fokus sowie weiterhin
gesperrte Importbestätigung und leere native Dateiauswahl. Der fachliche Grund
ist in beiden Tests kommentiert. Kein Test oder Goldenwert wurde entfernt.

Vollständiger Zwischenlauf: Typecheck/Lint/52 Unit-Tests/Build und **43/43
Integrationstests bestanden**, E2E **Exit 1, 45/47** mit ausschliesslich den beiden
oben begründeten alten UI-Erwartungen
([Log](verification/required-fields/verify-before-test-adaptation.log)).
Nach deren Anpassung:
`DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/required-fields/adapted-tests.json npx playwright test tests/e2e/navigation.spec.ts tests/e2e/p8-imports.spec.ts --grep 'Notices:|P8 AT-019 AT-020' --project=chromium --project=firefox --project=webkit --reporter=list,json --output=test-results/required-fields-adapted`:
**Exit 0, 6/6** ([Log](verification/required-fields/adapted-tests.log),
[JSON](verification/required-fields/adapted-tests.json)).
Finaler Produktstand wird erneut vollständig mit `npm run verify` geprüft;
Firefox-/WebKit-E2E und Deployment folgen danach seriell, damit der synthetische
Portalserver nicht gleichzeitig von verschiedenen Tests verändert wird.

Ein weiterer vollständiger Lauf zeigte im bestehenden P7-Test ein sporadisches
Zeitrennen nach dem Ausblenden der R-Konsole: die unmittelbare UI-Prüfung bestand,
aber Reload erfolgte vor dem Commit der asynchronen View-Speicherung. Der Test
wartet nun wie bereits bei Splitteränderungen auf den tatsächlichen gespeicherten
Wert `rConsoleVisible=false`, bevor er neu lädt. Die bisherigen Sollwerte und die
erneute Prüfung nach Reload bleiben erhalten; keine Wartezeit oder Retry ergänzt.
Produktive View-/Speicherlogik wurde für diesen Befund nicht verändert.

Der erste vollständige Firefox-/WebKit-E2E-Lauf endete Exit 1 mit **93/94**
(Firefox 47/47). Im WebKit-SQL-Namenstest wurde ausschliesslich Revision 0→1
durch den noch ausstehenden gültigen Analyse-Erstellungscommit beobachtet.
Ausgangsaufnahmen warten jetzt auf `session.flush()` der gültigen Vorbereitung;
Beobachtungen nach ungültigen Aktionen lösen weiterhin keinen Flush aus und
vergleichen Dokument, Revision und Persistenzgeneration unverändert strikt.
[Zwischenlog](verification/required-fields/browser-matrix-before-setup-settle.log).
Den Wiederholungslauf nach 12 Firefox-Tests bewusst mit SIGINT abgebrochen
(Exit 130), um die folgende, bei der Durchsicht gefundene Anzeigeabweichung noch
vor der Endabnahme zu korrigieren; kein vollständiger Pass behauptet.

Beim R-Objekttransfer zeigte der deaktivierte SQL-Name beim Ersetzen noch den
Entwurf eines neuen Datensatzes. Die Engine verwendete korrekt den bestehenden
SQL-Namen; die UI zeigt nun ebenfalls diesen festen Namen. Beim Wechsel zurück
zu „Neuer Datensatz“ bleibt der eigene Entwurf erhalten. Derselbe echte
SQL→R-E2E-Test prüft jetzt beide Auswahlzustände samt `required`/disabled.

Gezielte Nachprüfung:
`DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/required-fields/transfer-and-baseline.json npx playwright test tests/e2e/required-fields.spec.ts --grep 'sql name|SQL dataset' --project=chromium --project=firefox --project=webkit --reporter=list,json --output=test-results/required-fields-transfer`:
**Exit 0, 6/6** ([Log](verification/required-fields/transfer-and-baseline.log)).
Beim anschliessenden vollständigen Typecheck: Exit 2, weil die DOM-Selectauswahl
als `string` statt als gebrandete `DatasetId` typisiert ist. Den bereits im
Transfervertrag verwendeten `DatasetId`-Cast auch beim Lesen des ausgewählten
Datensatzes ergänzt; keine fachliche Regel geändert. Abnahme erneut vollständig
gestartet. Fehlerreihenfolge im R-Capture folgt der sichtbaren Feldreihenfolge
(Umwandlungsbestätigungen vor Namen).

Implementierungszuordnung für diesen UI-Abschnitt:

| Requirement / Abnahme | Geliefert | Relevante Dateien / Nachweis |
| --- | --- | --- |
| REQ-014, AT-003/004/018 | Bestehende Namensschemata, Unicode, Trim, Längen, Kollisionen inklusive Tombstones und reservierte SQL-/R-Namen; ungültige Entwürfe bleiben lokal | `domain/fieldValidation.ts`, `domain/importOptions.ts`, `ui/useFormValidation.ts`, Workspaces, DataSection, SQL/R, PortalImport; `field-validation.test.ts`, `required-fields.spec.ts` |
| REQ-019, AT-003/055/058 | Gültige Übernahme bei Blur, Speichern und Editor-Tastenkürzeln, bestehender Autosave; kein Commit bei ungültigem Namen | `ui/useFormValidation.ts`, Workspaces, SQL/R; Dokument-/Generationsvergleich und Reload im E2E |
| REQ-067, AT-054/055/058 | Sichtbare Sterne, native Pflichtsemantik, einmalige Erklärung, Inlinefehler mit `aria-describedby`/`aria-invalid`, Fehlerfokus, Nur-Lesen und kompakter Analysename | Controls, gemeinsame Validierung, Formularstellen, CSS; drei Browser, Geometrie-/Zoomprüfungen, nativer Safari-Smoke |
| REQ-014/067, AT-018/054/055 | Aktive Import-/Transferstufen, Dateiauswahl/Drop, Parameter inklusive leerem String/NULL, Pflichtbestätigungen; vorbelegte Auswahlen erfüllen die Pflicht | DataSection, PortalImport, Transfer, Parameters, ArchiveActions, Einstellungen; echte Engine-E2E und bestehende Regressionen |

Keine neuen Dependencies, persistierten Felder, Archivversionen oder
Engine-Schnittstellen. Vorhandene native Datei-/Formularverträge nur intern
erweitert. Dokumentierte Regeln in `docs/DESIGN_SYSTEM.md` ergänzt.

Finaler Gesamtcheck `DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 0**,
Typecheck und Lint samt Modulgrenzen, **52/52 Unit**, Produktionsbuild,
**43/43 Chromium-Integration**, **47/47 Chromium-E2E** bestanden
([Log](verification/required-fields/verify.log)). Geprüfter Arbeitsbaum auf
`b20ce0ecc6831af896dc9730d960501f82db4108`; exakte Quell-/Testdateien und
Designsystem über [SHA-256-Fingerprint](verification/required-fields/code-fingerprint.json).
Zu diesem Prüfzeitpunkt war der Abschnitt noch nicht committed. Danach vollständige
Firefox-/WebKit-E2E und lokales Deployment seriell gestartet.

Letzte Durchsicht: Bei zwei kollidierenden CSV-Spaltennamen blieb nach Korrektur
des ersten Namens der Fehler am unveränderten zweiten Feld stehen. Den Fall mit
zusätzlicher E2E-Assertion reproduziert: **Exit 1, 0/1**
([Log](verification/required-fields/dependent-errors-before.log)). Die gemeinsame
Hilfe entfernt nun auch bereits angezeigte Fehler, die durch eine Änderung in
einem anderen Feld behoben wurden; sie erzeugt dabei keine neuen Fehler.
Gilt gleichermassen für Parameterkollisionen. Der laufende Matrix-Wiederanlauf
wurde nach 20 Firefox-Fällen bewusst mit Exit 130 abgebrochen. Der zuvor
erfolgreiche Verify-Lauf bleibt als Zwischenstand erhalten; nach dieser kleinen
gemeinsamen Korrektur werden Verify und Browsermatrix erneut vollständig geprüft.

Gezielter Kollisionsnachweis nach Korrektur:
`DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/required-fields.spec.ts --grep 'CSV column' --project=chromium --project=firefox --project=webkit --reporter=list --output=test-results/required-fields-dependent`:
**Exit 0, 3/3** ([Log](verification/required-fields/dependent-errors.log)).
Auch die Korrektur einer Parameterkollision ist im gemeinsamen E2E ergänzt.

Eine zusätzliche native Safari-Wiederholung auf dem letzten Helferstand wurde
angefordert, ist aktuell aber nicht ausführbar: `cua.getApp('Safari')` meldet
einen gesperrten Mac; Nutzer asynchron um Entsperren gebeten. Keine weiteren
UI-Aktionen am gesperrten Mac versucht. Der oben dokumentierte tatsächlich
bestandene Safari-Smoke zu Namen und Dateiauswahl bleibt gültiger vorheriger
Nachweis; die spätere Kollisionskorrektur ist darüber nicht als nativ geprüft
ausgegeben. Automatisierte Abnahme läuft unabhängig davon weiter.

Erneuter vollständiger Endlauf nach der Kollisionskorrektur:
`DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 0**, Typecheck, Lint/Modulgrenzen,
**52/52 Unit**, Build, **43/43 Integration**, **47/47 Chromium-E2E** bestanden.
[Endlog](verification/required-fields/verify.log),
[Exitcode](verification/required-fields/verify.exitcode).
Dateifingerprint nach dem Lauf unverändert bestätigt; anschliessende Matrix
prüft denselben Produkt-/Teststand. Chromium-Geometrie: Toolbar 48 px,
Arbeitsfläche SQL 763/663 px und R 756/656 px bei 1440×900/1280×800.
[Messwerte](verification/required-fields/geometry/p7-geometry-chromium.json).

Fachliche Randfallprüfung: `requiredValueError` muss Auswahlwerte auf Leerstring
prüfen, nicht trimmen, weil Tabulator ein gültiges CSV-Trennzeichen ist.
Helfer korrigiert; ausschliesslich die freie Portal-ID/URL wird vor der
Leerprüfung getrimmt. Unit-Assertion und echter Tab-CSV-Vorschaupfad ergänzt.
`npm run test:unit -- tests/unit/field-validation.test.ts`: **Exit 0, 5/5**.
`DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/required-fields.spec.ts --grep 'CSV column' --project=chromium --project=firefox --project=webkit --reporter=list --output=test-results/required-fields-tab`:
**Exit 0, 3/3** ([Log](verification/required-fields/tab-delimiter.log)).
Matrix-Zwischenlauf dafür nach 66 Fällen (47 Firefox und 19 WebKit bestanden)
bewusst mit Exit 130 beendet; nicht als vollständiger Pass ausgegeben.
Verify, Matrix und Deployment danach seriell auf dem aktualisierten Fingerprint
neu gestartet. Bisherigen Verify-Pass als
`verification/required-fields/verify-before-tab-delimiter.log` erhalten.

Vollständiger Verify-Endlauf inklusive Tabulator-/Kollisionsfällen:
**Exit 0**, Typecheck/Lint/Modulgrenzen, **52 Unit**, Build,
**43 Integration**, **47 Chromium-E2E** bestanden. Endlog und Exitcode unter den
oben verlinkten `verify.log`/`verify.exitcode`; Fingerprint unverändert bestätigt.

Vollständige Browsermatrix auf demselben Endstand:
`DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/required-fields/browser-matrix.json npx playwright test tests/e2e --project=firefox --project=webkit --reporter=list,json --output=test-results/required-fields-browser-matrix`:
**Exit 0, 94/94** (47 Firefox, 47 WebKit, keine Skips/unerwarteten Fehler).
[Log](verification/required-fields/browser-matrix.log),
[JSON](verification/required-fields/browser-matrix.json),
[Exitcode](verification/required-fields/browser-matrix.exitcode).
Geometrie-/Screenshotbelege aller drei Browser unter
`verification/required-fields/geometry/`; beide Zielauflösungen ohne horizontalen
Seiten-Scrollbar und mit 48-px-Toolbar bestanden. Deploymentabnahme danach
automatisch gestartet, drei lokale statische Containerprofile gebaut.

Neue Regressionsevidenz von 60 zuvor bereits versionierten Projekt-/Tooltip-
Prüfbelegen unter `verification/required-fields/regression-evidence/` gesichert;
historische Dateien bytegenau aus `git show HEAD:<Pfad>` wiederhergestellt.
Beide SHA-256-Werte und die Zuordnung sind im
[Manifest](verification/required-fields/regression-evidence/manifest.json)
nachvollziehbar. Keine alten Belege durch den neuen Lauf überschrieben.

### Abschluss der Pflichtfeld-Implementierung (21. Oktober 2026)

Alle geplanten Formularbereiche sind umgesetzt. Aktionsbezogene Feldvalidierung
verwendet die bestehenden fachlichen Regeln; ungültige Entwürfe bleiben lokal,
gültige Namen werden über den bestehenden Autosave übernommen. Inlinefehler,
Pflichtsemantik, Fokusführung, bedingte Parameter-/Import-/Transferregeln und
kompakte Analysenamen sind in den drei automatisierten Browsern abgenommen.

| Endprüfung | Tatsächliches Ergebnis |
| --- | --- |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | Exit 0: Typecheck, Lint/Modulgrenzen, 52 Unit, Build, 43 Integration und 47 Chromium-E2E bestanden |
| Vollständige Firefox-/WebKit-E2E, Befehl oben | Exit 0: 94/94, je 47 pro Browser, keine Skips oder Flakes |
| `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/required-fields/deployment.json npm run test:deployment -- --reporter=list,json` | Exit 0: 63/63, je 7 in allen neun Browser-/Containerprofilen, keine Skips oder Flakes |
| `npm run build` nach Deployment | Exit 0, normaler Root-Build im lokalen `dist/` wiederhergestellt |
| Prettier auf allen geänderten Quell-/Testdateien und Designsystem; `git diff --check` | Beide Exit 0 |
| Nativer Safari-Smoke nach manuellem Entsperren | Auf demselben finalen Dateifingerprint bestanden: Namensvalidierung, Blur-/Aktionsfokus, native Dateiauswahl, echter Vier-Zeilen-Import und Reload |

Maschinenlesbare Zusammenfassung mit exakten Befehlen, Browserprofilen und
Exitcodes: [checks.json](verification/required-fields/checks.json).
Deployment: [Log](verification/required-fields/deployment.log),
[JSON](verification/required-fields/deployment.json),
[Exitcode](verification/required-fields/deployment.exitcode).
Build: [Log](verification/required-fields/root-build.log).
Formatierung: [Log](verification/required-fields/format.log).

Verifizierter Stand: Arbeitsbaum auf
`b20ce0ecc6831af896dc9730d960501f82db4108`,
[Quell-/Test-SHA-256](verification/required-fields/code-fingerprint.json)
nach allen Prüfungen unverändert bestätigt. Node 22.23.1, npm 11.18.0,
Playwright 1.63.0; Chromium 153.0.8010.12 (1243), Firefox 155.0 (1543),
WebKit 26.6 (2359), Docker 29.8.1. SQLRooms/DuckDB/webR bleiben auf den
gepinnten Paketversionen. Drei eigene Testcontainer durch die Tests beendet;
vorhandene Portal-/Integratorcontainer und Nutzerserver auf 4173 erhalten.
Zusätzlichen, wegen Mac-Sperre ungenutzten Safari-Testserver 4195 nach
Identitätsprüfung mit `kill -TERM 29722` beendet (erwarteter Exit 143).

Nach der Rückmeldung „ist entsperrt“ die native Safari-Prüfung auf dem finalen
Stand vollständig wiederholt. Safari 27.0.1 (22625.1.29.11.28), eigener Origin
127.0.0.1:4195 und eigenes Fenster
`82264CAE-9CF0-45B7-88C8-CB46D5DF740B`.
Leere Projekterstellung mit Inlinefehler und Feldfokus abgewiesen; beim Leeren
während der Bearbeitung kein neuer Fehler. Nach Blur Fehler ohne Fokuszwang;
ungültiges Speichern fokussiert den Namen und behält die gültige Überschrift.
Unicode-Korrektur `Safari-Final-Öffentlich` löscht den Fehler und bleibt nach
Reload erhalten. Fehlende Datei fokussiert den sichtbaren Auswahlbutton;
nativer Dateidialog wählt synthetisches `fixtures/gemeinden.csv`.
Echte DuckDB-Vorschau zeigt IDs 001–004. Leerer Import-Anzeigename abgewiesen,
korrigierter Import `Safari-Final-Gemeinden` als `data.gemeinden` mit vier Zeilen
auch nach Reload erhalten. Damit ist die vorherige Mac-Sperre für den
beauftragten Smoke behoben.

[15 AX-Beobachtungen und Dateihashes](verification/required-fields/native-safari-final.json),
[Namensfehler](verification/required-fields/safari-final-edit-error.png),
[Dateifehler](verification/required-fields/safari-final-file-error.png),
[Importfehler](verification/required-fields/safari-final-import-name-error.png),
[Import nach Reload](verification/required-fields/safari-final-import-success.png).
Nur eigenes Testfenster geschlossen; vorhandenen fremden Go-to-Folder-Dialog
erhalten. Eigenen Testserver nach Identitätsprüfung mit `kill -TERM 51776`
beendet (erwarteter Exit 143). Quell-/Testfingerprint danach unverändert bestätigt.
Keine neuen Produktänderungen für diese Nachprüfung nötig.

Verbleibende Prüfgrenze: Vollständiger nativer Safari-Enginepilot/Prozessneustart
und Ressourcenbenchmarks wurden für diesen Formularabschnitt nicht erneut
ausgeführt. Das Testportal verwendet synthetische Daten; keine Prüfung oder
Änderung produktiver Portale.

Nächster konkreter Schritt: Code-/UI-Durchsicht des fertigen Arbeitsbaums.
Diese Abnahme bezieht sich auf den beauftragten Pflichtfeldumfang, keine neue
V1-Releasefreigabe.

Commit-Vorbereitung nach explizitem Nutzerauftrag: `git fetch origin main`
Exit 0, lokales `main` und `origin/main` auf derselben Ausgangsrevision.
Die Prüfung des gestagten Diffs bezog erstmals auch die neuen Protokolldateien
ein und meldete Exit 2 wegen nachgestellter Leerzeichen/Leerzeilen in generierter
CLI-Ausgabe. Diese rein formalen Zeichen in den Logs normalisiert; fachliche
Ausgabe, Fehlernachweise, Messwerte und Exitcodes erhalten. Betroffene Logs sind
in `verification/required-fields/checks.json` aufgelistet. Produkt-/Testfingerprint
bleibt unverändert.

### Optionale Felder und Fehlerlayout (21. Oktober 2026)

Die Kennzeichnungskonvention ist auf ausdrücklichen Nutzerauftrag umgestellt:
Erforderliche Felder haben keinen Zusatz; optionale Felder zeigen ein gedämpftes
„(optional)“ in normaler Schriftstärke. Sternchen, Pflichtfeldhinweise und die
versteckte Pflichtfeldbeschreibung der Dateiauswahl sind entfernt. Native
`required`-Semantik, fachliche Validierung, Fokusführung und Autosave bleiben
erhalten (REQ-014, REQ-019, REQ-067; Formular-/UI-Abnahme AT-054/AT-055).

`src/ui/Controls.tsx` bietet die explizite Eigenschaft `FormField.optional`.
Der Suffix wird über `aria-describedby` zugeordnet; der zugängliche Feldname
bleibt unverändert. Beschreibung, Zufallsseed, zusätzlicher CSV-NULL-Marker,
Diagrammkategorie und Stringparameter verwenden ihn. In Parametertabellen steht
er neben der Werteingabe; Zahlen benötigen weiterhin einen Wert, NULL deaktiviert
die Eingabe ohne Suffix. Gewöhnliche Optionscheckboxen, Navigation und fest
vorgegebene SQL-Namen bleiben ohne Zusatz. Der bedingte Portalhinweis bleibt
erhalten. Die betroffenen Aufrufer und `docs/DESIGN_SYSTEM.md` sind angepasst.

`src/styles/app.css` ordnet Projekterstellungslabel, Eingabe und Fehler eigenen
Rasterzeilen zu. Der Button bleibt in der Eingabezeile und steht bei schmaler
Darstellung unter der Feldgruppe. Analysewerkzeugleisten richten Buttons auch
bei Feldfehlern weiter an der Eingabe aus. Die Suffixdarstellung einschliesslich
ausgeblendeter Parameterlabels liegt in `src/styles/components.css`.

Geprüfter Stand: Arbeitsbaum auf `12eabf38b06e52925abc830342d6bad91621ffdf`,
vor Beginn sauber. Änderungen gegen diesen Stand abgeglichen; historische
Abnahmenachweise bleiben erhalten. Die Quell-/Test-SHA-256 und tatsächlichen
Befehle stehen in [checks.json](verification/optional-labels/checks.json).

| Tatsächliche Kurzprüfung | Ergebnis |
| --- | --- |
| `npm run typecheck` auf dem finalen Quell-/Teststand | Exit 0 |
| Zwei gezielte Chromium-Fälle in `tests/e2e/optional-labels.spec.ts`, erster Lauf | Exit 1: Projektfall bestanden; SQL-Fall nach bestandenen Ausrichtungsprüfungen im Testaufbau am Parameteröffnen gescheitert |
| Nur SQL-Fall nach Korrektur des Testaufbaus wiederholt | Exit 0: bestanden; der Test wartet vor dem Parameteröffnen auf den tatsächlichen Autosave-Abschluss, Timeout auf 15 Sekunden begrenzt |
| `git diff --check` | Exit 0 |

Damit sind beide angeforderten UI-Szenarien bestanden: Projekterstellung und
Beschreibung bei 1280/390 px, Ausrichtung vor/nach Fehlern, Korrektur eines Fehlers,
stabile Feldnamen, native Pflichtsemantik, Optionalfarbe/-schrift sowie SQL-Toolbar
und Parameterwechsel String/Zahl/NULL. Für mehrzeilige Fehler wurde ausschliesslich
im Test die bestehende DOM-Fehlerregion mit einem längeren Beispieltext befüllt;
die produktiven Fehlermeldungen und Validierungsregeln wurden nicht verändert.

Belege: [erster Lauf](verification/optional-labels/ui-initial.log),
[SQL-Wiederholung](verification/optional-labels/ui-sql.log),
[Typecheck](verification/optional-labels/typecheck.log),
[Desktopfehler](verification/optional-labels/project-error-1280.png),
[schmale Darstellung](verification/optional-labels/project-error-390.png),
[optionale Beschreibung](verification/optional-labels/project-optional-description.png),
[SQL-Namensfehler](verification/optional-labels/sql-name-error.png),
[optionaler Parameterwert](verification/optional-labels/sql-optional-parameter.png).
Diese fünf Screenshots wurden visuell geprüft.

Gemäss ausdrücklichem Nutzerauftrag nicht ausgeführt: vollständiges Verify,
gesamte Testsuite, Firefox/WebKit, Deployment und Safari. R-, Import- und
Diagrammformulare wurden bei dieser Beschriftungsänderung nicht zusätzlich im
Browser geprüft. Keine Dependencies, Dokumentfelder oder Engineverträge geändert.
Nächster konkreter Schritt: Durchsicht der lokalen Änderung; kein neuer
Commit-/Pushauftrag für diesen Abschnitt.


### Neutrales Designsystem v1.2 (21. Oktober 2026)

Die genehmigte Migration ist umgesetzt: Standardtheme `neutral-blue`, getrennte
semantische Rollen für Aktion/Link/Auswahl/Fokus/Status/Destruktion, lokale variable
Source Sans 3 (3.052R) und zentrale austauschbare Marke mit neutralem DW-Platzhalter.
Die bestätigte Optional-Konvention bleibt erhalten: keine Sternchen oder
Pflichtfeldtexte. Bei der initialen Migration blieb die Eingangsreferenz
`DESIGN_SYSTEM_NEUTRAL_v1.2.md` zunächst unverändert; das operative
`DESIGN_SYSTEM.md` enthielt die bestätigten Nutzerentscheidungen bereits.
Die anschliessende Nachführung aller Referenzen ist im folgenden Abschnitt dokumentiert.

| Betroffene Requirements / Nachweise | Gelieferte Änderung |
| --- | --- |
| REQ-061, REQ-064 | Projekte, Übersicht, Daten und Einstellungen mit gemeinsamen Rollen; Tabellenzählköpfe rechtsbündig, kompakte Zeit mit aufklappbarem Vollwert |
| REQ-062–063, REQ-066 / AT-054, AT-058 | SQL/R behalten Werkzeugleistenreihenfolge, breite Arbeitsflächen, Splitter und Reload; echte SQL-Ausgabe und R-Grafik im ausgewählten P7-Fall bestanden |
| REQ-065 / AT-057 | Neutraler Header, lokale Source-Sans-Gewichte 400/500/600 und Italic, bestehende Codefont/Icons; SPEC-Brandingentscheidung auf neue Nutzerentscheidung abgeglichen |
| REQ-067 / gezielter AT-055-Nachweis | Buttongewichtung und Danger-Ton getrennt; lesbare Disabled/Readonly/Busy-Zustände, synchrone Doppelaktionsguards, Auswahlkontur, Tastatur/Fokus, hoverbarer Tooltip, Tabellen-scope/aria-sort |
| REQ-014, REQ-019 | Bestehende Namensvalidierung, Fehlerfokus und Autosave erhalten; Fehler verschieben Buttons nicht gegenüber Eingaben |

Implementierte Bereiche: `src/styles/{tokens,base,components,app}.css`,
`src/ui/{Controls,ActionMenu,Brand}.tsx`, `src/app/brand.ts`, `src/app/router.tsx` sowie die
betroffenen Formular-, Daten-, SQL-/R- und Speicheransichten unter `src/features/`.
README, SPEC, Implementierungsplan, Fontprovenienz und Assetinventar sind angepasst.
Keine neuen Dependencies, Dokument-/Archivfelder oder Engine-/Speicherverträge.
Frühere Kantonsassets und deren Herkunft bleiben historisch erhalten; sie werden
im neutralen Build nicht geladen. Fontquelle ist auf Release-Commit
`ed1808970eb3c7301c9a523bee26473ba0bb62fa` fixiert, Original-OFL wird mit ausgeliefert.

Ausgangsrevision `6e1e1e03596727fc425a8aecbf8e29c2a0afcb13`, Arbeitsbaum vor Beginn
sauber. Vor den drei Abschnitten Bestand/Diff erneut abgeglichen. Die endgültigen
Quell-/Test-/Konfigurationshashes und die Buildmanifest-SHA-256 stehen zusammen mit
Befehlen und sämtlichen Ergebnissen in
[checks.json](verification/neutral-v1.2/checks.json).

| Tatsächlich ausgeführte gezielte Prüfung | Ergebnis |
| --- | --- |
| `npm run typecheck` | Exit 0; nach Einbezug der neuen Previewkonfiguration nochmals Exit 0 |
| `APP_BASE_PATH=/lab/ npm run build` | Exit 0; nach den CSS-Korrekturen einmal neu gebaut, ebenfalls Exit 0 |
| Vier gezielte Chromium-Dev-Fälle, exakter Filter in checks.json | Erster Lauf Exit 1: drei bestanden; Komponentenfall wegen mehrdeutigem Testselektor gestoppt |
| Nur Komponentenreferenz nach Korrekturen wiederholt | Final Exit 0; alle sechs Buttonkombinationen, Kontraste, Fokus, Menü/Dialog, Fallback, Touch und Textvergrösserung bestanden |
| `npx playwright test -c playwright.neutral.config.ts --reporter=list,json` | Final Exit 0, ein Asset-Smoke gegen finalen `/lab/`-Build; Vite-Preview statt Docker |
| `git diff --check` | Exit 0 |

Alle fünf ausgewählten Szenarien sind damit bestanden. Nicht betroffene
Tooltip-, Realansichten- und SQL-/R-Fälle wurden jeweils nur einmal ausgeführt.
Der Komponentenfall wurde während der Korrekturen gezielt wiederholt: zuerst
exakte Fontstatusnamen, dann eine durch die CSS-Reihenfolge verdrängte
44-px-Touchhöhe und bei der Sichtprüfung auffällige feste Labelzeilenhöhe
korrigiert; Referenztabelle und deren Zahlenklassen vereinheitlicht. Auch der
zwischenzeitlich falsche Tabellen-Testselektor ist in den aufbewahrten Reports
sichtbar. Keine Erwartungen zur Verdeckung eines Produktfehlers abgeschwächt.

Die letzte Sichtprüfung bestätigt lesbare mehrzeilige Labels bei 200-%-Text,
ruhige neutrale Rollen, korrekt ausgerichtete Projektzahlen und SQL-Namensfehler
sowie die breite echte R-Grafik. Die Textprüfung nutzt skalierte Schriftgrössen
und 720 × 450 als Layoutsimulation; dies ist keine native Browserzoom-Abnahme.
Für den mehrzeiligen Projektfehler wurde nur im Test die DOM-Fehlerregion mit
längerem Beispieltext befüllt, ohne produktive Validierungsregeln zu ändern.

Nachweise: [Typecheck](verification/neutral-v1.2/typecheck-final.log),
[finaler Build](verification/neutral-v1.2/build.log),
[gezielter Dev-Lauf](verification/neutral-v1.2/ui.json),
[finale Komponentenprüfung](verification/neutral-v1.2/components.json),
[finaler Asset-Smoke](verification/neutral-v1.2/assets.json),
[Kontrastwerte](verification/neutral-v1.2/contrast.json),
[SQL-/R-Geometrie](verification/neutral-v1.2/geometry/p7-geometry-chromium.json),
[Projektliste](verification/neutral-v1.2/projects-table.png),
[Textvergrösserung](verification/neutral-v1.2/components-chromium-text-200.png).
Alle neuen Screenshots/Messwerte liegen separat unter `verification/neutral-v1.2/`.
Historische Nachweise bleiben unverändert. Der vorhandene Nutzerserver auf 4173
wurde nach Pfad-/Prozessprüfung wiederverwendet und läuft weiter; die eigene
Produktionsvorschau auf 4197 ist nach den Tests beendet. Nur die generierte
`dist/runtime-config.json` erhält für den Smoke `/lab/` als Betreiber-Basispfad.

Ausdrücklich nicht ausgeführt: vollständiges Verify, gesamte Unit-/Integrations-/
E2E-Suiten, Firefox/WebKit, Docker-Deploymentmatrix und Safari. Nicht in diesen
fünf Fällen enthaltene fachliche Import-/Transfer-/Archivpfade wurden nicht neu
vollständig abgenommen. Die bestehende Vite-Warnung zu grossen Codechunks bleibt;
kein Bundle-Splitting als Zusatzumfang. Dies ist eine gezielte Designabnahme,
keine erneute vollständige V1-/Releasefreigabe.

Nächster konkreter Schritt: Durchsicht der lokalen Migration. Kein Commit, Push
oder Deployment wurde für diesen Abschnitt beauftragt oder ausgeführt.


### Designsystem-Konventionen nachgeführt (21. Oktober 2026)

Auf Nutzerauftrag sind die abgestimmten Konventionen direkt im Designsystem
verankert. `docs/DESIGN_SYSTEM.md` ist ausdrücklich die massgebliche aktuelle
Projektfassung. `docs/DESIGN_SYSTEM_NEUTRAL_v1.2.md` enthält dieselben fachlichen
Gestaltungsregeln; die ältere v1.1-Datei ist als historisch gekennzeichnet.

Ein zusammenfassender Abschnitt nennt die dauerhaften Regeln: Pflichtfelder
ohne Zusatz, expliziter Optionalzusatz samt Ausnahmen, sichtbare kompakte
Analysenamen, stabiles Fehlerlayout, mitwachsende Labelzeilenhöhe und gezielter
UI-Prüfumfang. Die widersprechenden Sternchen-/Vollgate-Regeln in v1.2 sind
ersetzt. Validierungszeitpunkt, Fehlerfokus und Erhalt ungültiger Entwürfe sind
wieder ausdrücklich beschrieben. Vollständige funktionale und Releaseabnahmen
bleiben an SPEC und Auftrag gebunden; die UI-Regel reduziert deren Umfang nicht.

Prüfung: gezielter Inhalts-/Link-/Referenzabgleich und `git diff --check`, beide
Exit 0. Nur Dokumentation geändert; keine neuen Laufzeit-, Build- oder Browsertests
für diese Nachführung ausgeführt. Vorhandene Implementierungsänderungen und
historische Abnahmenachweise sind erhalten. Nächster Schritt: aktuelle
Projektfassung als Grundlage weiterer UI-Arbeit verwenden; keine erneuten
Ausnahmeentscheidungen für die aufgeführten Konventionen nötig.


Commit-Vorbereitung auf Nutzerauftrag: `git fetch origin main` Exit 0;
`HEAD...origin/main` vor dem Commit 0/0. Die Prüfung des gestagten Diffs hat
Windows-Zeilenenden und nachgestellte Leerzeichen in der neu übernommenen
Original-OFL gefunden. Ausschliesslich diese Formatierung normalisiert und
identischen Lizenzwortlaut ohne Whitespace nachgewiesen. Fontdateien und
geprüfte Quell-/Test-/Konfigurationshashes unverändert. Anschliessender
`git diff --cached --check`: Exit 0. Keine weiteren Tests für Commit/Push gestartet.


### Projektzeitstempel als Tooltip (22. Oktober 2026)

Das Aufklappelement in der Projektliste ist auf Nutzerauftrag durch den
vorhandenen gemeinsamen Tooltip ersetzt. Sichtbar bleibt das bisherige Datum
bis auf Minuten; der Tooltip zeigt Sekunden, Millisekunden und Zeitzone im
bisherigen de-CH-Format. Das unveränderte `<time datetime>` ist per Tab erreichbar;
Hover und Tastaturfokus zeigen den Vollwert, `aria-describedby` vermittelt ihn
assistiven Technologien und Escape schliesst die Anzeige. Kein zusätzlicher
Button/Pfeil, kein nativer `title`-Tooltip und keine Änderung der Zeilenhöhe.

Betroffen: REQ-061/REQ-067, `src/features/workspaces/Workspaces.tsx` und die
entfernten `.timestamp-detail`-Regeln in `src/styles/app.css`. Datenwerte und
Tooltipvertrag bleiben unverändert. Die Datumsregel ist im aktuellen Designsystem
und den Referenzfassungen v1.2/v1.3 nachgeführt. Die Menü-/Split-Button-Regeln von
v1.3 und historische Nachweise bleiben erhalten.

Ausgangsrevision `1b843ed`, Arbeitsbaum vor Beginn sauber. Tatsächliche Kurzprüfung:
`npm run typecheck` einmal, Exit 0; genau ein Chromium-Fall in
`tests/e2e/timestamp-tooltip.spec.ts`, Exit 0, 1/1 bestanden (2.1 Sekunden Fall,
2.5 Sekunden gesamter Lauf). Sichtbare Minutenanzeige und ISO-Zeitwert,
Hover-/Tastaturanzeige, Fokus, Escape und unveränderte Zeilenhöhe sind geprüft.
Der eine Screenshot wurde visuell geprüft. Die bisherige Aufklapp-Erwartung in
`tests/e2e/neutral-ui.spec.ts` ist angepasst; dieser umfangreiche Fall wurde
bewusst nicht zusätzlich ausgeführt.

[Exakte Befehle, Exitcodes, Revision und Dateihashes](verification/timestamp-tooltip/checks.json),
[Typecheck](verification/timestamp-tooltip/typecheck.log),
[Chromium-Report](verification/timestamp-tooltip/ui.json),
[Screenshot](verification/timestamp-tooltip/timestamp-tooltip.png).
`git diff --check`: Exit 0. Kein Build, keine vollständigen Suiten und keine
weiteren Browser ausgeführt. Vorhandener Nutzerserver auf 4173 nach Pfad-/
Prozessprüfung wiederverwendet und erhalten. Nächster Schritt: lokale Änderung
durchsehen; für diesen Abschnitt kein Commit/Push ausgeführt.

### Menü-/Split-Buttons v1.3 und direkte R-Exporte — Prüfverlauf (23. Oktober 2026)

Auftrag: REQ-038/048/054/059/061–067, gezielte Erweiterung ohne Releasefreigabe.
Ausgangsrevision `243ad73`, Arbeitsbaum vor Beginn sauber. Bestehender Vite-Prozess
52467 anhand Commandline und cwd als Zielprojekt bestätigt und wiederverwendet.
Keine Dependencies oder Projektformate geändert. R-Exporte verwenden geprüfte
vollständige Payloads und temporäre Relationen des vorhandenen Connectors;
keine OPFS-/Metadatenpublikation. Gemeinsame Menükomponenten/Ansichtsmigration
und Abnahme sind noch in Arbeit.

Bisherige tatsächliche Prüfungen: erster Typecheck Exit 0, nach Ergänzung neuer
Integrationstests Typecheck Exit 2 (JSON-Testkonfiguration noch nicht typisiert).
Erster echter Chromium-R-Exportlauf Exit 1, 0/3: DuckDB akzeptiert `NEWLINE`
nicht als COPY-Option; zwei weitere Assertions lasen irrtümlich Error.toString
statt strukturierter Fehlercodes. Korrekturen: `NEW_LINE`, typisierte
Testkonfiguration und strukturierte Fehlerprüfung. Wiederholung läuft.
Kein Bestandstest gelöscht oder deaktiviert; keine fachlichen Goldenwerte
geändert. Nächster Schritt: R-Export-Nachweis abschliessen, danach UI migrieren.

Zwischenprüfung: erster echter R-Lauf nach COPY-Korrektur Exit 0, 3/3.
Komponenten-Smoke Exit 0, 2/2. Gezielte UI-/Engine-Regression Exit 0, 17/17:
Komponenten, neutrale reale Ansichten, vier P7-Fälle, direkter R-Dateidownload,
bestehender R-Rundlauf/Workerabbruch, SQL/Diagramme und Projekt-/Lesemodusfälle.
Typecheck und Lint/Grenzen Exit 0. Erweiterter R-Nachweis (Parquet-Reimport,
Cleanup-Fault, echtes Timeout) zunächst Exit 1, 2/4: neue Erwartung hatte den
Anzeigevertrag `readPage` (exakte Strings) übersehen; ein parallel versuchter
zweiter Playwright-Prozess löschte dessen Trace-Verzeichnis und scheiterte selbst
vor Teststart am belegten Portalport 4174. Tests nun seriell mit getrennten
Ausgabeverzeichnissen; fachliche Assertions nach tatsächlichem Anzeigevertrag
präzisiert. Historische PNG-Nachweise aus dem ersten UI-Lauf wiederhergestellt;
neue Belege liegen ausschliesslich unter `verification/buttons-v1.3/`.

### Menü-/Split-Buttons v1.3 und direkte R-Exporte — gezielt abgenommen (23. Oktober 2026)

**Status: implementiert und im beauftragten Umfang geprüft.** Kein Commit, Push,
Deployment oder V1-Release durchgeführt. Verifizierte Basisrevision `243ad73`
mit uncommittierten Änderungen; SHA-256 des produktiven Änderungsstands:
`6f97689c3c08f63aaa205fc5f0f10b8522dce138b09d511215956ab4419d9dee`.
Dateihashes, exakte Prüfbefehle und Exitcodes stehen in
[checks.json](verification/buttons-v1.3/checks.json).

| Requirement / Abnahme | Geliefert | Relevante Dateien |
| --- | --- | --- |
| REQ-061/064/067; AT-055/057/058 | Gemeinsame Menüinfrastruktur, MenuButton, SplitButton, Overflow; Tastatur, ARIA, Disabled-/Busy-Aktionen, echte Router-Links, Fokus und Viewportpositionierung | `src/ui/ActionMenu.tsx`, `src/styles/components.css`, Komponentenreferenz und neue Button-E2E |
| REQ-061–067; AT-054/055/057/058 | Daten hinzufügen / Neue Analyse als Menü; Analyseaktionen im Overflow; CSV als stabile Split-Hauptaktion; Verwaltung gruppiert; SQL-Reset direkt; R-Ansichtstoggles sichtbar | Ansichten unter `src/features/{data,workspaces,archive,sql,r}/`, `src/styles/app.css` |
| REQ-038/048/054/059; AT-032/043–046/055 | Vollständiger direkter R-CSV-/Parquet-Export ohne Datensatz oder dauerhaften Capture; Warnungen, Session-/Scope-/Epoch-/Mutationsbindung, Limits, Cleanup, echter Cancel/Timeout | `src/application/rPorts.ts`, `rService.ts`, `src/features/r/RTableExport.tsx`, `Transfer.tsx`, bestehender DuckDB-Dateiexporter |
| Designsystem / Vertrag | Aktuelle Projektfassung auf v1.3 nachgeführt; direkte R-Exporte und zusätzliche Abnahmefälle konkretisiert | `docs/DESIGN_SYSTEM.md`, `SPEC.md`, `ACCEPTANCE_TESTS.md` |

Der neue Application-Vertrag enthält `planExport`, `exportTable` und
`discardExport`. Payloads und Pläne bleiben ausschliesslich in der Sitzung.
Export nutzt den vorhandenen Connector mit temporären Relationen; die Streams
sind nach der Dateierzeugung unabhängig vom freigegebenen TableHandle. Keine
zusätzliche OPFS-/Metadatenpublikation, neue Dependency, Schema- oder
Projektformatmigration. Normale R-Dateiexporte lassen das Projektdokument
nachweislich unverändert. Ein notwendiger PostMessage-Workerreset verwirft wie
bisher ungesicherte R-Objekte und aktualisiert deren Verfügbarkeit.

CSV verwendet explizit Semikolon und LF; NULL, Leerstring, Unicode und rohe
Formelpräfixe bleiben unterscheidbar beziehungsweise unverändert. CSV-Typverlust
ist sichtbar. Faktorwerte erfordern wegen Verlust von Levels/Ordnung eine
explizite Bestätigung. Parquet wird mit dem bestehenden Typvertrag erzeugt;
interne Ordinalspalten werden nicht exportiert. Der Default bleibt nach einer
Parquet-Auswahl CSV. Split-Teilflächen haben getrennten Fokus und mindestens
44 × 44 px bei grobem Zeiger, ohne überlappende Bedienziele.

**Tatsächliche Prüfungen:** Node 22.23.1, npm 11.18.0, Playwright 1.63.0,
Chromium 153.0.8010.12 auf macOS. Folgende Aufrufe hatten Exit **0**:

- `npm run typecheck` und `npm run lint`, einschliesslich Modulgrenzen;
  [Typecheck](verification/buttons-v1.3/typecheck-delivery.log),
  [Lint](verification/buttons-v1.3/lint-delivery.log).
- `npx vitest run tests/unit/r-codec.test.ts tests/unit/run.test.ts tests/unit/workspace.test.ts`:
  **14/14**; [Log](verification/buttons-v1.3/unit.log).
- `APP_BASE_PATH=/lab/ npm run build`: Produktionsbuild und Lizenzinventar;
  [Log](verification/buttons-v1.3/build-delivery.log). Die bekannte Warnung zu
  grossen Editorchunks bleibt bestehen.
- Echte R-Exportfälle: **4/4** im Kernlauf, danach je **1/1** für die annotierten
  Typgrenzen und harten Limits/fremden Scopes. Belegt sind vollständiger
  350-Zeilen-Export trotz 200-Zeilen-Vorschau, Parquet-Reimport, BIGINT/DECIMAL/DATE,
  NULL/NA getrennt von NaN/Infinity, leere Tabellen, Faktorwarnung, verworfene und
  veraltete Pläne, Fehler-Cleanup sowie tatsächliche Workerbeendigung bei Cancel
  und Timeout mit anschliessender Nutzung.
  [Kern](verification/buttons-v1.3/r-engines-final.log),
  [Typen](verification/buttons-v1.3/r-exact-types.log),
  [Limits und Scope](verification/buttons-v1.3/r-limits.log).
- Erster gezielter UI-/Engine-Lauf **17/17**. Abschliessender Fokuslauf **5/5**
  einschliesslich R-Downloads und Faktorbestätigung; zusätzliche Prüfung der
  nicht überlappenden Split-/Touch-Ziele **2/2**.
  [Finale UI](verification/buttons-v1.3/final-ui.log),
  [Bedienziele](verification/buttons-v1.3/touch-targets.log).
- Reale SQL-/R-Geometrie **1/1** bei 1440 × 900 und 1280 × 800 mit echten
  Ergebnissen, Resize, Reset und Reload. Nachweise wurden nach Verlust der
  ersten temporären Playwright-Ausgabe gezielt neu erhoben.
  [Log](verification/buttons-v1.3/geometry.log),
  [Messwerte](verification/buttons-v1.3/geometry/p7-geometry-chromium.json).
- Produktionsvorschau unter `/lab/` **1/1**: lokale Fonts/SVGs/Lizenzen und
  Font-Fallback; [Log](verification/buttons-v1.3/lab-assets-checked.log).
- `git diff --check`: Exit **0**. Keine Änderungen an historischen
  Verifikationsdateien, Fixtures, Paketversionen oder Lockfile.

Der zusätzliche Sammellauf über betroffene Import-/Archiv-/Projekt-/UI-Fälle
endete mit Exit **1**, **38/40 bestanden**. Seine zwei Fehler waren konkrete
veraltete Testannahmen: der zuvor bereits auf „Vorschau“ gesetzte Referenzstatus
und der entfallene SQL-Overflow-Auslöser im Test für verspätetes Editorladen.
Die Prüfungen erhalten ihre fachliche Aussage (deaktivierte Aktion verändert
nichts; Fokus und Reset bleiben beim echten Lazy-Load erhalten) und wurden
gezielt korrigiert und erfolgreich im 5/5-Fokuslauf wiederholt. Kein grüner
40er-Gesamtlauf wird behauptet. Der bestandene Anteil enthält unter anderem
Golden-Archiv, Multitab, OPFS-Fehler, Import/Ersetzen, Recovery und Golden Path
mit Prozessneustart. [Vollständiges Sammellog](verification/buttons-v1.3/affected-regressions-final.log).

Visuell geprüft wurden Projektübersicht und SQL-Fehlerlayout. Weitere Screenshots
und Messwerte liegen unter `verification/buttons-v1.3/`. Die Referenz prüft
vergrösserten Text, geringe Höhe, Umbruch und emulierte Touch-Ziele; dies ist
keine native Browserzoom- oder physische Touch-Abnahme. Historische Nachweise
wurden wiederhergestellt; die Testausgaben verwenden nun eigene v1.3-Pfade.

**Nicht ausgeführt:** vollständiges `npm run verify`, vollständige Unit-/
Integrations-/E2E-Suiten, Firefox-/WebKit-Matrix, Docker-Deploymentmatrix und
nativer Safari. Die angepassten Deployment-Testselektoren wurden typgeprüft und
gelintet; deren Browser-/Containerläufe sind nicht erneut abgenommen.
Dies ist keine vollständige V1-/Releasefreigabe.

Nächster konkreter Schritt: lokale Durchsicht der implementierten Änderung und
des Prüfnachweises; im beauftragten Button-/R-Dateiexportumfang bleibt kein
bekannter Blocker. Weitergehende Browser-/Releaseabnahme ist ein eigener Abschnitt.

### UI-Texte und Informationshierarchie v1.4 — gezielt geprüft (23. Oktober 2026)

**Status: umgesetzt und im beauftragten UI-Umfang geprüft.** Grundlage sind die
Projektfassung des Designsystems sowie die Ergänzungen 4.4, 9.1 und 12.2 aus
`DESIGN_SYSTEM_NEUTRAL_v1.4.md`; sie sind in `DESIGN_SYSTEM.md` übernommen.
REQ-061–067 / AT-054–058; die unveränderliche Herkunft aus AT-018/058 bleibt
lesend nachvollziehbar. Verifizierte Basisrevision `faff291` mit lokalen
Änderungen. Produktiver Änderungsstand (SHA-256):
`2c912570fc40ea6667f34b7cf937986a0bf10b606f7f778761cdc2a54246e780`.
Pfadbezogene Quell-/Testhashes, Runtime und genaue Befehle stehen in
[checks.json](verification/ui-texts-v1.4/checks.json).

| Bereich | Korrektur / Dateien |
| --- | --- |
| SQL und R | Gemeinsame `RunStatus`-Darstellung mit Hauptaussage „Ausführung …“ und nachgeordneter Revision/Laufzeit; eindeutige Texte für alle sieben Laufzustände, nicht verfügbare Werte und Laufzeit 0. Keine redundante SQL-Kennung vor der Editorrevision. Laufwahl als verständlicher Text. `src/features/results/RunDetails.tsx`, `sql/SqlWorkbench.tsx`, `r/RWorkbench.tsx` |
| Resultate und Herkunft | Kennzahlen als Label-Wert-Paare; Erklärungen als Sätze; Quelle, Format, Analyserevision, Portalbezug und Dateigrösse eindeutig zugeordnet. R-Objektnamen und Umfang getrennt dargestellt; Transferpläne benennen Zeilen und geschätzte Datengrösse. `data/{DataSection,DatasetHistory}.tsx`, `results/RunDetails.tsx`, `r/{RWorkbench,Transfer}.tsx`, `catalog/PortalImport.tsx` |
| Archive und Dateiprüfung | Import-/Exportumfang beschriftet; normales Inventarergebnis ohne farbige Notice. Auffälligkeiten mit unveränderten Zahlen und ausdrücklichem Hinweis, wenn Dateilängen/SHA-256 noch nicht geprüft wurden. Keine Behauptung einer vollständigen Integritätsprüfung nach blosser Bestandsaufnahme. `archive/ArchiveActions.tsx` |
| Speicher, Sitzung, Diagnose | Vollständige Hinweise zu lokaler/temporärer Speicherung und Schreibschutz; beschriftete Schätzwerte und Diagnosedaten. Fehler der Bereinigung als separate unveränderte Originalmeldungen statt einer `join('; ')`-Kette. `workspaces/{StorageSettings,Diagnostics}.tsx`, `app/router.tsx` |
| Gestaltung | Bestehende Tokens, kompakte Typografie und umbrechende semantische `dl`-Gruppen in `styles/app.css`; keine neuen Dependencies, Badges oder Icons. |

**Systematische Suche und bewusste Ausnahmen:** `src/` nach `·`, `&middot;`,
Unicode-/Hex-Escapes, ähnlichen Separatoren, `join()` und dynamischen Status-/
Metadatentexten durchsucht. In Anwendungstexten der UI bleiben keine
Mittelpunktketten. Der verbleibende Treffer in `application/rService.ts`
benennt ein gespeichertes Grafikergebnis (`Analyse · Grafik …`) und bleibt als
Dokumentinhalt unverändert. Ebenso unverändert: Benutzer-/Datensatznamen,
SQL-/R-Code, Datenwerte, exakte Zahlen/Zeitstempel, Originalfehlermeldungen,
technische Rohdaten, Diagnose-/Dateiexporte und Schnittstellen. Kommalisten
von Namen, NULL-Markern oder R-Klassen sind fachlich zusammengehörige Listen;
SQL-/URL-/ARIA-Verkettungen bleiben technische Verträge. Schemaänderungen und
Bereinigungsfehler werden als Listen statt als verkettete Kurztexte angezeigt.
Keine fachlichen Statuswerte, Prüfabläufe, Engine-/Speicherverträge oder
Zustandsübergänge geändert.

**Tatsächlich ausgeführte Prüfungen:** Node 22.23.1, npm 11.18.0,
Playwright 1.63.0, Chromium 153.0.8010.12, macOS. Alle nachfolgenden
Erfolgsangaben beruhen auf Exit **0**:

- `npm run typecheck`, `npm run lint` einschliesslich Modulgrenzen;
  [Typecheck](verification/ui-texts-v1.4/typecheck-final.log),
  [Lint](verification/ui-texts-v1.4/lint-final.log).
- `npx vitest run tests/unit/provenance.test.ts`: **17/17**. Alle Laufzustände,
  fehlende Angaben, Laufzeit 0 und 0.125 ms, exakte grosse Zeilenzahlen,
  Hashprüfung gegenüber Inventar, fehlende/beschädigte Bytes und unverändertes
  Projektdokument; [Log](verification/ui-texts-v1.4/unit.log).
- Erster gezielter Chromium-Lauf **8/8**: bestehende echte SQL-/R-Flächenmessung,
  SQL-Paging/Export/Chart/NULL/Cancel, R-Rundlauf/Reset/Workerabbruch, direkter
  R-Export und zwei neue Text-/Layoutfälle;
  [Log](verification/ui-texts-v1.4/chromium-core-initial.log).
- Zusätzlicher Ansichtenlauf **10/11**, Exit **1**. Erfolgreich: Tooltip,
  temporärer/lesender Modus, Einstellungen/Diagnose, Portalimport,
  CSV-Versionsgeschichte, SQL-Laufsnapshots/Archivimport und drei Textfälle.
  Ein beim Textumbau zu weit gefasster Archivselektor zählte neben drei
  Übersichtseinträgen auch drei eingeklappte Herkunftseinträge. Auf die
  Übersicht begrenzt; einzig diesen Fall erneut ausgeführt: **1/1**, Exit **0**.
  Der erste Lauf wird ausdrücklich nicht als 11/11 ausgegeben.
  [Sammellog](verification/ui-texts-v1.4/chromium-views.log),
  [gezielte Wiederholung](verification/ui-texts-v1.4/chromium-archive.log).
- `APP_BASE_PATH=/lab/ npm run build`: Exit **0**, einschliesslich Assets und
  Lizenzinventar. Bekannte Warnung zu grossen Editorchunks bleibt bestehen;
  [Buildlog](verification/ui-texts-v1.4/build.log).
- `git diff --check`: Exit **0**. Keine Änderungen an historischen
  Verifikationsdateien, Fixtures, Paketversionen oder Lockfile.

Insgesamt wurden **17 unterschiedliche Chromium-Fälle erfolgreich geprüft**;
zwei Textfälle wurden in beiden Läufen ausgeführt. Die Textfälle prüfen reale
leere SQL-Ergebnisse, lange Namen, erhaltene Mittelpunkte in Code/Daten,
fehlende Speicherwerte, teilweise Dateiprüfungen und Bereinigungsfehler. Nur die
zusätzlichen Inventar-/Fehler-/Schätzantworten sind ausdrücklich als
Darstellungsproben injiziert; sie sind keine Engine- oder Speichernachweise.

Geometrie bei 1440 × 900 und 1280 × 800 erfüllt weiterhin den SQL-/R-Vertrag.
Zusätzlich kein horizontaler Überlauf in SQL bei 640 × 650, in Einstellungen
bei 390 × 700 sowie mit 200 % Textgrösse bei 1280 × 650. Vergrösserter Text ist
keine native Browserzoom-Abnahme. Screenshots von SQL-Status, R-Arbeitsfläche,
Archivdialog und Speicher wurden visuell geprüft. Neue Screenshots und
Messwerte liegen ausschliesslich unter
[ui-texts-v1.4/screens](verification/ui-texts-v1.4/screens/).
Der vorhandene Vite-Prozess 52467 wurde anhand Commandline und cwd geprüft,
wiederverwendet und erhalten; Browserprüfungen nutzten isolierte Testprofile.

**Nicht ausgeführt:** vollständiges `npm run verify`, vollständige Unit-/
Integrations-/E2E-Suiten, Firefox-/WebKit- oder Deploymentmatrix, nativer Safari
und native Zoomprüfung. Die ebenfalls angepassten Selektoren in den übrigen
Required-Fields-/Workspace-/Golden-/Recovery-/Deploymentfällen wurden typgeprüft
und gelintet, diese Fälle aber nicht zusätzlich komplett ausgeführt.
Kein Commit, Push, Deployment oder V1-Release in diesem Abschnitt.

Nächster konkreter Schritt: lokale Durchsicht der Text-/Layoutänderungen und
Nachweise. Im beauftragten Umfang bleibt kein bekannter Blocker.

### UI — Projektdatei auswählen (23. Oktober 2026)

REQ-061 / AT-057: Auf Nutzerauftrag heisst der sekundäre Button unter
„Projektdatei importieren“ jetzt „Datei auswählen …“. Die Dateiauswahl führt
weiterhin zur Prüfung und Importbestätigung. Implementiert in
`src/features/archive/ArchiveActions.tsx`; bestehende Namensselektoren in
`tests/e2e/{design-system,p7-ui}.spec.ts` angepasst. Verifizierte Basisrevision:
`faff2910f9fcadcbff6f9b4566b416fc9d7d918f` mit lokalen Änderungen.

Tatsächlich ausgeführte Prüfungen:

- `npx eslint src/features/archive/ArchiveActions.tsx tests/e2e/design-system.spec.ts tests/e2e/p7-ui.spec.ts`: Exit **0**.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/design-system.spec.ts tests/e2e/p7-ui.spec.ts tests/e2e/archive.spec.ts --grep 'UI screens: project actions|P7 AT-055–057: native focus|P6 AT-059: recipe' --reporter=list --output=/tmp/datenwerkstatt-import-button-tests`: Exit **1**, **2/3** bestanden. Recipe-Import sowie Fokus-/Einstellungsfall bestanden. Der Designsystemfall bestätigt den neuen Button samt Secondary-Stil, scheitert später an der unabhängigen Sidebar-Prüfung (8 SVGs statt 7).
- `node --input-type=module` mit direkter Playwright-Probe über stdin: Exit **0**. Neuer Button sichtbar; Secondary-Stil, echter Dateiauswahldialog, Archivprüfung, Bestätigungsdialog vor Navigation, Abbrechen und Fokusrückgabe geprüft. Screenshot `/tmp/datenwerkstatt-import-button.png` visuell geprüft.
- `npm run typecheck`: Exit **2**, unabhängiger Fehler im vorhandenen Arbeitsstand: `tests/unit/workspace.test.ts:303`, TS2554 (Argument fehlt).
- `git diff --check`: Exit **0**.

Nicht ausgeführt: vollständiges `npm run verify`, vollständige Suiten und
Browsermatrix. Keine weiteren Funktionen oder Requirements geändert.
Nächster konkreter Schritt: unabhängige TypeScript-/Sidebar-Prüffehler im
parallel bearbeiteten Arbeitsstand beheben; die Buttonumbenennung ist geprüft.

### UI — Roter Hover am Hinweis-Schliessen-Icon (23. Oktober 2026)

REQ-061/062/065, AT-055/057: Auf Nutzerauftrag wechselt das globale
Schliessen-Icon bei Hover von `text-secondary` zu `error-fg` (`#B42318`).
Die Hover- und Druckfläche verwendet `danger-subtle-pressed` (`#FEE4E2`),
damit sie sich vom hellroten Hinweis abhebt. Ruhezustand, Tooltip und
gemeinsamer Fokusring bleiben erhalten. Implementiert in `src/styles/app.css`;
Vertrag in `docs/DESIGN_SYSTEM.md` und bestehende Interaktions-Sollwerte in
`tests/e2e/navigation.spec.ts` entsprechend der Nutzerentscheidung angepasst.
Verifizierte Basisrevision: `faff2910f9fcadcbff6f9b4566b416fc9d7d918f`
mit vorhandenen lokalen Änderungen; keine Änderungen an Engine-/Speicherverträgen.

Tatsächlich ausgeführte Prüfungen (Node 22.23.1, npm 11.18.0,
Playwright 1.63.0 / Chromium):

- `npm run typecheck && npx eslint tests/e2e/navigation.spec.ts && git diff --check`:
  Exit **0**; der zuvor dokumentierte TypeScript-Fehler tritt im aktuellen
  Arbeitsstand nicht mehr auf.
- Erster Versuch mit `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/navigation.spec.ts --grep 'Notices:' --reporter=list --output=/tmp/datenwerkstatt-notice-hover-tests`:
  Exit **1**, kein Test gestartet, da der Testportal-Port 4174 bereits belegt war.
  Vorhandenen Vite- und Testportal-Prozess anhand Commandline und cwd geprüft
  und unverändert erhalten.
- `DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 npx playwright test --project=chromium tests/e2e/navigation.spec.ts --grep 'Notices:' --reporter=list --output=/tmp/datenwerkstatt-notice-hover-tests`:
  Exit **0**, **1/1 bestanden**. Prüft Ruhe-/Hover-/Druckzustände samt SVG-Farbe,
  kurze/lange Hinweise bei 1440 × 900 und 1280 × 800 mit 100/200 % CSS-Zoom,
  Tooltip, Fokus und Schliessen per Tastatur. Hover-Screenshot bei 200 %
  visuell geprüft; Artefakte unter `/tmp/datenwerkstatt-notice-hover-tests`.
- `npm run build > /tmp/datenwerkstatt-notice-hover-build.log 2>&1`:
  Exit **0**, einschliesslich Assetvorbereitung und Lizenzinventar.
  Bekannte Warnung zu grossen Editorchunks bleibt bestehen.

Nicht ausgeführt: vollständiges `npm run verify`, vollständige Unit-/Integrations-/
E2E-Suiten und Browsermatrix. Im beauftragten Hover-Umfang kein bekannter Blocker.
Nächster konkreter Schritt: lokale Durchsicht des gewählten Rottons.

### UI — dezenter Speicherhinweis und eigene Projektdiagnose (23. Oktober 2026)

**Status: im beauftragten Umfang implementiert und geprüft.**
REQ-059/060/061/064/067/072/077; AT-054–058 und gezielter Recovery-Nachweis.
Verifizierte Basisrevision `faff2910f9fcadcbff6f9b4566b416fc9d7d918f` mit bereits
vorhandenen lokalen Textänderungen. Der währenddessen separat umbenannte Button
„Datei auswählen …“ und dessen Nachtrag bleiben erhalten. Produktiver
Änderungsstand einschliesslich statischer Routenfreigabe (SHA-256):
`ac45c13d26ce5ede95cb229fa49caa0e39c0a9af49a16afededf0a9ec4b7665b`.
Einzelhashes, Runtime und exakte Prüfbefehle stehen in
[checks.json](verification/diagnostics-settings/checks.json).

**Geliefert:**

- `src/app/router.tsx`: vier zusammenhängende Einstellungsoptionen, reservierte
  neutrale Live-Statuszeile ohne Anfangsbestätigung; Erfolg drei Sekunden,
  Fehler bis zum nächsten Versuch. Neueste Antwort gewinnt; Timer und verspätete
  Rückmeldungen werden beim Seitenwechsel verworfen.
- Neue Projekt-Unterroute `/projects/$workspaceId/diagnostics` mit Navigation
  direkt unter Einstellungen, bestehendem `info-circle`, Tooltip und aktivem
  Ziel. WorkspaceProvider, Scheduler und Editormodelle bleiben erhalten; ohne
  geöffnetes Projekt erscheint kein Diagnoseeintrag.
- `src/features/workspaces/Diagnostics.tsx`: Dateiprüfung und Berichtdownload,
  live abonnierter Operationsstatus, technische Details zunächst eingeklappt.
  Berichtformat 1 und dessen Felder bleiben unverändert; Code wird nur nach
  ausdrücklicher Auswahl aufgenommen. Öffnen startet weder Engine noch Prüfung.
- `src/features/archive/ArchiveActions.tsx` und `Workspaces.tsx`: Diagnose und
  normaler Inventarstatus aus der Übersicht entfernt. Relevante Daten-/Prüffehler
  bleiben mit Link zur Diagnose sichtbar. Inventarwarnungen aktualisieren sich
  auch nach Abschluss einer Prüfung auf einer anderen Unterseite. Import,
  Export, Duplizieren und Löschen bleiben an ihren bisherigen Stellen.
- `WorkspaceEditingSession.inspectIntegrity` behält das letzte Ergebnis bei
  einem Prüffehler, setzt den Laufzeitfehler und entfernt ihn nach erfolgreicher
  Wiederholung. Keine Änderung am Prüfverfahren oder Projektdokument.
- `scripts/deployment.mjs` erlaubt die neue Projekt-Unterroute, ohne unbekannte
  Routen oder fehlende Assets auf die SPA umzuleiten. Designsystem, SPEC und
  AT-057 sind nachgeführt; keine Dependencies oder gespeicherten Formate geändert.

**Tatsächliche Prüfungen:** Node 22.23.1, npm 11.18.0, Playwright 1.63.0,
Chromium 153.0.8010.12, Caddy 2.11.4 auf dem vorhandenen lokalen Testimage.

| Prüfung | Ergebnis / Nachweis |
| --- | --- |
| `npm run typecheck` | Exit **0**, [abschliessendes Log](verification/diagnostics-settings/typecheck-delivery.log) |
| `npm run lint` einschliesslich Modulgrenzen | Exit **0**, [Log](verification/diagnostics-settings/lint-delivery.log) |
| `npx vitest run scripts/deployment.test.mjs tests/unit/workspace.test.ts tests/unit/provenance.test.ts` | Exit **0**, **29/29**; Routenfreigabe für Root und `/lab/`, Fehler/Wiederholung ohne Dokumentmutation, bestehende Herkunft/Präzision; [Log](verification/diagnostics-settings/unit-final.log) |
| Neue Speicher-/Diagnosefälle | Zunächst **1/3**, Exit **1**: Testuhr lief neben dem Zeitsprung weiter; programmgesteuerter Fokus nach Mausklick war kein Tastaturfokus. Uhr vor der Änderung pausiert und Tastaturmodalität explizit hergestellt. Nur die beiden fehlgeschlagenen Fälle wiederholt: **2/2**, Exit **0**. [Erster Lauf](verification/diagnostics-settings/chromium-first.log), [Wiederholung](verification/diagnostics-settings/chromium-retry.log) |
| Betroffene Chromium-Regressionen | Exit **0**, **10/10**: Navigation, reale Ansichten, alle vier P7-Fälle einschliesslich SQL-/R-Geometrie und Cursorhistorie, verschobene Inventar-/Hashzustände sowie tatsächliche OPFS-Korruption/Recovery; [Log](verification/diagnostics-settings/chromium-regressions.log) |
| `APP_BASE_PATH=/lab/ npm run build` | Exit **0**, einschliesslich Assets und Lizenzinventar; bekannte Editorchunk-Warnung; [Log](verification/diagnostics-settings/build-final.log) |
| Isolierter Produktionsbuild und echter Caddy-Smoke unter `/lab/` | Exit **0**, **1/1**: Direktaufruf, Reload, aktives Ziel, keine gestarteten Worker, 404 für unbekannte Routen/fehlende Assets; [Log](verification/diagnostics-settings/chromium-static-checked.log) |
| `git diff --check` | Exit **0** |

Die Speicherprüfung verwendet für Bestätigung und Reload echte IndexedDB-
Speicherung. Verzögerte/fehlgeschlagene Antworten werden zusätzlich gezielt
injiziert, um Reihenfolge, Fehlerdauer und Bereinigung beim Verlassen zu prüfen.
Der neue Diagnosefall verwendet echte DuckDB-/webR-Worker: dieselbe Sitzung,
R-Scope und R-Objekte bleiben erhalten; ein laufender SQL-Lauf läuft über die
Navigation weiter. Der Operationsstatus aktualisiert sich und die Dateiprüfung
bleibt währenddessen gesperrt. Der Abbruch des echten SQL-Laufs wird abgewartet.
Berichte mit und ohne Code werden auf Felder und Inhalt geprüft; Navigation,
Dateiprüfung und Berichtdownload verändern das Projektdokument nicht.

Insgesamt **14 unterschiedliche Chromium-Fälle erfolgreich geprüft**. Die
fehlgeschlagenen Anfangsläufe bleiben als solche dokumentiert; kein grüner
Gesamtlauf wird daraus abgeleitet. Der erste Typecheck nach Testerweiterung
hatte Exit **2** wegen zweier Testtypfehler (Store-Konstruktorargument und
`Node.remove`); beide sind korrigiert und abschliessend typgeprüft.

Beim ersten statischen Test lag im gemeinsam genutzten `dist/` ein Root-Build
mit `/assets/` vor; der `/lab/`-Lauf hatte Exit **1**. Für den Nachweis wurde
anschliessend ein eigener Build mit explizitem `--base /lab/ --outDir` erzeugt.
Eine weitere Wiederholung scheiterte an einer vor Abschluss der Projekterstellung
abgelesenen Test-URL (Exit **1**). Nach Warten auf die Projektüberschrift bestand
der gezielte Fall mit Exit **0**. Alle Befehle, Logs und die verwendete lokale
Server-/Testkonfiguration sind im Nachweisverzeichnis erhalten. Dies ist keine
vollständige Docker-Deploymentmatrix und keine erneute Root-Caddy-Browserabnahme.

Visuell geprüft: Einstellungen ohne Balken und Diagnose mit eingeklappten sowie
geöffneten Details. 1440 × 900, 1280 × 800, 390 × 700 und 200 % Textgrösse bei
1280 × 650 ohne horizontalen Überlauf; bestehender SQL-/R-Flächenvertrag erfüllt.
Screenshots und Geometriemessungen liegen unter
[diagnostics-settings/screens](verification/diagnostics-settings/screens/).
Textvergrösserung ist keine native Zoomabnahme. Historische Nachweise und
Paket-/Lockfiles blieben unverändert. Vorhandener Vite-Prozess 52467 erhalten;
nur der eigene lokale Caddy-Prüfcontainer wurde gestartet und wieder entfernt.

**Nicht ausgeführt:** vollständiges `npm run verify`, vollständige Suiten,
Firefox-/WebKit-Matrix, vollständige Deploymentmatrix, nativer Safari und native
Browserzoomprüfung. Keine externe Veröffentlichung, kein Commit/Push oder
V1-Release. Nächster konkreter Schritt: lokale Durchsicht der gelieferten
Oberfläche und Nachweise; im beauftragten Umfang bleibt kein bekannter Blocker.

### UI — Projektlink in der Diagnose vereinheitlicht (23. Oktober 2026)

**Status: implementiert und gezielt geprüft.** REQ-060/061, AT-057/058.
Verifizierte Basisrevision `faff2910f9fcadcbff6f9b4566b416fc9d7d918f` mit den
vorhandenen lokalen Änderungen; diese wurden erhalten. Verifizierter SHA-256
von `src/features/workspaces/Diagnostics.tsx`:
`6f48f0e2c4aab9a1868102d74d3363aba89aa488f713db7898a4f2b116c4de65`.

Die Diagnose zeigt wie die Datenseite „Projekt: Name“. Der aktuelle Projektname
verlinkt mit TanStack Link über die Projekt-ID zur Projektübersicht; bestehende
`project-context`- und Linkgestaltung werden verwendet.
`tests/deployment/diagnostics.spec.ts` prüft den neuen Text, das Linkziel nach
Reload und die tatsächliche Rücknavigation durch Anklicken. Die Datenseite
bleibt unverändert.

Tatsächlich ausgeführt mit Node 22.23.1 und npm 11.18.0:

- `npm run typecheck > /tmp/datenwerkstatt-project-link-typecheck.log 2>&1`:
  Exit **0**.
- `npx eslint src/features/workspaces/Diagnostics.tsx tests/deployment/diagnostics.spec.ts`:
  Exit **0**.
- `npm run test:deployment -- tests/deployment/diagnostics.spec.ts --project=chromium-0 --project=chromium-1 --reporter=list --output=/tmp/datenwerkstatt-project-link-deployment > /tmp/datenwerkstatt-project-link-deployment.log 2>&1`:
  Exit **0**, **2/2 bestanden**, echte statische Caddy-Deployments unter `/` und
  `/lab/`. Screenshots beider Profile visuell geprüft; Artefakte im angegebenen
  Ausgabeverzeichnis. Testcontainer wurden vom Testlauf wieder entfernt.
- `git diff --check`: Exit **0**.

Nicht ausgeführt: vollständiges `npm run verify`, vollständige Suiten sowie
Firefox-/WebKit-/Safari-Matrix. Kein bekannter Blocker für diese Korrektur.
Nächster konkreter Schritt: lokale Durchsicht der vereinheitlichten
Projektanzeige; der beauftragte Implementierungsumfang ist abgeschlossen.

### UI — Aktionsrückmeldungen appweit vereinheitlicht (23. Oktober 2026)

**Status: implementiert und gezielt geprüft.** REQ-064/067/068/076,
AT-051/055/057/059; UI-Abschnitt innerhalb P7. Basisrevision
`faff2910f9fcadcbff6f9b4566b416fc9d7d918f` mit vorhandenen lokalen Änderungen,
die erhalten wurden. Quellhashes, tatsächliche Befehle, Exitcodes, Logs und
Screenshots: [action-feedback/README.md](verification/action-feedback/README.md).

`src/ui/useActionFeedback.ts` koordiniert pro Ansicht Versuche, Status und
3-Sekunden-Timer. Nur der aktuelle gemountete Versuch veröffentlicht eine
Rückmeldung. Beginnen, manuelles Schliessen und Unmount invalidieren frühere
Antworten; identische neue Erfolge starten die Frist neu. `ActionStatus` und
optional schliessbare `Notice` in `src/ui/Controls.tsx` verwenden gemeinsame
Gestaltung in `src/styles/components.css`. Das × verwendet vorhandenes Icon,
Tooltip, mindestens 40 × 40 px und Fokusrückgabe mit stabilen Fallbacks.

Kurze ungefärbte Erfolge: Einstellungen, Archivexport ohne Auslassungen,
Dateibereinigung, erfolgreicher Diagnose-Prüfabschluss. Blaue Exportrückmeldung
mit Auslassungen und Bereinigung mit Teilfehlern bleiben bis zum Schliessen
sichtbar. Teilfehler erhalten Zusammenfassung und originale Fehlerdetails.
Datei-/Portalimport-, Parameter- und R-Transfer-Aktionsfehler sind ebenfalls
schliessbar; Eingaben, Vorschauinvalidierung und Validierung bleiben wirksam.
Schreibschutz, Speicherprobleme, Datenverfügbarkeit, laufende Vorgänge und
ausgewählte SQL-/R-Lauf-/Ergebnisdiagnosen bleiben sichtbar. Kein neuer Erfolg
für bisher stille Aktionen, keine Domain-/Engine-/Speicheränderung.

Angepasste Aufrufer: `src/app/router.tsx`, Archiv-/Daten-/Portalansichten,
SQL-Parameter, R-Transfer, `StorageSettings` und `Diagnostics`. Designsystem,
REQ-067 und AT-055 dokumentieren den vereinbarten Vertrag.

Tatsächlich geprüft mit Node 22.23.1 und npm 11.18.0:

- Typecheck, vollständiges Lint einschliesslich Modulgrenzen, 71 Unit-Tests und
  Produktionsbuild: jeweils Exit **0**. Abschliessendes gezieltes ESLint und
  Prettier sowie `git diff --check`: Exit **0**.
- Erster Chromium-Lauf: Exit **1**, **39/40 bestanden**. Der neue Layoutfall
  fand eine echte CSS-Kollision; sie ist korrigiert und derselbe Fall besteht
  anschliessend in Chromium, Firefox und WebKit.
- Neue Feedback-Matrix: Exit **1**, **28/30 bestanden**. Der Testweg über die
  Browserleiste unterschied sich in Firefox/WebKit. Nach Korrektur des
  Tastaturwegs innerhalb der Seite bestehen abschliessend **3/3** Fälle,
  Exit **0**, weiterhin mit Fokus-/Rahmen-/Enter-/Leertastenprüfung.
- Insgesamt **31 bestehende Chromium-Fälle** und **30 neue Browserfälle**
  einzeln erfolgreich nachgewiesen; kein grüner Gesamtlauf wird aus den
  fehlgeschlagenen Anfangsläufen abgeleitet. Echte Archiv-, Import-, SQL-/R-
  Regressionen und die neuen zehn UI-Fälle über die Dreiermatrix sind enthalten.

Screenshots visuell geprüft: Exporttext und Exportrückmeldung mit ×, mehrzeilige
Importfehler bei 390/1280/1440 px und 200 % Textgrösse. Das × bleibt rechts und
vertikal zentriert; kein horizontaler Seitenüberlauf. Vorhandener Vite-Prozess
erhalten. Keine Paket-/Lockfileänderung, keine Veröffentlichung, kein Commit.

**Nicht ausgeführt:** vollständiges `npm run verify`, vollständige Suiten,
vollständige Browser-/Deploymentmatrix, nativer Safari und native Zoomprüfung.
Kein V1-Releaseabschluss. Kein bekannter Blocker im beauftragten Umfang.
Nächster konkreter Schritt: lokale Durchsicht der vereinheitlichten Rückmeldungen
und der abgelegten Nachweise; die beauftragte Umsetzung ist abgeschlossen.

### CSV-Import — verständliche Optionen und Textbegrenzungszeichen (24. Oktober 2026)

**Implementiert und geprüft.** Beauftragter Umfang:
REQ-024–026/062/067, AT-008/010/055.
Ausgangsrevision `49fd41de41a4574832cf5e11f49bf189541bcaf5`, anfangs sauberer
Arbeitsbaum; Node 22.23.1 und npm 11.18.0. Der bisherige Vite-Prozess bleibt erhalten.

Die in `docs/BASELINE.md` genannte alte lokale Quelladresse existiert nicht mehr
(Prüfkommando Exit 128). Die Baseline wurde am tatsächlichen Pfad
`/Users/stefan/sources/datenportal/datenportal-sodata` mit `git show` am dokumentierten
Commit `6b45fc4e22116fba8fc00bd48175e347aa740562` gelesen (Paketvertrag und
Connector-Zusammensetzung, Exit 0). Der saubere Quellbaum steht inzwischen bei
`b14550c817fc741006b9afef78b4bfeb50e70ce8`; keine Übernahme neuerer Quelldateien,
kein Eingriff ins Portal. Installierte DuckDB-Typen enthalten `quote`/`escape` als
Stringoptionen. Keine Paket-/Lockfileänderung geplant.

Implementiert: `contracts/domain.ts`, beide Zod-Grenzen unter `src/domain`,
`fileImportEngine.ts`, `DataSection.tsx`, `DatasetHistory.tsx` und scoped `app.css`.
Basis-/erweiterte Optionen mit zugänglichen Beispielen, drei Textbegrenzungen,
sichtbaren Nichtdefaults, verständlicher Originaldateiablage und Herkunftsanzeige.
Alle Parseränderungen invalidieren die Vorschau; Textbegrenzung und andere
Parseränderungen verwerfen abgeleitete Spaltendefinitionen. Standardwerte und
Formatversion 1 bleiben erhalten. Neue Tests: `tests/unit/csv-import-options.test.ts`,
`tests/integration/csv-options.spec.ts`, `tests/e2e/csv-options.spec.ts`; bestehende
Feldselektoren in `required-fields.spec.ts` und `action-feedback.spec.ts` angepasst.

Gefundene und behobene echte Fehler: leere Strings dürfen bei der Typerkennung
nicht aus den Werten verschwinden (sonst unbrauchbarer numerischer Typvorschlag).
DuckDB weist `nullstr=[]` zurück; die kollisionsfreie Anpassung für ausgeschaltete
NULL-Umwandlung steht in [ADR-009](adr/009-csv-ohne-nullmarker.md). Bei 390 px und
200 % Text zwangen lange Hilfetexte/innere Raster zuvor einen horizontalen Überlauf;
scoped Umbruch und begrenzte Raster-/Spaltenkartenbreiten korrigieren dies.

Zwischenprüfungen: erster Chromium-Enginelauf Exit 0, 8/8 bestanden; erster
Chromium-UI-Lauf Exit 1, 3/5 bestanden (leere NULL-Liste und echter Überlauf).
Erster Gesamtcheck Exit 1: 76 Unit-/59 Integrationstests und 73/75 E2E bestanden.
Die zwei Fehler waren bereits in HEAD veraltete Erwartungen: das im Lesemodus
vollständig deaktivierte Aktionsmenü und «Schemaänderung:» statt des vorhandenen
Schemaabschnitts. Die korrigierten Tests prüfen weiterhin echten Export,
Schreibschutz und die konkrete neue Spalte samt Typ; keine Produktionsanpassung
zur Erfüllung dieser alten Erwartungen. Erste Firefox-/WebKit-Matrix Exit 1,
51/52 bestanden: nativer WebKit-Auswahltext verursachte bei 200 % Überlauf.
Eine ausschliesslich auf CSV-Auswahlfelder begrenzte CSS-Regel behebt ihn.

Abschliessende tatsächliche Checks:

| Befehl / Check | Exit | Ergebnis |
| --- | ---: | --- |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | **0** | TypeScript, Lint/Grenzen, **76 Unit**, Build, **59 Chromium-Integration**, **75 Chromium-E2E** |
| Gezielte Importmatrix (vollständiger Befehl im Prüfbericht) | **0** | **78/78** in Chromium/Firefox/WebKit, je 26, keine Skips/Retry-Flakys |
| `npm run build` nach abschliessender WebKit-CSS-Regel | **0** | Aktueller Produktionsbuild/Assets/Lizenzinventar |
| `npx tsc -p contracts/tsconfig.json` | **0** | Eigene Verträge |
| Prettier für geänderte App-/Testdateien und abschliessendes CSS; `git diff --check` | **0** | Format/Whitespace geprüft |

Breite Prettier-Prüfung mit Vertrag Exit 1; `contracts/domain.ts` ist auch in HEAD
nicht vollständig formatiert (Baselineprüfung ebenfalls Exit 1). Keine globale
Umformatierung des alten Vertrags. Vite meldet weiterhin bekannte grosse JS-Chunks.
Historische, durch bestehende Tests neu erzeugte Nachweise bytegleich wiederhergestellt;
aktuelle CSV-Screenshots/Logs separat abgelegt. Keine Paket-/Lockfileänderung.

[Prüfbericht, genaue Befehle und Einschränkungen](verification/csv-import-options/README.md),
[verifizierter Code-/Testfingerprint](verification/csv-import-options/candidate.json),
[Browser-/OS-Versionen](verification/csv-import-options/browser-versions.json).
Visuelle Endkontrolle der Basisansichten und schmalen 200-%-Ansichten durchgeführt.
Nicht ausgeführt: frisches `npm ci`, vollständige Firefox-/WebKit-Suiten ausserhalb
der gezielten Matrix, Deploymentmatrix, nativer Safari und nativer Browserzoom.
Kein bekannter Blocker im beauftragten CSV-Umfang; kein V1-Releaseabschluss.
Nächster konkreter Schritt: den fertigen Importdialog mit eigenen CSV-Dateien nutzen.

Commitvorbereitung: Alle 14 Code-/Testdateien stimmen weiterhin mit dem verifizierten
Fingerprint überein; `git diff --check` Exit 0. Kein erneuter Testlauf für unveränderten
Code. Zwischenzeitlich hinzugekommene, auftragsfremde Paket- und Exportänderungen
werden erhalten und nicht in den CSV-Commit aufgenommen. Für den Commit wurden
ausschliesslich nachgestellte Terminal-Leerzeichen in den neuen Logs entfernt;
Prüfergebnisse und Code bleiben unverändert.


### XLSX-Export für SQL und R (24. Oktober 2026)

**Status: implementiert und geprüft.** REQ-048 / AT-032, Erweiterung innerhalb
P3/P5/P7. Verifizierte Basisrevision
`472385c7866913462a1dbb6f8f194e7e3299cd47`; anfänglich vorhandene CSV-Änderungen
wurden unabhängig eingecheckt und erhalten. Finale Quellhashes, Toolchain und
Browserstände: [source-fingerprint.json](verification/xlsx/source-fingerprint.json).
Nachweis des vollständigen Verify-Kandidaten vor dem letzten Stringdetail separat
unter `verify-source-fingerprint.json`; keine uncommittete Änderung als Gitrevision
behauptet. Keine eigenen Commits, kein Push, Release oder Quellportal-Eingriff.

**Geliefert:** Beide bisherigen Exportmenüs enthalten XLSX bei unveränderter
CSV-Hauptaktion. SQL exportiert den vollständigen unveränderlichen Tabellenhandle
in Originalreihenfolge, auch nach Paging/Sortierung/Keep/Reopen; keine erneute
Codeausführung und keine interne Ordinalspalte. R nutzt seinen bestehenden
Scope-/Mutations-/Typ-/Bestätigungspfad und erzeugt keinen Datensatz oder
Capture-Lauf. ExcelJS 4.4.0 (MIT) läuft ausschliesslich im lazy Exportworker;
fflate 0.8.3 ist nur Testdependency. Keine Version vorhandener Engines geändert.

Numerische Spalten werden nur bei vollständig exakter Excel-Darstellbarkeit
mit höchstens 15 signifikanten Ziffern Zahlen; unsichere Spalten, DECIMAL und
Zeitwerte bleiben exakter Text. Tatsächliche Zeitzonenwerte werden UTC, naive
Zeitwerte erhalten keine erfundene Zone. Boolean bleibt Boolean. Führende Nullen,
Formelpräfixe, XML/Unicode/CR/C0, literale `_xHHHH_`-/`_XHHHH_`-Zeichenfolgen,
NULL/Leerstring und vollständig leere Zeilen sind separat nachgewiesen.
100000 Datenzeilen, 16384 Spalten, 32767 UTF-16-Einheiten je Zelle sowie gemeinsam
64 MiB für UTF-8-Exportpayload und Datei werden ohne Kürzung begrenzt;
verschachtelte Typen/BLOB sind explizit abzulehnen. Kein Peak-RAM-Versprechen.

Worker werden bei Erfolg, Fehler, Abbruch, Timeout und Sitzungsende tatsächlich
beendet. Das kombinierte Runtime-Lebenszeitsignal erreicht den Worker; der
Downloadpfad bricht auch wartendes Streamlesen ab und verwirft späte Antworten.
Bei hartem DuckDB-Reset werden temporäre Ergebnisse sichtbar invalidiert;
aufbewahrte Ergebnisse bleiben wiederherstellbar. Der Typhinweis steht vor dem
Download, bestehende Begrenzungs- und R-Umwandlungswarnungen bleiben erhalten.

**Relevante Dateien:** `src/application/tableExport.ts`, die SQL-/R-Exportports
und -Services, `src/infrastructure/xlsx/`, SQLRooms-Adapter/Runtime,
`src/app/download.ts` sowie SQL-/R-Exportmenüs. Neue Unit-, echte Integrations-,
UI- und statische Deploymenttests unter `tests/`; unabhängiger ZIP-/XML-Inspector
`tests/xlsx.ts`. SPEC/REQ-048, AT-032, Acceptanceindex/-matrix und Dependencies
sind nachgeführt. Reproduzierbarer Fehlernachweis und Alternativen:
[ADR-010](adr/010-xlsx-export-worker.md).

**Tatsächliche Checks** mit Node 22.23.1, npm 11.18.0, Playwright 1.63.0,
Chromium 153.0.8010.12, Firefox 155.0 und WebKit 26.6:

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| `node scripts/prove-native-xlsx.mjs` | Exit **0**, native v1.5.4-Fehlerreproduktion: 9995 statt 9999 Werte; keine produktive Freigabe der Extension |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | Abschliessender Gesamtlauf Exit **0**: Typecheck, Lint/Modulgrenzen, **92/92 Unit**, Build/Assets/Lizenzen, **67/67 Integration**, **77/77 UI** |
| Typecheck/Lint/Unit/Build nach letzter Stringdetailkorrektur | `npm run typecheck && npm run lint && npm run test:unit && npm run build`, Exit **0**, **92/92** Unit; Gesamtsuite nach diesem einen Detail nicht erneut behauptet |
| Gezielte XLSX-Dreiermatrix | Exit **0**, **30/30**: acht Integrations- und zwei UI-Szenarien pro Browser, einschliesslich echter Workerbeendigung/Engine-Hardreset/Recovery |
| Statisches `/lab/` | Final Exit **0**, **2/2** in echtem Caddy-Container, vollständige SQL-/R-Dateien, Reopen, unverändertes R-Projekt, lokale Worker/CSP |
| `git diff --check` und finale Quellhashprüfung | Exit **0**, 22 Programm-/Test-/Paket-/Skriptdateien unverändert zum final geprüften Detailstand |
| `npm audit --json` | Exit **1**, **11** vorhandene/transitive Befunde, keine Audit-0-Behauptung; Einordnung in DEPENDENCIES.md |

Exakte Befehle, Original- und als solche markierte transkribierte Logs,
Anfangsfehlschläge und erfolgreiche Wiederholungen:
[Prüfbericht](verification/xlsx/README.md). Erste UI-Läufe waren durch belegte
Vite-Navigationen unterbrochen. Der erste Verifylauf hatte 64/65 erfolgreiche
Integrationen und noch einen vorher geladenen alten TIMESTAMP-Sollwert; die
korrekte zonenlose Erwartung ist fachlich dokumentiert. Der erste Sessionclose-
Beobachter registrierte den bereits beendeten Worker zu spät; jetzt erfolgt
beobachteter Workerstart vor Schliessanforderung. Diese Fehlschläge werden nicht
als grüne Gesamtläufe ausgegeben und ihre Logs bleiben erhalten.

Visuell geprüft bei 1440×900 und 390×700, kein horizontaler Overflow;
Screenshots/Messwerte in `verification/xlsx/screens/`. Finaler separater
Workerchunk **1023288 Bytes**, gzip **280668 Bytes**, erst beim Export geladen.
Bekannte Chunkgrössenwarnung erhalten, Lizenzinventar einschliesslich ExcelJS
gebaut. Historische, von Tests neu erzeugte Screenshot-/Geometriedateien wurden
nach Sicherung der eigenen Ausgaben wiederhergestellt; keine Sollwerte geändert.

**Grenzen / nicht ausgeführt:** kein XLSX-Import, kein vollständiger SQL-Typ-
Rundlauf über Excel; exakte Textrepräsentationen sind Teil des sichtbaren Vertrags.
Keine vollständige Firefox-/WebKit-Abnahme aller Altfunktionen, kein neuer nativer
Safari-XLSX-Test oder Browserzoomtest und keine V1-Releaseabnahme. Der moderate
transitive UUID-Auditbefund aus ExcelJS betrifft nicht die genutzten Writer-
UUID-Funktionen; bestehende Toolchain-/Monaco-/Zod-Befunde sind separat sichtbar.
Kein bekannter Funktionsblocker im beauftragten XLSX-Umfang. Nächster konkreter
Schritt: lokale Nutzung über „Weitere Exportformate → XLSX exportieren“ in SQL
oder beim ausgewählten R-Dataframe; die beauftragte Implementierung ist geliefert.

## Ergänzung 24. Oktober 2026 — verständlicher Schreibschutz

**Geliefert / geprüft: REQ-020, REQ-076; AT-012, AT-065.** Ausgangsrevision
`472385c` mit den bereits vorhandenen separaten XLSX-Änderungen. Die
Funktionsprüfung erfolgte vor dem nachfolgenden Commit-/Push-Auftrag. Der tatsächlich geprüfte Arbeitsbaum ist durch 219 Quell-,
Konfigurations- und Testdatei-Hashes im [Prüfbericht](verification/write-access/README.md)
bezeichnet; keine uncommittete Änderung wird als Gitrevision ausgegeben.

Der eigene Schreibzugriffshinweis nennt belegtes Recht oder fehlende Web Locks.
Eine erneute Anforderung zeigt Busy, weiterhin belegt, dreisekündigen Erfolg
oder einen dauerhaften Fehler mit aufklappbaren Details. Ohne Web Locks fehlt
der wirkungslose Wiederholungsbutton. Statusansagen und Tastaturfokus sind
abgesichert; bewusst bewegter Fokus wird bei einer späten Übernahme erhalten.

Der Leasevertrag hat einen verpflichtenden Lesergrund. Die Übernahme ist ein
serialisierter, an Sitzungsidentität und Navigation gebundener Vorgang: ein
belegtes Recht erhält dieselbe Lesesitzung, ein neuer Writer lädt die aktuelle
Revision vor Veröffentlichung. Nicht veröffentlichte Leases werden bei Fehler
oder Abbruch freigegeben. Diagnose und lokaler Bericht enthalten Sperrgrund,
Browserunterstützung sowie Ergebnis/Zeitpunkt der letzten Prüfung. Projekt- und
Archivformat sowie Dependencies bleiben für diese Änderung unverändert.

Die Arbeitsansicht bleibt bei der Übernahme bestehen. Ein nachgewiesener
StrictMode-Doppellesevorgang konnte geöffnete Analysen und Seitenleistenänderungen
überschreiben; die Initialisierung pro Ansichtscontroller ist jetzt einmalig.
Neue Controller laden weiterhin den gespeicherten Stand. Lange Projektnamen
bleiben auch bei 390 Pixeln und 200 % Text innerhalb des Inhalts.

**Relevante Dateien:** Lockvertrag in `contracts/ports.ts`, Browserlock und
`WorkspaceService`; `WorkspaceWriteAccess.tsx`, Router, Diagnose, Styles und
`state/workspaceView.ts`. 18 neue Unitfälle und acht neue UI-Fälle sowie
erweiterte bestehende Multitab-/Recovery-/Diagnosetests. SPEC, Abnahmen,
Acceptanceindex/-matrix und Implementierungsplan sind nachgeführt.

**Tatsächliche abschliessende Checks** mit Node 22.23.1, npm 11.18.0,
Playwright 1.63.0, Chromium 153.0.8010.12, Firefox 155.0 und WebKit 26.6:

| Prüfung | Ergebnis |
| --- | --- |
| `DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 npm run verify` | **Exit 0**: Typecheck, Lint/Modulgrenzen, **110/110 Unit**, Build/Assets/Lizenzen, **67/67 Integration**, **85/85 UI** |
| Gezielte Dreiermatrix, genauer Befehl im Prüfbericht | **Exit 0, 39/39**, je 13 Fälle pro Browser, keine Skips/Flakes; echtes Multitab, alleiniger Tab nach Reload, fehlende Locks, Fehler/Busy, SQL/R-Übernahme, neue Revision und Recovery |
| Abschliessender fokussierter Chromium-Reparaturlauf | **Exit 0, 11/11**; Fokus, erweiterte Seitenleiste, bewusste Fokusbewegung, Navigation und schmale/vergrösserte Ansicht |
| `git diff --check` / Quellhashvergleich | **Exit 0**, alle 219 erfassten Dateien unverändert zum abschliessend geprüften Stand |

Alle zwölf Screenshots bei 390/1280/1440 Pixeln und 200 % Text wurden visuell
geprüft; kein horizontaler Überlauf. Historische Prüfbilder/Messwerte sind nach
Sicherung der eigenen Ausgaben wiederhergestellt. Die ersten UI-Läufe fanden
Geometrie-, Fokus- und Initialisierungsfehler; eine erste parallele Matrix
verlor wegen verschachtelter Ausgabeordner Trace-Dateien. Diese Läufe werden
nicht als bestanden ausgegeben. Logs, Fehlerkontexte, Screenshots und erfolgreiche
Wiederholungen stehen im [Prüfbericht](verification/write-access/README.md).

**Grenzen / nicht ausgeführt:** Die ursprünglich gemeldete dauerhafte
Safari-Sperre ist nicht eindeutig reproduziert; keine Ursache behauptet.
Kein neuer vollständiger nativer Safari-/VoiceOver-Pilot, kein Browserzoomtest,
keine vollständige Firefox-/WebKit-Abnahme aller Altfunktionen und keine neue
V1-Releaseabnahme. Kein bekannter Blocker im beauftragten UX-Umfang. Nächster
konkreter Schritt: Schreibrecht im lesenden Tab erneut anfordern; bei weiter
belegtem Recht liefern die Diagnose und ihr Bericht nun den tatsächlichen Grund
und den letzten Prüfausgang. Keine erzwungene Übernahme oder Browserdatenlöschung.

Der nachfolgende Commit enthält nur die Schreibschutzänderung mit zugehörigen
Tests/Unterlagen. Der exportierte Indexstand bestand separat Typecheck und
94/94 Unit-Tests, jeweils Exit 0. XLSX-Änderungen und die lokale Build-Konfiguration
bleiben uncommittet im Arbeitsbaum erhalten.

## Einstellungen im Projektkontext (24. Oktober 2026)

**Geliefert und geprüft: REQ-059/060/064; AT-012/055/057/058.** Die
Unterroute `/projects/:workspaceId/settings` erhält Provider, Projektnavigation,
Writer-Lease, Editormodelle und Enginezustand. Eine gemeinsame Einstellungsseite
nennt den Projektkontext und die browserweite Gültigkeit. R-Aktivierung wartet
bei Rückkehr auf den freien Scheduler. Der globale Einstieg `/settings`,
persönliche Optionen und Speicher-/Archivverträge bleiben erhalten. Keine
zusätzlichen Dependencies.

Interne Navigation erhält einen ungesicherten Entwurf auch bei Speicherfehlern;
das tatsächliche Verlassen über Projekte bleibt bei erfolglosem Flush blockiert.
Der bestehende Schutztest wurde entsprechend erweitert. Ein neuer echter
OPFS-/Multitabfall prüft aktive und gespeicherte Dateien gegen eine tatsächlich
entfernte verwaiste Datei. Ein lokaler Seitenumbruch behebt den nachgewiesenen
Überlauf bei 390 px und ausgeklappter Navigation. Statische Routenfreigabe und
Direktaufruf/Reload sind ergänzt.

**Relevante Dateien:** `src/app/router.tsx`, `src/features/r/RWorkbench.tsx`,
`src/styles/app.css`, statische Deploymentfreigabe und deren Unitprüfung; neue
`tests/e2e/project-settings.spec.ts` und `tests/deployment/project-settings.spec.ts`,
bestehende Navigations-/Speicherfehler-/Assetregressionen. SPEC, Abnahmetests,
Designsystem und Implementierungsplan sind nachgeführt.

**Prüfstand:** Ausgangsrevision `d52281463aaf10281c31fee94c922f2339acc40a` plus
uncommittierter Arbeitsbaum, durch [222 Quell-/Konfigurations-/Testhashes](verification/project-settings/source-fingerprint.json)
identifiziert. Alle Hashes nach den Prüfungen erneut unverändert verifiziert.
Node 22.23.1, npm 11.18.0; Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6.

| Tatsächlich ausgeführte Prüfung | Ergebnis |
| --- | --- |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | **Exit 0**: Typecheck, Lint/Modulgrenzen, **110/110 Unit**, Build/Assets/Lizenzen, **67/67 Integration**, **90/90 UI** einschliesslich Golden Path |
| Neue Projekt-Einstellungsfälle in Chromium/Firefox/WebKit | **Exit 0, 15/15**: Sitzung/Worker, Resultate/R-Objekte/Plot, Modellidentität/Undo/Cursor, Editoroptionen, echte Langläufe/Abbruch/Folgeausführung, Multitab/Bereinigung, Tastatur und Layout |
| Statische Caddy-Container Root/PostMessage, `/lab/`/PostMessage und `/lab/`/auto in allen drei Browsern | **Exit 0, 18/18**: Direktaufruf/Reload, persönliche Optionen, Kontext/Navigation, ungültige IDs, 404-Grenzen, originale lokale Assets und Fallback |
| Abschliessender Typecheck und Lint | Je **Exit 0** |
| Gezielte Deployment-/View-Unitfälle | **Exit 0, 4/4** |
| Formatcheck der benannten Quellen/Tests und SPEC/Abnahmetests/Plan, `git diff --check`, finaler Quellhashvergleich | Je **Exit 0** |

[Prüfbericht mit vollständigen Befehlen, Logs, Zwischenfehlern und Bildern](verification/project-settings/README.md).
Erster Chromiumlauf **3/7, Exit 1**: Tastaturmodalität, Tabellenvergleich und
Warten auf veröffentlichten Lauf verbessert. Wiederholung **3/4, Exit 1** fand
den tatsächlichen schmalen Überlauf; nach CSS-Fix **2/2, Exit 0**. Erster
Dreierlauf **17/21, Exit 1**: Firefox-Testfokus und WebKits Runtime-Neustartbudget
nach echtem R-Abbruch korrigiert. Abschliessender Dreierlauf **15/15, Exit 0**;
die beiden bestehenden Navigations-/Speicherfehlerregressionen bestanden schon
im ersten Lauf in allen drei Browsern. Keine Tests deaktiviert, keine Goldenwerte
geändert. Die zwölf neuen Einstellungen-Screens visuell im Dreiervergleich
geprüft. Historische Belege nach Sicherung der neuen Ausgaben wiederhergestellt.

**Grenzen / nicht ausgeführt:** Kein neuer nativer Safari-/VoiceOver-Pilot, keine
vollständige Firefox-/WebKit-Abnahme aller Altfunktionen und keine neue
V1-Releaseabnahme. Bekannte Editorchunk-Warnung unverändert. Kein offener Blocker
im beauftragten Umfang; lokale Umsetzung abgeschlossen. Nächster konkreter
Nutzungsschritt: im geöffneten Projekt Einstellungen öffnen, eine Editoroption
ändern und über SQL/R weiterarbeiten. Kein Commit, Push oder Release.

## SQL-Aufräumen und explizite Versionen — geliefert (24. Oktober 2026)

REQ-011/013–016/019/034–036/038/041/043–045/062/066–068; AT-005/006/007/025–027/030–032/054/055/058/059 im geänderten SQL-Vertrag. Basisrevision `6c3b44d151079242b33f75db7534cd2f813ab4c0`, Änderungen uncommittiert; [Quell-/Test-/Fixturehashes](verification/sql-workbench/source-sha256.txt). Keine neue pauschale V1-Abnahme.

Geliefert: Übersicht-Umbenennen mit atomarem Dialogcommit; SQL-Name als Text; nichtmodales Tabellen-/Spaltenpanel und Parameterdialog; bewusst gespeicherte unveränderliche Code-/Parameterversionen mit Wiederherstellung und Monaco-Undo. Autosave/Cmd+S/Ausführen erzeugen keine Version. Aktuelles Ergebnis ersetzt ungeschützte SQL-Testläufe, geschützt bleiben sämtliche benötigten Herkunftsketten. Handlefreigabe nach Metadatencommit und vollständigem Leserabschluss, auch bei unmittelbar folgenden Ersetzungen. R-Historie unverändert; gesicherte Ergebnisse gezielt erreichbar. Zentrale Tertiary-Hoverkorrektur.

**Formatbruch:** ausschliesslich Projektformat 2, keine Migration und keine Altbestandsbereinigung. Nicht unterstützte Projekte blockieren weder Liste noch Restebereinigung; direkte Aufrufe/Archive werden abgelehnt. Datensatz-/Katalog-/Runtimeversionsverträge bleiben eigenständig. Neue Versionen werden bei Projektklon/Archiv korrekt remappt, bei Analyseduplikation nicht kopiert.

Relevante Dateien: Domainvertrag/Validator/Remapping/`sqlRetention.ts`/Unveränderlichkeit; `workspaceService.ts`, `analysisService.ts`, Archiv/Repository/Recovery; `SqlWorkbench.tsx`, `SqlVersions.tsx`, `NameDialog.tsx`, Übersicht, Monaco/UI-Hooks und CSS. SPEC, Abnahmen, Implementierungsplan, Designsystem und synthetische Format-2-Fixtures aktualisiert. Fachliche Goldenwerte und Dependencies unverändert.

**Tatsächliche Prüfungen:** Typecheck, Lint/Modulgrenzen und Produktionsbuild jeweils **Exit 0**. Sechs gezielte Unitdateien **51/51, Exit 0**; ergänzte SQL-Datei **10/10, Exit 0** (52 unterschiedliche Fälle). Neue echte DuckDB-/IndexedDB-Integration **3/3, Exit 0**, verstärkte Freigabeprüfung **1/1, Exit 0**. Neue SQL-/Hover-UI **3/3, Exit 0**, abschliessende SQL-Geometrie und mobile Sichtbarkeit **2/2, Exit 0**, Parameter-Typregeln **1/1, Exit 0**, gezielte bestehende Regressionen **10/10, Exit 0**. Insgesamt fünf unterschiedliche Integrations- und zwölf UI-Fälle, mit echtem Cancel/Workerende und SQL→R. Exakte Befehle, Zwischenfehler, Screenshots und Grenzen im [Prüfbericht](verification/sql-workbench/README.md).

Prüfauswahl auf geänderte Funktionen und ihre konkreten Speicher-/Runtimeabhängigkeiten begrenzt. **Nicht ausgeführt:** volle Verify-/Unit-/Integrations-/UI-Suiten, Browser-/Deploymentmatrix, nativer Safari-Pilot und Ressourcenbenchmark. Bestehende Chunkgrössenwarnung erhalten. Kein bekannter Blocker im beauftragten Umfang. Nutzeränderung an AGENTS.md erhalten; historische Prüfbilder unverändert. Nächster Schritt: neue SQL-Bedienung nutzen und weitere UX-Punkte aufnehmen.


## SQL-Ergebnisbereich, Completion und Speicherpunkt — geliefert (24. Oktober 2026)

REQ-019/034/041/044/046/048/062/066/067; AT-005/007/027/032/049/055/058. Basisrevision `6c3b44d151079242b33f75db7534cd2f813ab4c0`, uncommittierter Arbeitsbaum. Geliefert: kompakte Ergebnisaktionen/Fusszeile, kontextuelle Exportdialoge, Sodata-Tabellenrendering mit Sortierung, normale Analysenamen und fehlender aktive-Zeile-Rahmen; verstellbares Schema und sichtbarer Resultatsplitter, separat gespeicherte Breite. Modellgebundene Completion ohne neue Dependency/Engineabfrage. Konstanter Speicherpunkt ersetzt wechselnde Speicherbänder, mit zugänglichen Details und Fehlerwiederholung. Format 2 bleibt unverändert.

Relevante Dateien: `SqlWorkbench.tsx`, Monaco-Completion/Editor, `SaveStatus.tsx`/Router und gespeicherte Fehlerkanäle; Viewvertrag/Repository, Styles und gezielte Tests. SPEC, Abnahmen, Plan, Designsystem und Quellen-/MIT-Nachweis nachgeführt.

**Tatsächliche Checks:** Typecheck, Lint/Modulgrenzen und Build jeweils **Exit 0**; **6/6 Unitfälle**, **14 unterschiedliche Chromiumfälle**, jeweils **Exit 0**. Zwei Fälle nach relevanter Schriftkorrektur erneut bestanden; der Schemafall prüft zusätzlich Reset auf 25 % Breite/45 % Editorhöhe (Exit 0). Echte DuckDB-/Dateiexporte nach Paging, Schema-/Resultatresize inklusive Reload, Completion/Quoting/Undo ohne Run, Speicherfehler/Retry und unveränderte Geometrie sowie temporärer/lesender Modus geprüft. Zwischenfehler und genaue Befehle/Logs/Bilder im [Prüfbericht](verification/sql-results/README.md).

**Nicht ausgeführt:** vollständige Suiten/Verify, Browser-/Deploymentmatrix, nativer Safari-Pilot und Benchmarks. Auswahl auf geänderte UI-/Persistenzgrenzen begrenzt; keine neue pauschale V1-Abnahme. Bekannte Chunkgrössenwarnung bleibt; kein bekannter Blocker im beauftragten Umfang. AGENTS.md-Nutzeränderung und vorherige lokale Arbeit erhalten. Nächster Schritt: die aufgeräumte SQL-Ansicht verwenden und weitere UX-Punkte aufnehmen. Kein Commit oder Push.


## SQL-Dokumente statt Versionen — geliefert (25. Oktober 2026)

REQ-016/019/034/062/067/068; AT-005/007/054/055/058/059. Letzter geprüfter Stand: Basisrevision `71defb1` plus [Quell-/Test-/Fixturehashes](verification/sql-documents/source-sha256.txt), Änderungen uncommittiert. Speichern/Cmd+S und Autosave aktualisieren aktuellen Analysecode. Laden öffnet aktive SQL-Dokumente mit eigenen Texten/Parametern/Cursor/Undo, ohne Lauf. SQL-Dateien bis 1 MiB werden nach UTF-8-Prüfung als neue Analyse angelegt; Download erhält auch ungespeicherten Text. Fehler und verspätetes Lesen erzeugen keinen Eintrag. Lesemodus erlaubt Auswahl/Download.

Versionssammlung, UI, Services, Typen, Validator-/Unveränderlichkeits-/Remappingregeln entfernt; Projektformat **3** ohne Migration, ältere Formate 1/2 kontrolliert abgelehnt. ZIP-Hülle bleibt Version 1. Relevante Dateien: Domainvertrag/Workspacevalidator, WorkspaceService/Archiv/Remapping, `sqlDocument.ts`, `SqlDocuments.tsx`, `SqlWorkbench.tsx`; gezielte Tests, synthetische Fixtures und aktuelle Spezifikations-/Bedienunterlagen. Historische Nachweise bleiben erhalten.

**Tatsächliche Checks:** Typecheck, Lint/Modulgrenzen und Build jeweils **Exit 0**. **34/34 Unitfälle**, **acht unterschiedliche Chromiumfälle bestanden**, einschliesslich echter DuckDB/IndexedDB und Archiv mit aufbewahrten Ergebnissen. Nach berichtigt getesteter wortweiser Undo-Semantik gezielter Einzelfall **Exit 0**; verstärkte Dokument-/Dateifälle für Cursor, Autosave und Filter **2/2, Exit 0**. Zwischenfehler, genaue Befehle/Logs und Screenshots im [Prüfbericht](verification/sql-documents/README.md).

**Nicht ausgeführt:** vollständige Suiten/Verify, Browser-/Deploymentmatrix, nativer Safari-Pilot und Benchmarks. Nur geänderte Dokument-/Datei-/Formatpfade und direkte Abhängigkeiten geprüft; keine neue V1-Abnahme. Bestehende Chunkgrössenwarnung bleibt. Kein bekannter Blocker im beauftragten Umfang. Nächster Nutzungsschritt: SQL-Dokument über Laden öffnen oder über Weitere Aktionen eine SQL-Datei öffnen. Kein Commit oder Push.


## SQL-Dokumente: Neu und Öffnen — geliefert (25. Oktober 2026)

REQ-019/034/036/062/067/068; AT-005/007/054/055/058. Basisrevision `10683d7` plus
[Dateifingerabdruck](verification/sql-new-open/source-sha256.txt), Änderungen im Arbeitsbaum.
Neu verwendet den bestehenden Namensdialog mit Trim/Validierung, Abbrechen/Erstellen
und der vorhandenen atomaren Analyseerstellung. Es öffnet ein unabhängiges Dokument
mit SQL-Starttext und leeren Parametern/Inputs; die vorige Analyse bleibt erhalten.
Öffnen ersetzt Laden, markiert das aktuelle Dokument und erklärt den Zustand ohne
weitere SQL-Dokumente. Die Neu-Aktion ist auch im Öffnen-Dialog erreichbar. Neu und
Speichern bleiben im Lesemodus deaktiviert; Auswahl/Download bleiben möglich.
Die Ergebnismeldung zum geänderten Arbeitsstand wurde ohne Ersatz entfernt;
Ergebnis und eingefrorener Code bleiben bis zur nächsten Ausführung erhalten.
Keine Format-, Domain-/Speicherschnittstellen- oder Dependencyänderung.

Relevante Dateien: `src/features/sql/SqlWorkbench.tsx`, `SqlDocuments.tsx` und die
drei betroffenen E2E-Dateien; SPEC, Abnahmen, Implementierungsplan und Designsystem
nachgeführt. Historische Nachweise bleiben erhalten.

**Tatsächliche Checks:** `npm run typecheck`, `npm run lint` einschliesslich
Modulgrenzen und `npm run build` jeweils **Exit 0**; gezielter Chromium-Aufruf
**5/5 Fälle, Exit 0**. Neu/Abbrechen/Escape/Validierung, unabhängige Editorzustände,
Speichern/Autosave/Reload, Ergebnisstabilität ohne Hinweis, vorhandene
Kürzungs-/Exportdialoge und echter Multitab-Lesemodus geprüft. Dialoge und
Werkzeugleiste visuell geprüft. Genaue Befehle, Ergebnisse und Screenshots im
[Prüfbericht](verification/sql-new-open/README.md).

**Nicht ausgeführt:** Unit- oder vollständige Testsuiten/Verify,
Browser-/Deploymentmatrix, nativer Safari-Pilot und Benchmarks. Auswahl auf die
geänderten UI-Pfade und direkten Abhängigkeiten begrenzt. Bekannte
Chunkgrössenwarnung bleibt; kein bekannter Blocker im beauftragten Umfang.
Nächster Nutzungsschritt: mit Neu eine benannte SQL-Analyse erstellen und über
Öffnen zwischen Dokumenten wechseln. Kein Commit oder Push für diese Änderung.

## Parameter: stabile Felder und Validierung beim Typwechsel (25. Oktober 2026)

**Status: implementiert und gezielt geprüft.** REQ-035/067, Parameter-UI und
AT-055. Verifizierter Stand: Basisrevision
`e3e5e8c1306eb6d09779ac6a16f39c386e377dfc` plus uncommittierte Änderungen;
[Dateifingerabdrücke](verification/parameter-fields/source-sha256.txt).
Der Arbeitsbaum war vor dieser Korrektur sauber.

Der gemeinsame SQL-/R-Parametereditor setzt beim Typwechsel ausschliesslich
Fehler, Bearbeitungsstatus und ausstehende Blur-Validierung des betroffenen
Wertfelds zurück. Fehler anderer Felder und sämtliche eingegebenen Werte bleiben
erhalten. Ohne neue Werteingabe erzeugt blosses Fokussieren/Verlassen keinen
erneuten Fehler; nach Bearbeitung und Blur oder bei „Parameter übernehmen“ wird
gegen den aktuellen Typ geprüft. Ein leerer Decimal-Wert bleibt ungültig;
String-Leerwert, NULL und exakte Decimal-Textwerte behalten ihre Verträge.

Parameterzellen sind oben ausgerichtet. Eingaben, Typauswahl und Entfernen haben
dieselbe, mit der Textgrösse wachsende Höhe. Nur der SQL-Parameterdialog verwendet
einen festen oberen Abstand von 24 px, bei schmalem Viewport 16 px; neue Fehler
verschieben ihn nicht durch vertikale Neuzentrierung. Die Tabelle behält feste
Spalten und eine Mindestbreite; bei schmaler Ansicht oder grosser Schrift wird
innerhalb der Tabelle horizontal gescrollt. Viele Zeilen bleiben im Dialog
vertikal erreichbar.

Implementierte Dateien: `src/ui/useFormValidation.ts`,
`src/features/sql/SqlWorkbench.tsx`, `src/styles/app.css`.
Regressionen: `tests/unit/form-validation.test.ts` und
`tests/e2e/parameters.spec.ts`.

**Tatsächlich ausgeführte Checks** mit Node 22.23.1, npm 11.18.0,
Playwright 1.63.0 und Chromium 153.0.8010.12:

- `npx vitest run tests/unit/form-validation.test.ts tests/unit/field-validation.test.ts`:
  **9/9, Exit 0**. Nach Verstärkung der Prüfung zum erhaltenen Bearbeitungsstatus
  `npx vitest run tests/unit/form-validation.test.ts`: **4/4, Exit 0**.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts`:
  erster Lauf **4/5, Exit 1**. Die Messung bei 200 % Textgrösse fand 4 px Versatz
  sowie zu knappe Feldhöhen; CSS korrigiert, keine Testtoleranz erhöht.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts -g 'Parameters geometry'`:
  nach der Höhen-/Ausrichtungskorrektur **3/3, Exit 0**.
- Abschliessend nach stabilen Spalten, Mindestbreite und ergänztem Scrollnachweis:
  `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts tests/e2e/required-fields.spec.ts tests/e2e/optional-labels.spec.ts tests/e2e/action-feedback.spec.ts -g 'Parameters|parameter values are required|conditional parameter values|dismissing a parameter-apply error'`:
  **8/8, Exit 0**. SQL/R-Typwechsel, isoliertes Fehlerrücksetzen, erneute
  Validierung, exakte Übernahme und bestehende Pflicht-/Optional-/Aktionsfehlerfälle
  geprüft. Geometrie bei 1440×900, 390×900 und 1280×900 mit 200 % CSS-Textgrösse:
  Feldoberkanten unverändert (Toleranz 1 px), Kontrollen gleich hoch/ausgerichtet,
  mehrzeilige Fehler unter dem Feld, kein horizontaler Seitenüberlauf; zehn
  Parameter bei grosser Schrift weiterhin scrollbar erreichbar.
- `npm run typecheck`, `npm run lint` einschliesslich Modulgrenzen: jeweils
  **Exit 0**, nach den finalen Code-/Teständerungen erneut ausgeführt.
- `npx prettier --check src/ui/useFormValidation.ts src/features/sql/SqlWorkbench.tsx src/styles/app.css tests/unit/form-validation.test.ts tests/e2e/parameters.spec.ts`
  und `git diff --check`: jeweils **Exit 0**.

Screenshots visuell geprüft:
[Desktop](verification/parameter-fields/desktop-decimal.png),
[390 px](verification/parameter-fields/narrow-decimal.png),
[200 % Text](verification/parameter-fields/large-text-decimal.png).
Der bereits laufende Vite-Prozess im Zielrepository wurde weiterverwendet.

**Nicht ausgeführt:** vollständige Suiten, `npm run verify`, Produktionsbuild,
Browser-/Deploymentmatrix und nativer Safari-/Browserzoomtest. Die Auswahl deckt
die geänderten Formularzustände, verzögerte Validierung und gemeinsame
SQL-/R-Darstellung ab; keine Engine-/Speicher-/Dependencyänderung und keine neue
V1-Gesamtabnahme. Kein bekannter Blocker. Nächster konkreter Schritt: lokale
Durchsicht der Parameterdialoge; die beauftragte Korrektur ist abgeschlossen.
Kein Commit oder Push.

## Parameter: native Select-Darstellung und Weissraum (25. Oktober 2026)

**Status: implementiert und gezielt geprüft.** REQ-067 / AT-055.
Verifizierter Stand: Basisrevision `e3e5e8c1306eb6d09779ac6a16f39c386e377dfc`
plus erhaltene vorherige Änderungen und diese Ergänzung;
[Dateifingerabdrücke](verification/parameter-spacing/source-sha256.txt).

Der Parametereditor verwendet die native Select-Darstellung ohne eigene
Höhenvorgabe; der direkte Browservergleich mit der tatsächlichen
Editor-Schriftgrössenauswahl in den Einstellungen bestätigt dieselbe Höhe,
Appearance, Schrift, Innenabstände und Rundung. Ein eigener Container zentriert
die Typauswahl zur Eingabehöhe, unabhängig von darunterstehenden Fehlern.
Zellpadding schafft 16 px zwischen den Kontrollen; der Scrollcontainer erhält
8 px Innenabstand sowie Scrollabstände. Lokales `scrollIntoView` bei Fokus
berücksichtigt diesen Rand auch bei automatischem horizontalem Scrollen.
Die gleichen Regeln gelten für SQL und R. Gemeinsame Select-Komponente,
Einstellungen, Parameterwerte und Typwechselvalidierung wurden nicht geändert.
Die vorherige Forderung gleicher Höhen gilt nun für Eingaben/Entfernen; die
native Typauswahl ist wie vom Nutzer gewählt mittig und darf niedriger sein.

Relevante Dateien: `src/features/sql/SqlWorkbench.tsx`, `src/styles/app.css` und
`tests/e2e/parameters.spec.ts`. Vorherige uncommittierte Arbeit und historische
Nachweise bleiben erhalten. Diese Ergänzung ersetzt die frühere Aussage zur
erzwungenen Select-Höhe im Abschnitt oben, nicht dessen historische Prüfergebnisse.

**Tatsächlich ausgeführte Checks:**

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts`:
  erster Lauf **5/6, Exit 1**. Der neue Tastaturtest belegte bei 390 px, dass
  natives Fokusscrollen den äusseren Ring trotz CSS-Abständen abschneidet.
  Lokales Fokusscrollen ergänzt; Prüftoleranz nicht erhöht.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts -g 'native select and focus'`:
  **1/1, Exit 0**, nach dieser Korrektur.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/parameters.spec.ts -g 'type changes|Parameters geometry' --output=test-results/parameter-spacing-chromium`:
  **5/5, Exit 0**. Zusammen sechs unterschiedliche Chromiumfälle am finalen Stand.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=webkit tests/e2e/parameters.spec.ts -g 'native select and focus' --output=test-results/parameter-spacing-webkit`:
  **1/1, Exit 0**. Ein gezielter WebKit-Fall, keine vollständige Browsermatrix.
- `npm run typecheck`, `npm run lint` einschliesslich Modulgrenzen und
  `npx prettier --check src/features/sql/SqlWorkbench.tsx src/styles/app.css tests/e2e/parameters.spec.ts`:
  jeweils **Exit 0**, nach finaler Codeänderung. `git diff --check`: **Exit 0**.

Geprüft bei 1440×900, 390×900 und 1280×900 mit 200 % CSS-Textgrösse: mindestens
16 px Abstand, native Typauswahl wie Einstellungen, stabile Eingabepositionen
mit mehrzeiligen Fehlern, zwei Parameterzeilen vollständig per Tastatur
erreichbar. Für jede Eingabe, Typauswahl und Entfernen-Aktion vor und nach
Validierung wurde der 5 px auskragende sichtbare Fokusring gegen Viewport und
alle beschneidenden Vorfahren gemessen, auch nach horizontalem Scrollen.
SQL-/R-Typwechsel und exakte Übernahme bleiben geprüft. Laufzeit: Node 22.23.1,
npm 11.18.0, Playwright 1.63.0, Chromium 153.0.8010.12, WebKit 26.6.

Visuell geprüft:
[native Auswahl Desktop](verification/parameter-spacing/webkit-desktop-clean-focus.png),
[schmal mit Fehlern](verification/parameter-spacing/webkit-narrow-errors-focus.png),
[200 % Text](verification/parameter-spacing/webkit-large-text-errors-focus.png),
[Chromium mit Decimal-Fehler](verification/parameter-spacing/chromium-desktop-decimal.png).

**Nicht ausgeführt:** Unit-Tests (keine Validierungslogik geändert), vollständige
Suiten/Verify, Produktionsbuild, Browser-/Deploymentmatrix und nativer Safari-
oder Browserzoomtest. Gezielte Auswahl auf Markup, native Darstellung,
Fokus-/Scrollgrenzen und bestehende Parameterregressionen beschränkt. Kein
bekannter Blocker. Nächster konkreter Schritt: lokale Durchsicht des gelockerten
Parametereditors; der beauftragte Umfang ist abgeschlossen. Kein Commit/Push.

## UI — Spalt am fixierten SQL-Tabellenkopf (25. Oktober 2026)

**Historischer erster Versuch, ersetzt durch „Collapse-Rahmen ohne doppelte
Kanten“ unten.** REQ-046/062, Regression zu AT-027/054/058.
Verifizierte Basisrevision `c2ff93cfcc1b4fb67d7debfba73dd6118da6612c` mit den
hier beschriebenen uncommittierten Änderungen. In `src/styles/app.css` verwendet
ausschliesslich die SQL-Ergebnistabelle separate Zellrahmen ohne Abstand.
Einseitige rechte/untere Rahmen sowie linke und obere Aussenkanten erhalten
1-px-Linien. Deckende Flächen und bestehende Sticky-Ebenen bleiben erhalten.
Keine Änderungen an Daten, Schnittstellen oder Dependencies.

`tests/e2e/sql-workbench.spec.ts` erweitert den vorhandenen SQL-Tabellenfall um
eine breite echte DuckDB-Ausgabe, drei kombinierte Scrollpositionen bei jeweils
1440×900 und 1280×800, bündige fixierte Eckzelle/Zeilennummern sowie einen
Bildvergleich der oberen acht Kopfzeilenpixel mit sichtbaren und ausgeblendeten
Datenzeilen. Die Scrollpositionen berücksichtigen die tatsächliche Kopfhöhe,
damit Daten unter der oberen Kante liegen. Scrollen verändert das Dokument
nicht; bestehende Prüfungen für Paging und numerische Sortierung ohne neuen
Lauf bleiben erhalten. Die kleine Testauswahl deckt damit den CSS-Fehler und
die direkt betroffenen Tabellenfunktionen ab.

**Tatsächliche Checks** (Node 22.23.1, npm 11.18.0, Chromium 153.0.8010.12):

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --output=test-results/sticky-header-final --reporter=list`:
  **1/1, Exit 0** am finalen Stand; echte DuckDB, sechs Scrollpositionen,
  Pixelvergleich, Paging und Sortierung bestanden.
- Derselbe gezielte Test wurde während der Vorbereitung mit
  `--output=test-results/sticky-header-before`, `sticky-header-before-pixels`
  und `sticky-header-before-wide` jeweils **Exit 1** ausgeführt: bestehender
  0,5-px-Versatz der Eckzelle. Mit `sticky-header-before-scrolled` **Exit 1**:
  Testdaten erzeugten zunächst keinen horizontalen Überlauf; durch zusätzliche
  synthetische Spalten korrigiert. Mit `sticky-header-after` nach CSS-Korrektur
  **1/1, Exit 0**; danach Scrolltiefe an die Kopfhöhe gebunden und mit dem oben
  genannten finalen Lauf erneut geprüft.
- `npx prettier --check src/styles/app.css tests/e2e/sql-workbench.spec.ts`,
  `npx eslint tests/e2e/sql-workbench.spec.ts` und `git diff --check`:
  jeweils **Exit 0** am finalen Code-/Teststand.

Visuell geprüfte Screenshots:
[1440×900, gescrollt](verification/sticky-header/scroll-1440.png),
[1280×800, gescrollt](verification/sticky-header/scroll-1280.png).
Diese Ausschnitte zeigten geschlossene Sticky-Kanten. Sie enthielten jedoch
nicht die angrenzende Sidebar und Aktionsleiste; deren Linien wurden zusammen
mit den zusätzlichen Tabellenrahmen doppelt gezeichnet. Die frühere Aussage
„ohne doppelte Rahmen“ ist deshalb korrigiert; dieser Lieferstand ist ersetzt.

**Nicht ausgeführt:** Typecheck, Produktionsbuild, Unit-Tests, vollständige
Suiten/Verify, weitere Browser oder Deploymenttests. Der Auftrag ist auf diese
CSS-Korrektur und den gezielten Chromium-Nachweis begrenzt. Kein bekannter
Blocker; keine weitere Implementierungsphase in diesem Auftrag. Kein Commit/Push.

## UI — Collapse-Rahmen ohne doppelte Kanten (25. Oktober 2026)

**Geliefert und gezielt geprüft: REQ-046/062, Regression zu AT-027/054/058.**
Verifizierte Basisrevision `c2ff93cfcc1b4fb67d7debfba73dd6118da6612c` mit den
hier beschriebenen uncommittierten Änderungen. Dieser Stand ersetzt den
vorherigen Versuch mit separaten Tabellenrahmen.

`src/styles/app.css`: Die SQL-Tabelle verwendet wieder das gemeinsame
`border-collapse: collapse`. Eigene obere/linke Tabellenrahmen entfallen;
Aktionsleiste und Sidebar zeichnen diese Kanten bereits. Untere Kopf- und
rechte Zeilennummernrahmen werden mit `border-style: hidden` unterdrückt und
durch innenliegende 1-px-Linien ersetzt. Die Eckzelle kombiniert beide Linien.
Deckende Hintergründe, Sticky-Positionen und Ebenen bleiben erhalten. Keine
Änderungen an Schnittstellen, Daten, Engines oder Dependencies.

`tests/e2e/sql-workbench.spec.ts`: Der vorhandene echte DuckDB-Tabellenfall prüft
bei 1440×900 und 1280×800 jeweils den Ruhezustand und drei kombinierte
Scrollpositionen. PNG-Pixel werden über Browser-Canvas ohne neue Dependency
ausgelesen: je ein 1-px-Querschnitt an der gemeinsamen oberen und linken
Aussenkante muss genau ein Pixel der Rahmenfarbe enthalten. Die Screenshots
für diese Messung werden in CSS-Pixeln erzeugt. Bildvergleiche mit ausgeblendeten
überdeckten Zellen prüfen die obere und linke Sticky-Kante einschliesslich der
Eckzelle. Dazu unveränderte Dokumente nach Scrollen, `collapse` als berechneter
Stil sowie bestehendes Paging und numerische Sortierung ohne neuen SQL-Lauf.

**Tatsächliche Checks:**

- Vor der CSS-Korrektur:
  `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --output=test-results/collapsed-edges-before --reporter=list`:
  **Exit 1**, erwarteter Regressionsnachweis: **2 statt 1** Rahmenpixel an der
  oberen gemeinsamen Kante. [Screenshot vor der Korrektur](verification/collapsed-edges/before.png).
- Am finalen Code-/Teststand:
  `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --output=test-results/collapsed-edges-final --reporter=list`:
  **1/1, Exit 0**, 8 Ruhe-/Scrollzustände mit insgesamt 16 Messungen der
  Rahmenbreite und 16 Bildvergleichen für deckende Sticky-Kanten. Echte DuckDB,
  Paging und Sortierung bestanden.
- `npx prettier --check src/styles/app.css tests/e2e/sql-workbench.spec.ts`,
  `npx eslint tests/e2e/sql-workbench.spec.ts` und `git diff --check`:
  jeweils **Exit 0** am finalen Stand.

Vollständige Screenshots einschliesslich Sidebar und Aktionsleiste visuell
geprüft: [1440 Ruhe](verification/collapsed-edges/rest-1440.png),
[1440 gescrollt](verification/collapsed-edges/scroll-1440.png),
[1280 Ruhe](verification/collapsed-edges/rest-1280.png),
[1280 gescrollt](verification/collapsed-edges/scroll-1280.png).
Obere und linke Aussenkante sind einfach gezeichnet; kein durchscheinender
Datentext an den fixierten Kanten. Laufzeit: Node 22.23.1, npm 11.18.0,
Playwright 1.63.0, Chromium 153.0.8010.12.

**Nicht ausgeführt:** Typecheck, Produktionsbuild, Unit-Tests, vollständige
Suiten/Verify, weitere Browser und Deploymenttests. Die gezielte Auswahl
deckt die geänderten CSS-Kanten und unmittelbar betroffene Tabellenfunktionen
ab. Kein bekannter Blocker; der beauftragte Korrekturabschnitt ist abgeschlossen.
Keine weitere Implementierungsphase in diesem Auftrag. Kein Commit/Push.


## UI — Tertiäre Buttons auf grauen Flächen (25. Oktober 2026)

**Geliefert und gezielt geprüft: REQ-065/067, Regression zu AT-054/055/058.**
Verifizierte Basisrevision `c2ff93cfcc1b4fb67d7debfba73dd6118da6612c` mit den
hier beschriebenen uncommittierten Änderungen. Die vorher vorhandenen
Tabellen-/Sticky-Kantenänderungen bleiben erhalten.

`src/styles/tokens.css` definiert `--dw-tertiary-hover: #d9dfe5` und
`--dw-tertiary-pressed: #cdd5dd`. `src/styles/components.css` verwendet beide
Rollen zentral für normale tertiäre Buttons einschliesslich Iconbuttons.
Danger, Auswahl, Disabled und Fokus behalten ihre eigenen Regeln.
`docs/DESIGN_SYSTEM.md` und `docs/DESIGN_SYSTEM_NEUTRAL_v1.4.md` führen
Tokenliste, CSS-Referenz und Zustandstabelle nach. Keine API- oder
Dependencyänderung.

`tests/e2e/design-system.spec.ts` prüft die neuen Farben, unveränderte
Geometrie und bestehende Sonderzustände. Die vorhandene allgemeine
Komponentenprüfung vergleicht weiterhin alle drei Buttonvarianten in beiden
Bedeutungen einschliesslich Hover/Pressed. Der Menüauslöser benötigt jetzt
einen exakten Namen; der zusätzliche Iconfall wird vor der Positionsmessung
ins Bild gescrollt.

**Tatsächliche Checks:**

- Erster `npx prettier --check src/styles/tokens.css src/styles/components.css tests/e2e/design-system.spec.ts`:
  **Exit 1**, Formatierung des erweiterten Tests korrigiert.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/design-system.spec.ts -g 'UI components:|UI tertiary hover:' --output=test-results/tertiary-hover --reporter=list`:
  **Exit 1**, zwei Locator-/Scrollprobleme; kein Farbfehler. Exakte Menüauswahl
  und Scrollen vor Geometriemessung korrigiert, keine Assertions entfernt.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/design-system.spec.ts -g 'UI components:|UI tertiary hover:' --output=test-results/tertiary-hover-final --reporter=list`:
  **2/2 bestanden, Exit 0**.
- Einmaliger `node --input-type=module`-Smoke mit Playwright per Heredoc:
  **Exit 0**, frisches persistentes Chromium-Profil; echte DuckDB-Abfrage mit
  350 Zeilen, Aufbewahren und Anzeigen des gespeicherten Resultats.
  „Zum aktuellen Ergebnis“ hat in der grauen SQL-Ergebnisleiste bei Hover
  `rgb(217, 223, 229)` und beim Drücken `rgb(205, 213, 221)`.
  Ergebnis: [SQL-Nachweis](verification/tertiary-hover/sql-proof.json).
- `npx prettier --check src/styles/tokens.css src/styles/components.css tests/e2e/design-system.spec.ts`,
  `npx eslint tests/e2e/design-system.spec.ts` und `git diff --check`:
  jeweils **Exit 0** am finalen Code-/Teststand.

Screenshots visuell geprüft: [weisser Hintergrund](verification/tertiary-hover/tertiary-white-hover.png),
[graue Toolbar](verification/tertiary-hover/tertiary-toolbar-hover.png),
[Toolbar gedrückt](verification/tertiary-hover/tertiary-toolbar-pressed.png),
[Iconbutton](verification/tertiary-hover/tertiary-icon-hover.png),
[SQL Hover](verification/tertiary-hover/sql-hover.png) und
[SQL gedrückt](verification/tertiary-hover/sql-pressed.png).
Hover hebt sich von der Toolbar ab; Pressed ist dunkler. Chromium
153.0.8010.12, SQL-Ansicht 1440×900; Komponentenansicht 1280×720.

**Nicht ausgeführt:** Typecheck, Produktionsbuild, Unit-Tests, vollständige
Suiten/Verify, weitere Browser und Deploymenttests. Die gezielte Auswahl deckt
die geänderten Buttonfarben und unmittelbar betroffene Zustände ab.
Kein bekannter Blocker; der Korrekturabschnitt ist abgeschlossen, keine
weitere Implementierungsphase in diesem Auftrag. Kein Commit/Push.

## UI — SQL-Fusszeile ohne Trennpunkt (25. Oktober 2026)

**Bestanden: REQ-062, gezielte Regression zu AT-055.**
`src/features/sql/SqlWorkbench.tsx` zeigt Zeilenzahl und Laufzeit mit einem
Leerzeichen, beispielsweise `43 Zeilen 253 ms`. Die bestehende Textprüfung in
`tests/e2e/sql-workbench.spec.ts` folgt der angeforderten Darstellung.
Verifizierte Basisrevision: `c2ff93c` mit vorhandenen und diesen uncommittierten
Änderungen; bestehende Nutzeränderungen erhalten.

**Tatsächliche Checks:**

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --reporter=list`:
  **1/1 bestanden, Exit 0**. Der vorhandene Chromium-Test prüft die Fusszeile
  mit echtem DuckDB-Ergebnis sowie die unmittelbar betroffene Tabellenansicht.
- Erneuter lokaler Baselineabruf über `git -C /Users/stefan/sources/datenportal-sodata show 6b45fc4e22116fba8fc00bd48175e347aa740562:src/main/frontend/explore/package.json`:
  **Exit 128**, dokumentierter Quellpfad nicht vorhanden; bestehender Prüfstand
  in `docs/BASELINE.md` gelesen. Keine Herauslösung oder Versionsänderung.

**Nicht ausgeführt:** Typecheck, Build, Unit-Tests, vollständige Suiten/Verify,
weitere Browser und Deploymenttests. Die einzelne Textänderung ist durch den
bestehenden gezielten Browserfall abgedeckt. Kein Funktionsblocker, keine weitere
Phase in diesem Auftrag; kein Commit/Push.

## UI — SQL-Ergebnisangaben wie Sodata (25. Oktober 2026)

**Bestanden: REQ-062/067, gezielte Regression zu AT-055.**
Nachfolgekorrektur zur Entfernung des Trennpunkts: `SqlWorkbench.tsx` rendert
Zeilenzahl und optionale Laufzeit als getrennte Spans in einer gemeinsamen
Live-Region. `src/styles/app.css` übernimmt Flex-Wrapping, `0.6rem` Abstand,
12-px-Monospace und Schriftgewicht 400 aus Sodata; Schrift und dezente Farbe
verwenden die vorhandenen Werkstatt-Tokens. Zeilenzahlen werden mit `de-CH`
ohne Number-Präzisionsverlust formatiert. Laufzeiten entsprechen Sodata:
gerundete Millisekunden (mindestens 1 ms), ab 1000 ms Sekunden mit einer
Nachkommastelle. Vorlage gelesen aus
`/Users/stefan/sources/datenportal/datenportal-sodata`, Revision `9466ade`,
`src/main/frontend/explore/src/results/ResultPanel.tsx` und
`src/main/frontend/explore/src/styles/explore.css`.

Verifizierte Ziel-Basisrevision: `b3620461524cc048aa7b24552e8cc9c19f423ab5`
mit vorhandenen und diesen uncommittierten Änderungen. Keine Änderungen im
Quellportal, keine neue Dependency. `tests/e2e/sql-workbench.spec.ts` prüft
getrennte Angaben, Zeitformat, Abstand, Wrapping, Schrift und Farbe im
bestehenden echten DuckDB-Tabellenfall.

**Tatsächliche Checks:**

- `npm run typecheck`: **Exit 0**.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --reporter=list`:
  **1/1 bestanden, Exit 0**. Screenshot `sql-table-rest-1440.png` im zugehörigen
  `test-results`-Verzeichnis visuell geprüft: beide Angaben getrennt lesbar.
- `npx prettier --check src/features/sql/SqlWorkbench.tsx src/styles/app.css tests/e2e/sql-workbench.spec.ts`:
  zunächst **Exit 1** (Testformatierung), nach Formatkorrektur **Exit 0**.

**Nicht ausgeführt:** Build, Lint, Unit-Tests, vollständige Suiten/Verify,
weitere Browser und Deploymenttests. Die gezielte Auswahl deckt die geänderte
Ergebnisdarstellung und angrenzende Tabellenfunktionen ab. Kein bekannter
Blocker; beauftragter Abschnitt abgeschlossen, keine weitere Phase in diesem
Auftrag. Kein Commit/Push.

## UI — Einheitliche SQL-Divider mit 6 px (25. Oktober 2026)

**Geliefert und gezielt geprüft: REQ-062/066/067, Regression zu AT-054/055/058.**
Verifizierte Basisrevision `94eb5e0689468c781f59c3470508b2a8cf7d02ad` mit
uncommittierten Änderungen. Vorhandene Tabellenkorrekturen und parallel
entstandene Änderungen an der Ergebnisfusszeile bleiben erhalten.

`src/styles/app.css`: Der horizontale Editor-/Resultatdivider ist inklusive
Rahmen 6 px hoch; der vertikale Editor-/Schemadivider ist 6 px breit. Beide
verwenden gemeinsame Regeln für neutrale Fläche, Zentrierung und Griff sowie
die vorhandenen Hover-/Fokus-/Dragfarben. Griffe: 36 × 3 px horizontal und
3 × 36 px vertikal, Radius 2 px. Der zusätzliche linke Schemarahmen entfällt,
weil der vertikale Divider diese Kante bereits zeichnet.
`src/features/sql/SqlWorkbench.tsx` ergänzt den dekorativen vertikalen Griff
mit `aria-hidden="true"`. R-Divider, Bibliotheks-Ziehbereiche, Tastatursteuerung,
Grössenlimits und separate Layoutspeicherung bleiben unverändert. Keine neuen
Schnittstellen, Dependencies oder Datenformatänderungen.

**Tatsächliche Checks** (Node 22.23.1, npm 11.18.0):

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL cleanup: overview rename commits only on submit and schema stays nonmodal' --output=test-results/sql-dividers --reporter=list`:
  **1/1 bestanden, Exit 0**. Bestehender Schemafall mit echtem CSV-/DuckDB-Import,
  Pfeiltaste, Mausziehen, Grössenlimits, separatem Ansichtsstatus, Reload und
  Layoutreset; breite und schmale Ansichten eingeschlossen.
- `npm run typecheck`: **Exit 0**.
- `npx prettier --check src/features/sql/SqlWorkbench.tsx src/styles/app.css`
  und `git diff --check`: jeweils **Exit 0**.
- Zusätzliche UI-Prüfung über `cua_repl` im In-App-Browser bei **1440×900** und
  **1280×800**: beide Divider in Ruhe, bei Hover und Tastaturfokus sowie beim
  Mausziehen kontrolliert; Pfeiltasten ändern die Aufteilung in beiden
  Richtungen. DOM-Messungen bestätigen 6 px einschliesslich Rahmen, zentrierte
  Griffe mit vereinbarten Massen, gleiche Farben/Rundung und ausgeblendete
  dekorative Griffe. Eine anschliessende Node-Auswertung der Messdaten
  (`node --input-type=module`, Inlineprüfung über stdin) prüfte **15 Zustände,
  Exit 0**. Temporäre Browsergrösse zurückgesetzt und Prüf-Tab geschlossen.

Nachweise unter [sql-dividers](verification/sql-dividers/):
[Messdaten](verification/sql-dividers/measurements.json),
[Ruhe 1440](verification/sql-dividers/rest-1440.png),
[Ruhe 1280](verification/sql-dividers/rest-1280.png),
[horizontaler Hover](verification/sql-dividers/horizontal-hover-1440.png),
[vertikaler Hover](verification/sql-dividers/vertical-hover-1280.png),
[horizontaler Fokus](verification/sql-dividers/horizontal-focus-1440.png),
[vertikaler Fokus](verification/sql-dividers/vertical-focus-1280.png).
Weitere Hover-/Fokusbilder für beide Grössen liegen im selben Verzeichnis.

**Nicht ausgeführt:** Build, Lint, Unit-Tests, vollständige Suiten/Verify,
weitere Playwright-Browser und Deploymenttests. Die gezielte Auswahl deckt
Darstellung, Bedienung und die unmittelbar betroffene Layoutspeicherung ab.
Kein bekannter Blocker; dieser Korrekturabschnitt ist abgeschlossen, keine
weitere Implementierungsphase in diesem Auftrag. Kein Commit/Push.

## UI — Kompakte SQL-Paging-Leiste (25. Oktober 2026)

**Geliefert und gezielt geprüft: REQ-041/046/062/067, Regression zu
AT-027/054/055.** Verifizierte Basisrevision
`931959711567d0fb4e3460054f1434d7bf5149e1` mit diesen und bereits vorhandenen
uncommittierten Änderungen. Der Abschnitt wurde bei `94eb5e0` begonnen;
parallel entstandene Divideränderungen und offene Tabellenrahmenkorrekturen
bleiben erhalten.

`src/features/sql/SqlWorkbench.tsx` zeigt rechts in der Ergebnisfusszeile den
Zeilenbereich, beispielsweise `1–100 von 350`, gefolgt von zwei tertiären
`IconButton`s mit den zugänglichen Namen und Tooltips „Vorherige Seite“ und
„Nächste Seite“. Die feste Seitengrösse ist zentral als 100 definiert. Bereich
und Gesamtzahl werden mit BigInt und `de-CH` ohne Number-Präzisionsverlust
formatiert; die nächste Seitengrenze verwendet ebenfalls BigInt. Die letzte
Teilseite endet bei der vorhandenen Ergebniszeilenzahl, ein leeres Ergebnis
zeigt `0–0 von 0`. Beide Controls bleiben sichtbar; Grenz- und Ladezustände
deaktivieren die passenden Buttons. Bestehender Snapshot-/Pagingpfad, keine
neue Benutzerabfrage und keine Speicherformat- oder Dependencyänderung.

`src/styles/app.css` teilt die bestehende 12-px-Monospace-Typografie mit der
Bereichsangabe und hält die Paging-Gruppe mit 8 px Abstand zusammen; sie kann
als Ganzes umbrechen. Standardbedienflächen 40 × 40 px, über die vorhandenen
Touchregeln 44 × 44 px. `src/ui/Icon.tsx` ergänzt die unveränderten Originalpfade
`chevron-left` und `chevron-right` aus Bootstrap Icons 1.13.1; vorhandene
MIT-Lizenz unter `licenses/bootstrap-icons-1.13.1.txt` gelesen und erhalten.
`docs/DESIGN_SYSTEM.md` dokumentiert Darstellung und Verhalten.

Der bestehende Tabellenfall in `tests/e2e/sql-workbench.spec.ts` prüft erste,
mittlere und letzte Teilseite, Leerresultat, sichtbare/deaktivierte Controls,
Schrift, Abstände, Iconsemantik, Tooltips und Enter-/Leertastenbedienung sowie
unveränderte Laufanzahl bei Paging/Sortierung. Zur deterministischen Prüfung
des Ladezustands wird nur die Zustellung einer tatsächlich von DuckDB gelesenen
Seite kurz angehalten; keine Ergebnisdaten werden gefälscht.

**Tatsächliche Checks:**

- `npm run typecheck`: **Exit 0**.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --output=test-results/compact-paging --reporter=list`:
  **Exit 1**, Tooltipprüfung ohne vorherigen Tastaturmodus. Test auf echten
  sichtbaren Tastaturfokus umgestellt, Tooltip-Assertions erhalten.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions' --output=test-results/compact-paging-final --reporter=list`:
  **1/1 bestanden, Exit 0**, mit realem DuckDB-Ergebnis und allen oben genannten
  Tabellen-/Pagingprüfungen.
- Zusätzliche echte UI-Prüfungen mit
  `node --experimental-strip-types --input-type=module` über stdin:
  erster Touchlauf **Exit 1**, weil der Test ausschliesslich einen typografischen
  Apostroph erwartete, während die gepinnte Chromium-Intl-Version den geraden
  Schweizer Gruppentrenner liefert. Die Erwartung akzeptiert fachlich beide
  de-CH-Apostrophvarianten, keine Produktionsformatierung geändert.
  Korrigierter Lauf **Exit 0**: echte 1350-Zeilen-Abfrage, 44-px-Touchflächen,
  tatsächlich gemessene 8-px-Abstände und gemeinsamer Umbruch bei 360 px.
  Zusätzliche Scroll-/Touchprüfung bei 360×800 **Exit 0**: umgebrochene Controls
  ins Bild scrollbar, Tippen zeigt `101–200 von 1'350`.
- `npx prettier --check src/features/sql/SqlWorkbench.tsx src/ui/Icon.tsx src/styles/app.css tests/e2e/sql-workbench.spec.ts`:
  zunächst **Exit 1** (JSX-Zeilenformat), nach Korrektur am finalen Stand
  **Exit 0**. `git diff --check`: **Exit 0**.

Node 22.23.1, npm 11.18.0, Chromium 153.0.8010.12. Screenshots visuell geprüft:
[Desktop 1440×900](verification/compact-paging/desktop-1440.png),
[Desktop 1280×800](verification/compact-paging/desktop-1280.png),
[Touch-Fusszeile bei 360 px](verification/compact-paging/footer-touch-360.png).
Messdaten und Touch-Seitenwechsel:
[touch-measurements.json](verification/compact-paging/touch-measurements.json).

**Nicht ausgeführt:** Build, Lint, Unit-Tests, vollständige Suiten/Verify,
Browsermatrix und Deploymenttests. Die gezielte Auswahl deckt die angeforderte
Ergebnisnavigation und direkt angrenzende Tabellenfunktionen ab. Kein bekannter
Blocker; der Abschnitt ist abgeschlossen, keine weitere Phase in diesem Auftrag.
Kein Commit/Push.

## SQL-Tabellenkopf: rechter Abstand am Typ-Badge — 25. Oktober 2026

**REQ-062 / REQ-066, Status: bestanden.** In `src/styles/app.css` erhält
`.result-grid th .dw-button` zusätzlich `padding-inline-end: 6px`. Damit liegt
zwischen Typ-Badge und rechtem Hoverrand ein einheitlicher Abstand für alle
Spaltentypen. Vorhandene lokale Änderungen bleiben erhalten; keine neuen
Schnittstellen, Dependencies oder Tests.

**Verifizierter Stand:** `931959711567d0fb4e3460054f1434d7bf5149e1` plus
vorhandene lokale Änderungen und diese CSS-Ergänzung. Node 22.23.1,
npm 11.18.0, Chromium 153.0.8010.12.

**Tatsächliche Checks:**

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL results: compact actions, typed table headers, row numbers and sort without a new run' --output=test-results/type-badge-padding --reporter=list`:
  **1/1 bestanden, Exit 0**. Der vorhandene Fall prüft Tabellenköpfe,
  Sortierung ohne neuen Lauf und angrenzendes Paging mit echtem DuckDB-Ergebnis.
- `node --experimental-strip-types --input-type=module` über stdin:
  **Exit 0**, isoliertes persistentes Chromium-Profil und echte Abfrage
  `SELECT 2026::BIGINT AS jahr`. Bei 1440×900 und 1280×800 sind Hover und
  jeweils exakt 6 px Abstand zwischen Badge und rechtem Buttonrand bestätigt.
  Beide Screenshots anschliessend visuell geprüft; Profil wieder entfernt.
- `npx prettier --check src/styles/app.css`: **Exit 0**.
- `git diff --check`: **Exit 0**.

Nachweise: [Hover 1440×900](verification/type-badge-padding/hover-1440.png),
[Hover 1280×800](verification/type-badge-padding/hover-1280.png),
[Messdaten](verification/type-badge-padding/measurements.json).
Die protokollierten Hintergrundfarben stammen aus der laufenden Hovertransition;
der geometrische Abstand ist in beiden Ansichten 6 px.

**Nicht ausgeführt:** Typecheck, Lint, Build, Unit-Tests, vollständige Suiten,
`npm run verify`, weitere Browser und Deploymenttests. Die gezielte Auswahl
prüft die reine CSS-Korrektur und unmittelbar betroffenes Tabellenverhalten.
Keine bekannten Einschränkungen oder Blocker; Abschnitt abgeschlossen, keine
weitere Phase in diesem Auftrag. Kein Commit/Push.

## Hellere Speicherpunktfarben — 25. Oktober 2026

**REQ-067, Status: bestanden.** Der 10-px-Speicherpunkt verwendet eigene Tokens
`--dw-save-indicator-success: #28A745` und
`--dw-save-indicator-warning: #E07800`. Textfarben, Geometrie, Tooltip und
Speicherverhalten bleiben unverändert. Dateien: `src/styles/tokens.css`,
`src/styles/app.css`, `docs/DESIGN_SYSTEM.md`. Bestehende lokale Änderungen
bleiben erhalten; keine neuen Dependencies, Schnittstellen oder Tests.

**Verifizierter Stand:** `931959711567d0fb4e3460054f1434d7bf5149e1` plus
vorhandene lokale Änderungen und diese Farbanpassung. Node 22.23.1,
npm 11.18.0, Chromium 153.0.8010.12.

**Tatsächliche Checks:**

- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/projects.spec.ts -g 'Projects: save indicator stays bottom left without moving the SQL editor while saving' --output=test-results/save-indicator-colors --reporter=list`:
  **1/1 bestanden, Exit 0**. Prüft Statuswechsel, feste Position und Bedienfläche,
  unveränderte Editorgeometrie, Tastatur, Tooltip und Statusdialog.
- `node --experimental-strip-types --input-type=module` über stdin:
  **Exit 0**, isolierte persistente Chromium-Profile, gespeichertes Projekt und
  expliziter temporärer Modus. Berechnete Browserfarben entsprechen den Tokens;
  beide Punkte exakt 10×10 px bei identischer Position. Kontrast auf Weiss:
  Grün **3.13:1**, Orange **3.06:1**. Dunkle Status-Texttokens unverändert.
  Beide Detail-Screenshots bei tatsächlicher Grösse visuell geprüft;
  Profile und test-eigene OPFS-Verzeichnisse danach entfernt.
- `npx prettier --check src/styles/tokens.css src/styles/app.css`: **Exit 0**.
- `git diff --check`: **Exit 0**.

Nachweise: [Grün](verification/save-indicator-colors/success-detail.png),
[Orange](verification/save-indicator-colors/warning-detail.png),
[Browsermessungen](verification/save-indicator-colors/measurements.json).
Vollansichten bei 1440×900 liegen im selben Nachweisverzeichnis.

**Nicht ausgeführt:** Typecheck, Lint, Build, Unit-Tests, vollständige Suiten,
`npm run verify`, weitere Browser und Deploymenttests. Die gezielte Auswahl
deckt die begrenzte CSS-Anpassung und unmittelbar betroffenes Statusverhalten ab.
Keine bekannten Blocker; Abschnitt abgeschlossen, keine weitere Phase in diesem
Auftrag. Kein Commit/Push.
## UI — Tabellen und Spalten im Sodata-Explorer-Stil (25. Oktober 2026)

**Geliefert und gezielt geprüft: REQ-062/067, Regression zu AT-054/055/058.**
Verifizierte Basisrevision `76d450689bae6514d36f79e5ac6d786d5f6f755e` mit
diesen und bereits vorhandenen uncommittierten Änderungen. Vorhandene
Tabellenrahmenänderungen bleiben erhalten. Referenz gelesen aus dem lokalen
Sodata-Explorer (`SchemaExplorerPanel.tsx`, `explore.css`, Revision `9466ade`);
dokumentierte Paketbaseline `6b45fc4e22116fba8fc00bd48175e347aa740562` erneut
gelesen. Keine Änderungen am Quellportal oder an Dependencies.

`src/features/sql/SqlWorkbench.tsx` behält native `details`/`summary`-Elemente
bei und zeigt Chevron sowie blaues Tabellenicon vor dem SQL-Namen. Die
Attribute stehen als semantische Liste mit dem Typ vor dem Namen. Beide
Texte bleiben exakt wie im Schema. `src/ui/table.ts` ergänzt eine reine
UI-Klassifikation anhand des vollständigen skalaren Typs; bestehende
Tabellenausrichtung und Domainverträge sind unverändert. Datum/Zeit, komplexe
und unbekannte Typen bleiben neutral, auch wenn ihr Typtext `INT` enthält.

`src/styles/app.css`: Tabellenköpfe mit 14-px-UI-Schrift, dezentem Hover und
geerbtem sichtbarem Fokus; Mindesthöhe 32 px, bei Touch 44 px. Attribute sind
24 px eingerückt, die Badge-Spalte ist 88 px breit, der Abstand zum Namen
beträgt 8 px. Zeilen sind mindestens 28 px hoch und verwenden JetBrains Mono
mit 12 px/400. Lange Namen und Typen brechen innerhalb ihrer Spalte um.
`src/styles/tokens.css` definiert acht eigene Typfarbtokens für Zahl/Text/
Boolean/Weitere, getrennt von Statusrollen. `docs/DESIGN_SYSTEM.md` enthält
Farbrollen, Kontraste, aktualisierte CSS-Referenz und den Schemaflächenvertrag.

Der bestehende Schemafall in `tests/e2e/sql-workbench.spec.ts` importiert
sechs echte CSV-Spalten mit INTEGER, VARCHAR, BOOLEAN, DATE und
DECIMAL(38,18), einschliesslich langem Attributnamen. Er prüft gespeicherte
Typen/Namen, Badge-Reihenfolge und -farben, 24/88/8-px-Geometrie, Schrift,
Mindesthöhen, Umbruch, Hover, native Enter-/Leertastenbedienung, Chevronzustand
und Escape-/Button-Fokusrückgabe. Bestehende Rename-, Resize-, Reload- und
Layoutreset-Prüfungen sowie unveränderte Laufanzahl bleiben erhalten.

**Tatsächliche Checks:**

- `npm run typecheck`: **Exit 0**.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-workbench.spec.ts -g 'SQL cleanup: overview rename commits only on submit and schema stays nonmodal' --output=test-results/schema-explorer --reporter=list`:
  **Exit 1**, Testtimeout beim zweiten Typfeld: Die neue synthetische CSV
  nutzte Kommas statt des bestehenden Semikolon-Defaults. Fixture korrigiert
  und Anzahl der Typfelder vor Auswahl explizit geprüft; kein Importpatch.
- Derselbe Befehl mit `--output=test-results/schema-explorer-final`:
  **1/1 bestanden, Exit 0**. Anschliessend den 1280-px-Prüfviewport auf die
  vereinbarte Höhe 800 statt der zuvor bestehenden Höhe 900 geändert.
- Derselbe Befehl mit `--output=test-results/schema-explorer-viewports`:
  **1/1 bestanden, Exit 0** am finalen Stand bei 1440×900, 1280×800 und
  390×700; echte DuckDB-/CSV-Daten, keine gefälschten Engineergebnisse.
- `node --experimental-strip-types --input-type=module` über stdin:
  **Exit 0**, 13 direkte Prüfungen der UI-Typklassifikation, darunter
  `INTERVAL`, `INTEGER[]`, `VARCHAR[]`, `STRUCT(value INTEGER)`,
  `MAP(VARCHAR, BIGINT)`, `POINT` und ein unbekannter Typ mit `INTEGER` im
  Namen. Nur vollständige bekannte skalare Typen erhalten eine Typfarbe.
- Weitere Inline-Playwrightprüfung mit demselben Node-Aufruf:
  **Exit 0**, frisches persistentes Touchprofil, echte CSV-Einbindung und
  Tippen zum Öffnen/Schliessen. Gemessene Summary-Höhe **44 px** bei aktivem
  `(pointer: coarse)` und 1280×800. Prüfprofil anschliessend entfernt.
- Erster `npx prettier --check src/ui/table.ts src/features/sql/SqlWorkbench.tsx src/styles/tokens.css src/styles/app.css`:
  **Exit 1**, JSX-Zeilenformat korrigiert.
  `npx prettier --write tests/e2e/sql-workbench.spec.ts`: **Exit 0**.
  Abschliessend `npx prettier --check src/ui/table.ts src/features/sql/SqlWorkbench.tsx src/styles/tokens.css src/styles/app.css tests/e2e/sql-workbench.spec.ts`:
  **Exit 0**. `git diff --check`: **Exit 0**.

Node 22.23.1, npm 11.18.0, Chromium 153.0.8010.12. Visuell geprüfte Nachweise:
[1440×900](verification/schema-explorer/schema-1440.png),
[1280×800](verification/schema-explorer/schema-1280.png),
[schmale Ansicht](verification/schema-explorer/schema-390.png),
[Touch-Panel](verification/schema-explorer/touch-panel.png),
[Touch-Messungen](verification/schema-explorer/touch-measurements.json).

**Nicht ausgeführt:** Build, Lint, vollständige Unit-/E2E-Suiten,
`npm run verify`, Browsermatrix und Deploymenttests. Die gezielte Auswahl deckt
die Schemaanzeige und deren direkt betroffene Navigation/Layouts ab. Keine
bekannten Blocker; Abschnitt abgeschlossen, keine weitere Phase in diesem
Auftrag. Kein Commit/Push.


## SQL-Ergebnisaktionen und bündiger Resultatbereich — 25. Oktober 2026

**REQ-044/045/046/062/066/067; AT-006/027/032/040/055/058, Status: bestanden.**
Das Ergebnis-Menü enthält in Reihenfolge Aufbewahren, Datensatzübernahme und Laufdetails. Direkt sichtbar bleiben „Nach R übernehmen“, Export und Tabelle/Diagramm. Beide früheren Aufklappbereiche unter der Fusszeile entfallen. Tabelle/Diagramm scrollen intern; die Fusszeile bleibt am unteren Fensterrand. Bei sehr schmalen Fenstern mit vergrössertem Text begrenzen intern scrollende Werkzeugleisten ihren Höhenbedarf. Datensatzdialog: bestehende Validierung, Schema, alle Zeilen, Fehler im Dialog bei erhaltenen Eingaben, Schliessen nach Erfolg. Laufdetails: derselbe lesende Inhalt wie bisher, konkrete historische Lauf-ID, Zugang auch bei nicht verfügbaren Daten oder ohne Tabelle. R behält seinen bisherigen Detailsbereich.

Gemeinsamer `Modal` akzeptiert optional `focusTitle` (Default false), damit Laufdetails oben mit sichtbarem Titel starten; technische Details bleiben in der Tabreihenfolge. Escape/Schliessen kehren zum Menübutton zurück. Keine Änderungen an Engine-, Speicher-, Transfer- oder Projektformatverträgen und keine neuen Dependencies. Vorhandene lokale Änderungen einschliesslich Tabellenkanten/Sticky-Header blieben erhalten.

Dateien: `src/features/sql/SqlWorkbench.tsx`, `src/features/results/RunDetails.tsx`, `src/features/r/Transfer.tsx`, `src/ui/Modal.tsx`, `src/styles/app.css`; neue `tests/e2e/sql-result-actions.spec.ts`, gemeinsame `tests/ui/sqlActions.ts` und betroffene UI-/Deploymentselektoren; SPEC, Abnahmevertrag und Designsystem.

**Verifizierter Stand:** `2e7aa3d01ce83f92341e1738f1a497eded2b2794` plus vorhandene lokale Änderungen und diese Ergänzungen. Node 22.23.1, npm 11.18.0, Chromium 153.0.8010.12.

**Tatsächlich ausgeführte Checks:**

- `npm run typecheck`: **Exit 0**. Nach letzten Quelländerungen zusätzlich `npm run typecheck && npm run lint`: **Exit 0**, einschliesslich Modulgrenzen.
- `npm run test:unit -- tests/unit/provenance.test.ts`: **17/17 bestanden, Exit 0**. Der gemeinsam ausgegliederte Inhalt erhält die vorhandene R-Darstellung und Herkunftsangaben.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-result-actions.spec.ts --output=test-results/result-actions --reporter=list`: zunächst **Exit 1**, 1/2 bestanden. Der Datensatzfall mit echtem DuckDB-Ergebnis, einmaligem Fehler des tatsächlichen Artifact-Writers, erhaltenen Feldern, Retry, 350 Zeilen, Reload und anschliessender SQL-Abfrage bestand. Der neue Layoutfall verwendete zunächst Balken mit mehr als 100 Kategorien; auf fachlich passenden Scatter umgestellt.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-result-actions.spec.ts -g 'modal actions|keeping exposes' --output=test-results/result-actions --reporter=list`: zunächst **Exit 1**, 1/2 bestanden. Echter Aufbewahrungsfall mit kontrolliert verzögertem Parquet-Snapshot, sichtbarem Busyzustand, anschließendem echtem Datei-/Metadatencommit, Reload und lesendem Zweittab bestand. Der Layoutfall belegte den Engpass bei 390 px und 200 % Text; Werkzeugleisten begrenzt und intern scrollbar gemacht.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-result-actions.spec.ts -g 'modal actions' --output=test-results/result-actions-layout --reporter=list`: zunächst **Exit 1** durch zu frühen Reload des Testfalls. Ausführungsende und eingefrorenen Code vor Reload explizit abgewartet.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-result-actions.spec.ts tests/e2e/sql-workbench.spec.ts tests/e2e/sql.spec.ts tests/e2e/required-fields.spec.ts tests/e2e/projects.spec.ts tests/e2e/r.spec.ts tests/e2e/action-feedback.spec.ts tests/e2e/ui-texts.spec.ts -g 'modal actions|SQL documents:|SQL results: compact|P3 / AT-022|SQL dataset and R transfer|Projects: two SQL run snapshots|P5 AT-040|transfer errors dismiss|UI texts: real SQL' --output=test-results/result-actions-regression --reporter=list`: zunächst **7/9 bestanden, Exit 1**. Historienhelfer verwendete eine bereits veraltete Listen-CSS-Klasse; auf die Ergebnisbuttons umgestellt. Nach einheitlicher R-Beschriftung Bestätigung gezielt im Dialog gesucht. Bestehende Fusszeilenprüfung an die bereits getrennten Textfelder statt eines nicht vorhandenen Trennpunkts angepasst; Zeilenzahl und Laufzeit bleiben separat geprüft.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/projects.spec.ts tests/e2e/r.spec.ts -g 'Projects: two SQL run snapshots|P5 AT-040' --output=test-results/result-actions-recheck --reporter=list`: **2/2 bestanden, Exit 0**. Historische Resultate, Archiv-Rezeptimport und Herkunft sowie vollständiger echter SQL→R→SQL-Rundlauf, lazy Worker, Reset und Cancel.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/sql-result-actions.spec.ts -g 'modal actions' --output=test-results/result-actions-final-layout --reporter=list`: **1/1 bestanden, Exit 0**, nach letzten Geometrieänderungen und nochmals nach explizitem Titelfokus. Menü-Reihenfolge, Tastatur/technische Details/Fokusrückgabe, unveränderte Dokumente/Panelgeometrie/Scrollposition, Desktop 1440/1280, 390 px mit 200 % Text, sichtbarer Tabellenbereich, leeres Resultat, nicht verfügbare Ergebnisse und fehlgeschlagener Lauf ohne Tabelle. Nach visueller Kontrolle Anfangsfokus auf Titel ergänzt; Titel ist im Test sichtbar und fokussiert.
- `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/projects.spec.ts -g 'Projects: two SQL run snapshots' --output=test-results/result-actions-final-history --reporter=list`: nach letzter Dialogänderung **1/1 bestanden, Exit 0**, Historiennachweis aktualisiert.
- Damit **11 unterschiedliche gezielt ausgewählte Chromiumfälle bestanden**; Wiederholungen betrafen nur Fehlerkorrekturen oder danach relevante Quelländerungen. Die Auswahl deckt die geänderten Menü-/Dialog-/Layoutpfade, direkt angrenzendes Paging/Export und echte Engine-/Speicherwege ab.
- `node --experimental-strip-types --input-type=module` über stdin: **Exit 0**, vier echte Modallayouts bei 1440/390 px ohne horizontalen Dialogüberlauf, Fokusrückgabe, isoliertes persistentes Profil und test-eigenes OPFS-Verzeichnis danach entfernt. Finale Laufdetails-Screenshots anschliessend aus dem erfolgreichen Titelfokustest übernommen.
- `npm run build`: **Exit 0**, nach letzten Quelländerungen wiederholt **Exit 0**; lokale Runtimeassets und Lizenzinventar erstellt. Bestehender Hinweis auf grosse Bundle-Chunks bleibt.
- `npx prettier --check src/features/sql/SqlWorkbench.tsx src/features/results/RunDetails.tsx src/features/r/Transfer.tsx src/styles/app.css src/ui/Modal.tsx tests/ui/sqlActions.ts tests/e2e/sql-result-actions.spec.ts tests/e2e/sql-workbench.spec.ts tests/e2e/sql.spec.ts tests/e2e/r.spec.ts tests/e2e/required-fields.spec.ts tests/e2e/action-feedback.spec.ts tests/e2e/projects.spec.ts tests/e2e/ui-texts.spec.ts tests/e2e/p8-golden.spec.ts tests/deployment/xlsx.spec.ts tests/deployment/static.spec.ts tests/deployment/network-flow.spec.ts`: **Exit 0**; letzte ergänzte Quell-/Teststellen danach gezielt formatiert.
- `git diff --check`: **Exit 0**.

**Visuell geprüfte Nachweise:** [Desktop](verification/result-actions/result-bottom-1440.png), [1280 px](verification/result-actions/result-bottom-1280.png), [390 px](verification/result-actions/result-bottom-390.png), [vergrösserter Text](verification/result-actions/result-bottom-enlarged.png), [Datensatzdialog Desktop](verification/result-actions/dataset-1440.png), [Datensatzdialog schmal](verification/result-actions/dataset-390.png), [Laufdetails Desktop](verification/result-actions/details-1440.png), [Laufdetails schmal](verification/result-actions/details-390.png), [Modallayout-Messungen](verification/result-actions/measurements.json). Bestehende Screenshots für SQL-Historie und R-Transferbeschriftung aktualisiert.

**Nicht ausgeführt:** vollständige Unit-/E2E-/Integrationssuiten, `npm run verify`, Firefox/WebKit-/Safari-Matrix und Deploymenttests. Deren betroffene Selektoren sind angepasst, ihre Ausführung wird nicht behauptet. Keine bekannten Blocker; Abschnitt abgeschlossen, keine weitere Phase in diesem Auftrag. Kein Commit/Push.
