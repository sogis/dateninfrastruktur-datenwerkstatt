# XLSX-Export — Ausführungsnachweise

24. Oktober 2026; REQ-048 / AT-032. Verifizierte Quellbasis und SHA-256 aller
betroffenen Programm-/Test-/Paketdateien stehen in `source-fingerprint.json`.
Die anfänglich vorhandenen CSV-Änderungen wurden zwischenzeitlich unabhängig
als `472385c7866913462a1dbb6f8f194e7e3299cd47` eingecheckt und erhalten.
Während der Implementierung wurde kein Commit, Push oder Release ausgeführt.
Der anschliessende separate XLSX-Commit und Push erfolgen auf ausdrücklichen
Nutzerauftrag.

| Tatsächlich ausgeführter Befehl | Exit / Ergebnis | Nachweis |
| --- | --- | --- |
| `npm install --save-exact exceljs@4.4.0` und `npm install --save-dev --save-exact fflate@0.8.3` | jeweils 0; keine Versionsänderung an bereits vorhandenen Lockfile-Paketen | Paketdateien / Fingerprint |
| `node scripts/prove-native-xlsx.mjs` mit laufendem Vite | 0; nativer v1.5.4-Fehler reproduziert (9995 statt 9999 Werte), Textprojektion 9999 | `native-proof.log` |
| `npm run typecheck` während paralleler Schemaarbeit | 2, optionale `description` passte noch nicht zum strikten Domainvertrag; durch explizite Schemaübernahme korrigiert | `typecheck-first.log` |
| `npm run typecheck` nach Korrektur | 0 | `typecheck-final.log` |
| `npm run lint` | 0, inklusive Modulgrenzen | `lint-first.log` |
| `npm run build` | 0, inklusive lokaler Assets und Lizenzinventar | `build-first.log` |
| `npx vitest run tests/unit/download.test.ts` | 0, 2/2; echter wartender Stream wird abgebrochen, kein Download, URL-Freigabe | `download-unit.log` |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/xlsx.spec.ts tests/e2e/xlsx.spec.ts --project=chromium --reporter=list --output=test-results/xlsx-first` | 1, 6/8; zwei Navigationen während Vite-Optimierung/Sourceänderungen | `first-browser-captured.log` (aus tatsächlicher Toolausgabe transkribiert) |
| Derselbe Browserbefehl mit `--grep 'XLSX SQL UI:\|XLSX R: full dataframe' --output=test-results/xlsx-repeat` | 0, 2/2 gezielt wiederholt | `retry-browser-captured.log` (transkribiert) |
| `DW_REUSE_DEV_SERVER=1 npm run verify` (erster Lauf) | 1; Typecheck/Lint/92 Unit-Tests/Build erfolgreich, Integration 64/65; noch im Testprozess geladener alter Sollwert erwartete Z an zonenlosem TIMESTAMP. Aktueller Test unterscheidet zonenlos und UTC ausdrücklich. E2E wegen `&&` nicht gestartet | `verify-first.log` |
| `DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/integration/xlsx.spec.ts --grep 'exact values\|closing the session\|hard reset' --reporter=list` | 1, 2/3; tatsächlicher Sessionabbruch korrekt, Worker wurde vor Registrierung des Playwright-Observers beendet. Test koordiniert jetzt Beobachtung vor Schliessen | `lifecycle-final.log` |
| `npm run test:deployment -- tests/deployment/xlsx.spec.ts --project=chromium-1 --reporter=list` | 0, 2/2; echte Caddy-Container unter `/lab/`, vollständige SQL-/R-Downloads, Reopen, unverändertes R-Projekt, CSP und lokale Worker | `deployment-first.log` |
| `npm audit --json` | 1, 11 Befunde; vorhandene und transitive Befunde ausdrücklich dokumentiert | `npm-audit.json`, `../../DEPENDENCIES.md` |

Die Anfangsfehler bleiben als solche erhalten. Ein erfolgreicher gezielter
Wiederholungslauf ersetzt keinen fehlgeschlagenen Gesamtlauf. Temporäre
Playwright-Traces der ersten Agentenläufe wurden durch spätere Standard-
Testverzeichnisbereinigung entfernt; die transkribierten Logs behaupten keine
weiterhin vorhandenen Originaltraces.

Der XLSX-Worker ist ein separater, erst bei Bedarf gestarteter Buildchunk:
1'023'288 Bytes, gzip 280'668 Bytes. ExcelJS ist nicht im Startchunk enthalten.
Die bekannte Vite-Warnung zu grossen Chunks wird nicht unterdrückt. Der Build
enthält Paket-/Original-Lizenzen einschliesslich ExcelJS.

## Abschliessende Prüfungen

`DW_REUSE_DEV_SERVER=1 npm run verify` beendet sich im abschliessenden Gesamtlauf
mit **Exit 0**: **92/92 Unit-Tests, 67/67 echte Integrationstests und 77/77 E2E-Tests**,
zusätzlich Typecheck, Lint/Modulgrenzen, Produktionsbuild und Lizenzinventar.
Originalstdout: `verify-final.log`; dazugehörige Quellhashes:
`verify-source-fingerprint.json`.

Danach wurde ausschliesslich die Gross-/Kleinschreibung literaler OOXML-
Escapepräfixe korrigiert: `_X0041_` bleibt `_X0041_`, statt zu `_x0041_` zu werden.
Unit- und echte Browserrundläufe enthalten jetzt auch diesen genauen Wert.
Für diesen finalen Detailstand wurden `npm run typecheck && npm run lint &&
npm run test:unit && npm run build` erneut ausgeführt: **Exit 0**, **92/92**
Unit-Tests, Produktionsbuild und Lizenzinventar erfolgreich. Diese Ausgabe wurde
direkt in der Toolantwort erfasst; der vollständige Verify-Gesamtlauf wird nicht
als nach dieser letzten Detailkorrektur wiederholt ausgegeben.

`DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/xlsx.spec.ts
tests/e2e/xlsx.spec.ts --project=chromium --project=firefox --project=webkit
--reporter=list --output=test-results/xlsx-final-matrix`: **Exit 0, 30/30**
(acht Integrations- und zwei UI-Fälle pro Browser), Originalstdout
`browser-matrix.log`. Einschliesslich tatsächlicher Workerbeendigung bei
Abbruch/Timeout/Sitzungsende, echter DuckDB-Hardreset und Wiederherstellung,
SQL-/R-Dateien und unveränderter R-Projektdefinition. Browserstände und finale
Quellhashes: `source-fingerprint.json`.

Die neue UI wurde bei 1440×900 und 390×700 visuell geprüft; keine horizontale
Seitenüberbreite. Screenshots mit Menü und geschlossenem Menü sowie Messwerte:
`screens/`. Der Typtext bleibt vollständig sichtbar; mit offenem Menü wird er
vorübergehend überlagert. Dies ist keine neue native Zoom-/Safari-Abnahme.

Nicht ausgeführt: vollständige Firefox-/WebKit-Suiten aller Altfunktionen,
nativer Safari-XLSX-Test oder eine V1-Releaseabnahme. Die bestehende historische
Safari-Abnahme wird nicht als Nachweis der neuen XLSX-Funktion ausgegeben.


Finaler statischer Nachweis nach der Gross-/Kleinschreibungskorrektur:
`npm run test:deployment -- tests/deployment/xlsx.spec.ts --project=chromium-1
--reporter=list`: **Exit 0, 2/2**, `deployment-final.log`. Derselbe finale Worker
wird im echten `/lab/`-Container geladen, beendet und ohne CSP-Verstoss verwendet.
`git diff --check`: **Exit 0**. Alle 22 finalen Programm-/Test-/Paket-/Skript-
Fingerprints wurden nochmals gegen die Dateien verglichen, keine Abweichung.

Der Gesamtlauf schreibt einige historische Screenshot-/Geometriedateien unter
anderen Nachweisverzeichnissen neu. Diese 25 eigenen generierten Ausgaben wurden
nach `test-results/xlsx-regression-artifacts/` kopiert und die historischen
Dateien aus dem vor dem Lauf sauberen Gitstand wiederhergestellt. Keine Tests,
Fixtures oder Sollwerte wurden dadurch geändert; historische Nachweise bleiben
unverändert. Neue XLSX-Nachweise stehen ausschliesslich in diesem Verzeichnis.

Für den Commit wurden nachgestellte Leerzeichen und zusätzliche Leerzeilen am
Ende der Terminalprotokolle sowie eine zusätzliche Schlussleerzeile der
Lizenzkopie entfernt. Prüfergebnisse und Lizenztext bleiben unverändert.
