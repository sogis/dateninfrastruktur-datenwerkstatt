# CSV-Importoptionen — Umsetzung und Prüfbericht

24. Oktober 2026. REQ-024–026/062/067; AT-008/010/051/055 sowie bestehende
Import-, Speicher- und Lesemodus-Regressionen. Basisrevision
`49fd41de41a4574832cf5e11f49bf189541bcaf5`, uncommitteter Arbeitsstand.
[Code-/Testfingerprint](candidate.json), [tatsächlich gestartete Browser](browser-versions.json).

## Gelieferter Umfang

- Basisoptionen mit zugänglichen Hilfetexten und dynamischen Beispielen:
  Spaltentrennzeichen, Textbegrenzungszeichen, Dezimalzeichen und Spaltennamen in der ersten Zeile.
- Textbegrenzung doppelt/einfach/keine in Vorschau, vollständigem Import,
  gespeicherter Herkunft und Archiv. Quote/Escape werden im Dialog gemeinsam gesetzt.
- Eingeklappte erweiterte Optionen für fehlende Werte; aktive Abweichungen bleiben
  sichtbar. Originaldatei mit verständlicher zusätzlicher Speichergrösse separat sichtbar.
- Parseränderungen invalidieren die Vorschau. Typinferenz erhält echten Leertext.
  Ausgeschaltete NULL-Umwandlung funktioniert auch ohne eigenen Marker; siehe
  [ADR-009](../../adr/009-csv-ohne-nullmarker.md).
- Responsive Darstellung mit Tastaturbedienung; Auswahltexte, Hilfetexte und
  Spaltenkarten verursachen bei schmaler Ansicht mit 200 % Text keinen Dialogüberlauf.

Wesentliche Implementierung: `DataSection.tsx`, `DatasetHistory.tsx`, scoped `app.css`,
`fileImportEngine.ts`, `contracts/domain.ts` und beide Domain-Validierungsgrenzen.
Neue Tests unter `tests/{unit,integration,e2e}` für CSV-Optionen; Spezifikation,
Abnahmen und Abnahmeindex aktualisiert. Standardwerte und Formatversion 1 bleiben
erhalten; bestehende Archive bleiben lesbar. Keine neuen Dependencies.

## Tatsächliche Checks

| Check | Exit | Ergebnis / Log |
| --- | ---: | --- |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | 0 | TypeScript, Lint/Modulgrenzen, **76 Unit**, Build, **59 Integration**, **75 E2E**; [Log](verify.log) |
| Gezielte Importmatrix, Befehl unten | 0 | **78/78**, je 26 in Chromium/Firefox/WebKit, keine Skips/Retry-Flakys; [Log](browser-matrix.log) |
| `npm run build` nach letzter WebKit-CSS-Korrektur | 0 | Aktueller Produktionsbuild einschliesslich Assets/Lizenzinventar; [Log](build-final.log) |
| `npx tsc -p contracts/tsconfig.json` | 0 | Eigene TypeScript-Verträge kompilieren |
| Prettier für geänderte App-/Testdateien und abschliessendes CSS | 0 | [App/Tests](format-app-tests.log), [finales CSS](format-css-final.log) |
| `git diff --check` | 0 | Keine Whitespacefehler |

```sh
DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 npx playwright test --project=chromium --project=firefox --project=webkit --output=.vite/csv-matrix-final tests/integration/csv-options.spec.ts tests/integration/imports.spec.ts tests/e2e/csv-options.spec.ts tests/e2e/imports.spec.ts tests/e2e/p8-imports.spec.ts tests/e2e/multitab.spec.ts --reporter=list
```

Die Matrix nutzt frische isolierte Browserprofile und einen eigenen Ergebnisordner.
Sie lief parallel zur Verify-Wiederholung gegen denselben unveränderten Vite-Server;
ihre CSV-/Lesemodusfälle verändern den Portaltestserver nicht. Die letzte CSS-Regel
entstand während des Gesamtlaufs. Danach wurde die vollständige gezielte Dreiermatrix
am endgültigen Code bestanden und der Produktionsbuild erneut erstellt.

## Prüfverlauf und korrigierte Fehler

- Erster Engine-Fokuslauf: **8/8**, Exit 0; [Log](chromium-engine.log).
- Erster UI-Lauf: **3/5**, Exit 1; [Log](chromium-ui.log). Er entdeckte die
  unzulässige leere DuckDB-NULL-Liste sowie echten Überlauf bei 200 % Text.
- Zusätzliche Regressionen prüfen Zahlen plus Leertext sowie unveränderte Texte
  `NULL`, `NA`, `__NULL__`, `\N`, `null`, `None`, `N/A` und die notwendige NUL-Sperre.
- Erster Gesamtcheck: Exit 1, **76 Unit/59 Integration/73 E2E bestanden**, zwei
  veraltete E2E-Erwartungen; [Log](verify-initial.log). Das bereits deaktivierte
  Menü im Lesemodus wird jetzt auf Deaktivierung geprüft; echter Archivdownload
  und Sitzungsmodus bleiben geprüft. Der bereits vorhandene Schemaabschnitt
  «Schemaänderungen» wird samt konkreter neuer Spalte/Typ geprüft. Keine
  Produktänderung zur Anpassung an diese alten Testannahmen.
- Erste Firefox-/WebKit-Matrix: **51/52**, Exit 1; [Log](browser-matrix-initial.log).
  WebKit liess native Auswahltexte bei 200 % über die korrekte Feldbreite hinaus
  in die Scrollbreite einfliessen. Nur CSV-Auswahlfelder begrenzen jetzt diesen
  Überlauf. Die anschliessende vollständige Dreiermatrix besteht **78/78**.
- Die breite Prettier-Prüfung einschliesslich `contracts/domain.ts` meldet Exit 1;
  [Log](format.log). Derselbe Vertrag war bereits in `HEAD` nicht vollständig
  formatiert ([Baselineprüfung](format-contract-baseline.log), Exit 1). Keine
  umfangreiche Umformatierung des Vertrags; die geänderten App-/Testdateien sind formatiert.

Historische Screenshots/JSONs, die bestehende Tests nebenbei neu erzeugten, wurden
bytegleich auf ihren bisherigen Stand zurückgesetzt. Aktuelle CSV-Nachweise liegen
ausschliesslich in diesem Ordner. Keine Goldenwerte geändert, keine Tests deaktiviert.

## Visuelle Kontrolle und Grenzen

Visuell geprüft: Basisansicht in Chromium und WebKit sowie schmale 200-%-Ansichten
in Chromium, Firefox und WebKit. Die Matrix prüft zusätzlich 390/1280/1440 px Breite
bei 900 px Höhe, Hilfetexte, Tastaturumschaltung, Vorschauinvalidierung und erreichbare
Dialogaktionen. Die 200-%-Prüfung vergrössert die HTML-Textgrösse; sie ist kein
Nachweis nativer Browserzoom-Bedienung.

- [Basisansicht](chromium-basis-1440.png)
- [Erweiterte Optionen](chromium-1440.png)
- [WebKit mit 390 px und 200 % Text](webkit-390-text-200.png)

Nicht ausgeführt: `npm ci` (bestehende gepinnte Installation verwendet), vollständige
Firefox-/WebKit-Suiten ausserhalb der gezielten Matrix, native Safari-Prüfung,
native Browserzoom-Prüfung und Deploymentmatrix. Der vorhandene Vite-Hinweis auf
grosse JS-Chunks bleibt bestehen. Der CSV-Auftrag ist abgeschlossen; dieser Bericht
ist keine erneute V1-Produktionsfreigabe.
