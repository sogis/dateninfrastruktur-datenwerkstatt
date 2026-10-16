# Projekte und nachvollziehbare Beziehungen

Prüfung begonnen am 15., fortgesetzt am 16. Oktober 2026. Zielrepository-Basis `f460278a351aedafe667990e6dbfd164105a1301`, uncommittierter Kandidat; Node 22.23.1, npm 11.18.0. Die geprüfte [Quellbaseline](../../BASELINE.md) bleibt `sogis/datenportal-sodata` am Commit `6b45fc4e22116fba8fc00bd48175e347aa740562`; das Quellportal wurde nicht verändert. Der aktuelle [Dateifingerprint](code-fingerprint.json) umfasst 169 Dateien mit Produktcode, Verträgen und aktiven Tests: `45dae17f976e1d77d4df5a42398463bc5fd11ef70997d16e3a816659c0b0b96a`. Verify, E2E-Matrix und reguläre Deploymentmatrix sind bestanden. Der beauftragte UI-Abschnitt ist technisch verifiziert.

## Gelieferte Änderung

REQ-011–015/059–067; Regression zu AT-006/018/054–058. Einheitlicher Projektbegriff, `/projects` ohne alte URL-Aliase, eigene Übersicht und Datenseite. Die Übersicht enthält Projektangaben/Analysen/kompakte Datenliste; Datei-/Portalimport und Datenaktionen liegen auf Daten. Persistente `Workspace*`-Verträge, UUIDs, Browserablage und Archive bleiben unverändert.

Datenstände und Herkunft zeigen aktuelle/frühere Versionen, Schema, Umfang, Datei-/Portal-/Ergebnisquellen und bekannte Verfügbarkeit. Gemeinsame SQL/R-Laufdetails ordnen eingefrorenen Code, Parameter, konkrete Eingaben und Ergebnisse zu. Ein SQL-Projektsnapshot behauptet keine tatsächliche Verwendung jeder verfügbaren Quelle. R-Objektübernahmen benötigen keine gespeicherte Analyse. Metadatenanzeigen führen keinen Code aus.

Die drei vereinbarten Abschnitte sind im Produkt umgesetzt:

| Abschnitt                                 | Konkrete Dateien                                                                                                                                    | Zweck                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Projektbegriff und Routen              | `src/app/router.tsx`, `scripts/deployment.mjs`, `SPEC.md`                                                                                           | Einheitliche Navigation und `/projects`-Routen; alte URLs ohne Alias, passende statische History-Regeln und dokumentierte Zuordnung der Fachbegriffe.   |
| 2. Übersicht und Daten trennen            | `src/features/workspaces/Workspaces.tsx`, `src/features/data/DataSection.tsx`                                                                       | Übersicht für Projektangaben, Analysen und kompakte Datenliste; eigene Datenseite für Import und Verwaltung bei gemeinsamer Projektsitzung.             |
| 3. Beziehungen und Herkunft lesbar machen | `src/features/data/DatasetHistory.tsx`, `src/features/results/RunDetails.tsx`, `src/features/sql/SqlWorkbench.tsx`, `src/features/r/RWorkbench.tsx` | Datenstände, Herkunft und Verfügbarkeit sowie gemeinsame Details zu eingefrorenen Läufen, konkreten Eingaben und Ergebnissen; Aufklappen bleibt lesend. |

Die vier neuen fachlichen Browserabläufe prüfen getrennte Seiten und dieselbe SQL/R-Sitzung samt lebenden Workern, zwei CSV-Datenstände, fehlgeschlagenes Speichern mit blockierter Navigation/Retry und zwei unveränderliche SQL-Läufe samt Paging/Reload/Recipe-Herkunft. Eine zusätzliche deterministische Browserregression prüft den Fokus bei verzögert geladenem echten Editor. Sieben ergänzende Renderfälle prüfen auch grosse Zahlen/Dezimalwerte und fehlende/beschädigte Datei-Bytes.

## Nachweise

- [Projektübersicht](chromium-project-overview.png)
- [Datenstände und Schema](chromium-project-data-history.png)
- [Lesbare SQL-Laufdetails](chromium-sql-details-visible.png)
- [Lesbare R-Laufdetails](chromium-r-details-visible.png)
- [Zusätzliche Scroll-/Geometrieprüfung](chromium-run-details-qa.json): echte SQL/R-Ausführung, beide Detailenden erreichbar, keine Console-/Page-Errors.
- [Exakte Mirror-Wiederherstellung](mirror-recovery.json): vorhandenes lokales Image `datenwerkstatt-p8:verified`, 44/44 Original-SHA-256-Pins einschliesslich Paketindizes und lock.json. Keine Versions-/Prüfsummenänderung. Die Wiederherstellung betrifft ignorierte lokale Buildassets.

## Abschlussprüfungen

- `DW_REUSE_DEV_SERVER=1 npm run verify`: **Exit 0**, TypeScript/Lint/Modulgrenzen, **47 Unit-/Regressionstests**, Build, **43 Chromium-Integrationen und 37 Chromium-E2E** bestanden. [Originalausgabe](verify.log).
- Geometrie, History mit Cursor/Undo und verspätetes Editorladen: **9/9, Exit 0**, je drei Fälle in Chromium/Firefox/WebKit. [Fokusregression](editor-focus-intent-regression.log).
- `DW_REUSE_DEV_SERVER=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/browser-matrix.json npx playwright test tests/e2e --project=firefox --project=webkit --reporter=list,json`: **Exit 0, 74/74 bestanden**, je 37 in Firefox und WebKit ([Log](browser-matrix.log), [JSON](browser-matrix.json)). Mit Chromium **111/111 E2E**, keine Flakes oder übersprungenen Fälle.
- `PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/projects/deployment.json npm run test:deployment -- --reporter=list,json`: **Exit 0, 63/63 bestanden**, je sieben Fälle in neun Profilen (Chromium/Firefox/WebKit × Root, `/lab/`, `/lab/` isoliert). Keine Flakes oder übersprungenen Fälle ([Log](deployment.log), [JSON](deployment.json)). Direktaufruf/Reload, Back/Forward, ungültige IDs und alte URL-/Asset-404 unter beiden Basispfaden sind bestätigt.
- Dokument-/Fixturekonsistenz und lokale Links: `python3 tools/verify-package.py --report docs/verification/projects/package-check.json` **Exit 0**, 80 Requirements/72 Abnahmeszenarien ([Bericht](package-check.json)). Prettier der geänderten Code-/aktiven Dokumentdateien und `git diff --check` ebenfalls Exit 0; historische Statusabschnitte nicht umformatiert.
- [Zusammengefasste Prüfzahlen](checks-summary.json) und [abschliessender Hash-/Schutzbereichsabgleich](final-check.json): finaler Code-/Testsatz unverändert; Verträge, Fixtures, Infrastruktur, Paketpins und historische Belege unverändert. Typecheck und Lint nach den Testvorbereitungskorrekturen ebenfalls Exit 0 ([Lintlog](final-lint.log)).

Seit Beginn des finalen Verify-Laufs blieben Produkt-, Engine- und E2E-Code unverändert. Ausschliesslich der neue Deploymenttest erhielt danach eine explizite Speichern-Barriere vor harten Reloads und wartet vor URL-Aufnahmen auf die tatsächliche Zielroute. Typecheck, gezieltes ESLint und Prettier bestanden danach (Exit 0). Der [vorherige Inventarstand](code-fingerprint-before-deployment-save.json) bleibt erhalten; das aktuelle Inventar enthält auch diese Testvorbereitung.

Historische Prüfbelege bleiben unverändert. Der vorhandene Nutzer-Devserver auf 4173 wird weiterverwendet und nicht beendet.

## Zwischenbefunde

Ein vollständiges Verify vor den Fokuskorrekturen bestand mit 47 Unit-, 43 Integrations- und 36 Chromium-E2E-Fällen ([Originalausgabe](verify-before-editor-focus.log)). Die erste anschliessende Firefox-/WebKit-E2E-Matrix endete mit **Exit 1, 71/72 bestanden**: Firefox 36/36, WebKit 35/36; der Fehler betraf das Zurücksetzen im bestehenden P7-Geometrietest ([Log](browser-matrix-before-editor-focus.log)). Ursache und Korrektur sind unten dokumentiert.

Ein erneuter Verify-Anlauf stoppte mit **Exit 2** bereits in TypeScript: Im neuen Invalid-ID-Deploymenttest musste das Testfallarray bei `exactOptionalPropertyTypes` als unveränderliches Tupel (`as const`) typisiert werden. Typecheck nach Korrektur Exit 0; die nachfolgenden Verify-Stufen waren in diesem abgebrochenen Lauf nicht ausgeführt ([Log](verify-deployment-types.log)).

Erste Fokusläufe hatten Exit 1 mit 13/16, 8/10 und 3/4 bestandenen Fällen. Die abschliessende Darstellung änderte neue Textannahmen; gespeichertes Schema bleibt bei fehlenden Daten sichtbar. Ein unversionierter dynamischer Servicesimport konnte auf dem bestehenden Vite-Server nach HMR eine zweite Modulinstanz erzeugen. Browserprüfungen importieren nun die tatsächlich geladene Services-URL oder einen statischen Testreexport, der dieselbe Vite-Modul-URL nutzt. Keine Produktions-Testhooks, keine abgeschwächten Locks und keine geänderten Goldenwerte. Der unveränderte Monaco-Undo-Test bestand nach Ende paralleler Sourceänderungen. Der neue fachliche Chromium-Fokus bestand mit 4/4 Fällen, Exit 0.

Erstes `verify`: Exit 1, 47 Unit-Tests/Build bestanden, 41/43 Integrationen bestanden; E2E-Stufe nicht erreicht. Die beiden Fehler waren eine noch auf der Datenseite erwartete Projektüberschrift und derselbe Testimportkonflikt. Nach Navigation-/Harnesskorrektur beide gezielt bestanden (2/2, Exit 0). [Erste vollständige Originalausgabe](verify-initial.log).

Zweites `verify`: Exit 1, 47 Unit-Tests/Build und alle 43 Integrationen bestanden; 35/36 Chromium-E2E bestanden. Der verbleibende Portaltest verwendete einen mehrdeutigen Statustextselektor, der auch eingeklappte Historienmetadaten fand. Die Prüfung ist nun auf den sichtbaren Zeilenstatus begrenzt; danach der Portalablauf gezielt bestanden (1/1, Exit 0). [Zweite Originalausgabe](verify-before-portal-selector.log).

Die anschliessende WebKit-Diagnose belegte einen echten Produktfehler: Nach verzögertem Laden fokussierte `CodeEditorImpl` den Editor unbedingt. War inzwischen das Toolbar-Menü geöffnet, wechselte der Fokus vom Menüeintrag zur Editor-Textarea und das Menü schloss vor der Reset-Aktion. Der erste Guard setzte den Anfangsfokus nur, wenn der Fokus noch auf dem Dokumentkörper oder bereits im Editor lag. Das verhinderte die Menüschliessung, war für die bestehende History-Fokuswiederherstellung jedoch zu streng. Die [WebKit-Diagnose](webkit-editor-focus-qa.json) enthält den Fokuswechsel des ursprünglichen Verhaltens und den Vergleich mit ausschliesslich temporärer Antwortkorrektur; mit Guard blieb das Menü fokussiert und der Splitter wurde auf 45 zurückgesetzt. Es wurden keine Console-/Page-Errors erfasst.

Der erste gezielte Lauf nach dem Produktfix endete mit **Exit 1, 5/6 bestanden**. Der ursprüngliche P7-Geometrie-/Resettest bestand dabei in **allen drei Browsern**. Ausschliesslich die neue Fokusregression scheiterte in Firefox an ihrer Annahme, Monacos unfokussierte interne Textarea müsse sichtbare Abmessungen haben. Der Test prüft nun deren Vorhandensein im DOM sowie weiterhin den sichtbaren Editor, erhaltenen Menüfokus und die tatsächliche Reset-Wirkung. Der Produktguard wurde dafür nicht verändert. [Erster gezielter Lauf](editor-focus-regression-initial.log).

Die anschliessende deterministische Fokusregression bestand in Chromium, Firefox und WebKit mit **3/3, Exit 0**. Sie hält die echte Editor-Modulantwort zurück, öffnet das Menü vor der Editorinitialisierung und prüft nach Freigabe Fokus und Reset. [Originalausgabe](editor-focus-regression.log).

Der vollständige Verify-Lauf des ersten Guards endete mit **Exit 1**: TypeScript/Lint, 47 Unit-Tests, Build und 43 Integrationen bestanden; 36/37 Chromium-E2E bestanden. Die unveränderte P7-Historyprüfung verlangte nach Back wieder Editorfokus und deckte die Regression auf. [Originalausgabe](verify-before-focus-intent.log). Der finale Guard erfasst deshalb den Fokusursprung bereits vor der Lazy-Grenze: normale Navigation stellt Editorfokus wieder her; ein während des Ladens neu fokussiertes Menü bleibt bedienbar. History-/Cursor-/Undoassertions sind unverändert.

Der erste reguläre Deploymentlauf wurde nach einem nachgewiesenen Fehler im neuen Routentest vorzeitig beendet: **Exit 130**, 7 bestanden, 1 fehlgeschlagen, 1 unterbrochen, 54 nicht ausgeführt ([Log](deployment-initial.log), [JSON](deployment-initial.json)). `page.url()` unmittelbar nach dem asynchronen Projektklick lieferte noch die Liste; der Test navigierte deshalb korrekt zur falschen Seite. Die Zielroute wird nun vor jeder URL-Aufnahme abgewartet. Projekt und beide Analysen waren korrekt gespeichert; kein Produktionsfix erforderlich. Typecheck, gezieltes ESLint und Prettier nach Korrektur Exit 0. Bestehende Assertions unverändert; gezielte Routenprüfung und gesamte Matrix werden wiederholt.

## Grenzen der Prüfung

- Keine Wiederherstellung historischer Datenversionen, globale Ergebnisverwaltung oder zusätzlichen Historienrouten. Bestehende Domain-, Speicher- und Archivverträge bleiben erhalten.
- Der beauftragte UI-Abschnitt ist abgeschlossen. Es wurde keine produktive Veröffentlichung vorgenommen.
- Nativer Safari-Pilot und Ressourcenbenchmark werden für diesen UI-Abschnitt nicht erneut ausgeführt. Die aktuellen Browsernachweise gelten für Chromium, Firefox und Playwright-WebKit.
- Die exakte lokale Mirror-Wiederherstellung aus dem vorhandenen Image hat die Prüfblockade behoben. Sie belegt keinen reproduzierbaren frischen Neuabruf aus dem inzwischen veränderten Upstreamindex; dieser bleibt eine separate externe Abhängigkeit. Mirror-Skript, Paketpins, Lockfile und erwartete Prüfsummen wurden nicht angepasst.

Nächster konkreter Schritt: fachliche Sichtung der gelieferten Ansichten unter `/projects`. Der vorhandene Nutzer-Devserver auf 4173 läuft weiter; die Testcontainer wurden nach Abschluss entfernt.
