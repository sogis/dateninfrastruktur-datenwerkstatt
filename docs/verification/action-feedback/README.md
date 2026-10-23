# Aktionsrückmeldungen — Nachweis vom 23. Oktober 2026

Basisrevision: `faff2910f9fcadcbff6f9b4566b416fc9d7d918f` mit den bereits
vorhandenen lokalen Änderungen. Die geprüften Quellen sind in
[source-sha256.txt](source-sha256.txt) bezeichnet. Node 22.23.1, npm 11.18.0.

## Prüfungen

| Befehl                                                                   | Exit | Ergebnis                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                                                      | 0    | Abschliessender Typecheck.                                                                                                                                                           |
| `npm run lint`                                                           | 0    | ESLint und Modulgrenzen; erster Lauf Exit 1 wegen eines nach dem Umbau unbenutzten Imports, anschliessend korrigiert.                                                                |
| `npm run test:unit`                                                      | 0    | 71 Tests in 13 Dateien, davon 6 neue Feedback-Tests.                                                                                                                                 |
| `npm run build`                                                          | 0    | Produktionsbuild mit Lizenzinventar; bekannte Warnung zu Bundlegrössen über 500 kB.                                                                                                  |
| Gezielter Chromium-Regressionslauf, unten ausgeschrieben                 | 1    | 39/40 bestanden; neuer Layoutfall fand eine echte Kollision zwischen `.error` und Notice-Grid. CSS-Spezifität korrigiert, Layoutfall anschliessend in allen drei Browsern bestanden. |
| Feedback-Matrix, unten ausgeschrieben                                    | 1    | 28/30 bestanden. Die beiden Fehler betrafen die Testnavigation über die Browserleiste, nicht das Schliessen oder die Fokusrückgabe der App.                                          |
| Abschliessender Tastaturlauf, unten ausgeschrieben                       | 0    | 3/3 bestanden nach Korrektur des Tastaturwegs innerhalb des Dokuments.                                                                                                               |
| Gezieltes ESLint und Prettier für die geänderten Quellen und neuen Tests | 0    | Abschliessend geprüft; reine Importformatierung korrigiert.                                                                                                                          |
| `git diff --check`                                                       | 0    | Keine Whitespacefehler.                                                                                                                                                              |

Regressionslauf:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test --project=chromium tests/e2e/action-feedback.spec.ts tests/e2e/archive.spec.ts tests/e2e/diagnostics-settings.spec.ts tests/e2e/imports.spec.ts tests/e2e/portal.spec.ts tests/e2e/sql.spec.ts tests/e2e/r.spec.ts tests/e2e/ui-texts.spec.ts tests/e2e/design-system.spec.ts tests/e2e/navigation.spec.ts tests/integration/imports.spec.ts --reporter=line --output=/tmp/datenwerkstatt-feedback-e2e
```

Matrix mit den zehn neuen Fällen:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/action-feedback.spec.ts --project=chromium --project=firefox --project=webkit --reporter=line --output=/tmp/datenwerkstatt-feedback-final
```

Abschliessende Wiederholung des korrigierten Tastaturfalls:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/action-feedback.spec.ts --project=chromium --project=firefox --project=webkit --grep 'recipe omissions' --reporter=line --output=/tmp/datenwerkstatt-feedback-keyboard
```

Der neue Tastaturtest fokussiert den vorausgehenden Diagnose-Link und wechselt
von dort zum ×. Der anfängliche Weg vom letzten Button in die Browserleiste
und zurück war browserabhängig. Auf macOS-WebKit verwendet er wie der
vorhandene Navigationstest Option+Tab. Fokus, sichtbarer Rahmen, Enter,
Leertaste und Fokusrückgabe werden weiterhin geprüft.

Damit sind **31 bestehende Chromium-Fälle** und **30 neue Fälle über drei
Browser** einzeln erfolgreich nachgewiesen. Die fehlgeschlagenen Gesamtläufe
bleiben mit ihrem tatsächlichen Exitstatus dokumentiert; daraus wird kein
grüner Gesamtlauf abgeleitet. Logs stehen in diesem Verzeichnis, vollständige
Playwright-Artefakte in den oben angegebenen temporären Ausgabeverzeichnissen.

## Geprüftes Verhalten

2999/3000-ms-Grenze, identische Wiederholung, veraltete Antworten/Timer,
Unmount, echter Archivdownload, Auslassungen ohne Timer, Maus/Enter/Leertaste,
Tooltip und Fokus, unveränderte Eingaben und Validierung nach Schliessen,
Fokusfallback bei deaktivierter Importbestätigung, genaue Teilfehlerliste und
fortbestehender echter OPFS-Inventarbefund nach Ausblenden der Bestätigung.

Die bestehenden Regressionen verwenden echte DuckDB-WASM-/webR-Abläufe.
Gezielte Fehlerantworten für die neuen UI-Fälle existieren ausschliesslich in
Tests und sind keine Produktionspfade.

Ausgewählte Screenshots unter [screens/](screens/) wurden visuell geprüft:
Export ohne Auslassungen als Text, Export mit Auslassungen und ×, mehrzeiliger
Importfehler bei 390/1280/1440 px und bei 200 % Textgrösse. Das Bild des
anfänglichen Layoutfehlers bleibt ebenfalls erhalten. Textvergrösserung ist
keine native Browserzoomprüfung.

Nicht ausgeführt: vollständiges `npm run verify`, vollständige Suiten und
Browser-/Deploymentmatrix, native Safari- und native Zoomprüfung. Der
vorhandene Vite-Prozess 52467 wurde wiederverwendet und erhalten. Keine
Dependencies, kein Commit/Push und keine Veröffentlichung.
