# SQL-Aufräumen — Prüfbericht, 24. Oktober 2026

Basisrevision `6c3b44d151079242b33f75db7534cd2f813ab4c0`; Lieferung im uncommittierten Arbeitsbaum. Der finale Quell-/Test-/Fixturestand ist in [source-sha256.txt](source-sha256.txt) bezeichnet. Node 22.23.1, npm 11.18.0, Playwright 1.63.0; Browserprüfungen ausschliesslich Chromium.

## Geliefert

- Übersicht: „Umbenennen“ vor Duplizieren/Archivieren; lokaler Dialogentwurf und atomarer Commit, Abbrechen ohne Mutation. SQL zeigt den Analysenamen als Text. Name/ID und Code sind getrennt.
- SQL-Versionen enthalten ausdrücklich gespeicherten Code und Parameter. Autosave, Cmd+S und Ausführen erzeugen keine Version. Wiederherstellung bestätigt einen abweichenden Entwurf, aktualisiert sichtbares Monaco samt Code-Undo und Parameter, startet keine Engineausführung.
- Projektformat **2**, ohne Migration oder Altbestands-Pruner. Alte Formate blockieren weder Liste noch Restebereinigung; Direktladen und Archivimport lehnen sie ab. Ihre Metadaten/Dateien bleiben erhalten. ZIP-Hülle weiterhin Archivversion 1; Katalog-/Runtime-/Diagnoseformate unverändert.
- Aktuelles SQL-Ergebnis statt automatischer Laufauswahl. Geschützte Ergebnisse und ihre transitive Herkunft bleiben erhalten; ersetzte ungeschützte SQL-Arbeitsläufe werden beim neuen Run atomar entfernt. Handlefreigabe erst nach Commit und Ende aller Leser; doppelte gleichzeitige Freigabe ist ausgeschlossen. R-Historie bleibt erhalten.
- Nichtmodale Tabellen-/Spaltenhilfe rechts neben dem Editor, bei schmaler Ansicht separat darüber; eigene Scrollfläche und sichtbarer Kopf. Parameterdialog mit Beispiel; Versionen, gesicherte Ergebnisse und Reset sind gezielte Aktionen.
- Tertiary-Hover zentral #EEF1F4, Pressed #E7EBEF; Danger/Auswahl/Disabled/Fokus erhalten.

Relevante Dateien: `contracts/domain.ts`, Domainvalidator/Remapping/SQL-Retention und Unveränderlichkeit; `WorkspaceEditingSession`, `AnalysisService`, Repository/Archiv/Recovery; `SqlWorkbench`, `SqlVersions`, `NameDialog`, Übersicht, Monaco/UI-Hooks und CSS. Keine neuen Dependencies oder Versionsupgrades.

Betroffene Requirements: REQ-011/013–016/019/034–036/038/041/043–045/062/066–068. Bestehende UI-Tests wurden auf die ausdrücklich veränderten Aktionen umgestellt; fachliche Goldenwerte blieben unverändert.

## Tatsächlich ausgeführte erfolgreiche Checks

| Befehl / Auswahl | Ergebnis |
| --- | --- |
| `npm run typecheck` | Exit 0; [Log](typecheck.log) |
| `npm run lint` | Exit 0, einschliesslich Modulgrenzen; [Log](lint.log) |
| `npm run build` | Exit 0; lokale Assets/Mirror/Lizenzen geprüft; [Log](build.log). Vorhandene Chunkgrössenwarnung bleibt. |
| `npm run test:unit -- tests/unit/sql-workbench.test.ts tests/unit/workspace.test.ts tests/unit/archive.test.ts tests/unit/publication.test.ts tests/unit/csv-import-options.test.ts tests/unit/provenance.test.ts` | Exit 0, 51/51 |
| `npm run test:unit -- tests/unit/sql-workbench.test.ts` nach zusätzlichem Read-only-Fall | Exit 0, 10/10; zusammen **52 unterschiedliche Unitfälle** |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/sql-workbench.spec.ts --project=chromium --reporter=list --output=test-results/sql-workbench-integration` | Exit 0, 3/3; echte DuckDB/IndexedDB, 30 Wiederholungen, Commitfehler, Schutzgraph, gleichzeitige vollständige Leser, Archiv/Neustart und Altformatablehnung |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/sql-workbench.spec.ts --grep 'whole payload/chart' --project=chromium --reporter=list --output=test-results/sql-workbench-readers` | Exit 0, 1/1; Erweiterung um eine zweite Ersetzung während verzögerter Freigabe |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts tests/e2e/design-system.spec.ts --grep 'SQL cleanup:|UI tertiary hover:' --project=chromium --reporter=list --output=test-results/sql-workbench-ui-fixed` | Exit 0, 3/3; Versionen/Parameter/Undo, Umbenennen, Schema und Hover |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts --project=chromium --reporter=list --output=test-results/sql-workbench-layout-final` | Exit 0, 2/2; [Log](ui-final.log), ergänzte Flächenmessung 1440×900/1280×800 und sichtbarer Schemakopf bei 390 px |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/required-fields.spec.ts --grep 'parameter values are required' --project=chromium --reporter=list --output=test-results/sql-workbench-parameters` | Exit 0, 1/1; leerer Text, Zahlen, NULL und Namenskollisionen im neuen Dialog |
| Gezielter Regressionsbefehl unten | Exit 0, 10/10; einschliesslich echter Workerbeendigung, frischer Folgequery, Paging/Export und echtem SQL→R-Transfer |

Regressionsbefehl:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/integration/sql.spec.ts tests/e2e/sql.spec.ts tests/e2e/required-fields.spec.ts tests/e2e/projects.spec.ts tests/e2e/optional-labels.spec.ts tests/e2e/action-feedback.spec.ts --grep 'actual worker termination|P3 / AT-022|AT-025 AT-030|Required fields: sql|a late real editor|two SQL run snapshots|SQL toolbar alignment|parameter-apply error' --project=chromium --reporter=list --output=test-results/sql-workbench-regression
```

Die mehrfach gezielt nachgeprüften Fälle sind keine zusätzlichen unabhängigen Testfälle. Insgesamt **5 unterschiedliche Integrations- und 12 UI-Fälle** ausgeführt. Die Prüfauswahl folgt den geänderten Speicher-, Handle- und UI-Grenzen; keine vollständige Testsuite.

## Zwischenfehler und Korrekturen

Der erste Unitlauf (Exit 1) fand bisherige SQL-Revisionsanzeigen im Sollwert und eine nicht normalisierte Testkopie vor dem Unveränderlichkeitsvergleich. Der neue Vertrag entfernt die sichtbare technische Revision; R wird separat weiter geprüft. Der anschliessende Lauf bestand 51/51.

Der erste neue UI-Lauf (Exit 1) verwendete einen mehrdeutigen Toolbarselektor und erwartete BIGINT, obwohl die bestehende CSV-Inferenz INTEGER liefert. Selektor und neue Testannahme wurden berichtigt; kein fachlicher Goldenwert geändert.

Die strengere mobile Sichtprüfung fand einen verdeckten Schemakopf. Eine Zwischenrefaktorierung hatte zudem die JSX-Variable im falschen Scope (UI Exit 1, Typecheck Exit 2). Das Panel steht jetzt tatsächlich separat über dem Editor. Abschliessende UI-Prüfung bestanden; Screenshots visuell geprüft. Der unveränderte MediaQuery-Hook wurde danach für den Modulgrenzenvertrag in die UI-Schicht verschoben, gefolgt von Typecheck/Lint/Build.

Lint-Zwischenläufe (Exit 1) fanden den Domain-Parameternamen `document`, direkte Browserzugriffe im Feature und einen fehlerhaft angepassten Testselektor. Benennung, UI-Schicht und bedingte SQL/R-Testlokatoren korrigiert; abschliessend Typecheck und Lint Exit 0. Keine Disable-Kommentare, gelöschten oder deaktivierten Tests.

## Visuelle Nachweise und Grenzen

[SQL aktuell](screens/sql-current.png), [Schema 1440](screens/sql-schema-1440.png), [Schema 1280](screens/sql-schema-1280.png), [Schema 390](screens/sql-schema-390.png), [Tertiary-Hover](screens/tertiary-hover.png). Historische Nachweise wurden erhalten; neue Bilder liegen ausschliesslich in diesem Abschnitt.

**Nicht ausgeführt:** vollständiges `npm run verify`, vollständige Unit-/Integrations-/E2E-Suiten, Firefox-/WebKit-/Deploymentmatrix, nativer Safari-Pilot oder Ressourcenbenchmark. Diese Lieferung ist keine erneute V1-Releaseabnahme. Bestehende Format-1-Projekte und -Archive sind absichtlich inkompatibel; keine Datenmigration und keine automatische Browserdatenlöschung.

Die zwischenzeitliche Nutzeränderung an `AGENTS.md` blieb unangetastet. Keine Veröffentlichung, kein Push und kein Commit. Nächster konkreter Schritt: Nutzung der neuen SQL-Bedienung und Aufnahme der nächsten gewünschten UX-Anpassungen.
