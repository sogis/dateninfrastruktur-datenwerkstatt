# SQL-Dokumente statt Versionen — 25. Oktober 2026

Basisrevision `71defb1` plus uncommittierter Arbeitsbaum; [Quell-/Test-/Fixturehashes](source-sha256.txt). Node 22.23.1, npm 11.18.0, Playwright 1.63.0 / Chromium 153.0.8010.12. Keine neue V1-Gesamtabnahme.

## Geliefert

- Speichern/Cmd+S und Autosave sichern den aktuellen SQL-Text derselben Analyse. Laden öffnet aktive SQL-Dokumente des Projekts mit eigenen Texten, Parametern, Cursor- und Undo-Zuständen; kein impliziter Lauf. Übersicht-Umbenennen/Duplizieren/Archivieren und Ergebnisaufbewahrung bleiben erhalten.
- SQL-Datei öffnen/herunterladen unter Weitere Aktionen. UTF-8-.sql bis 1 MiB, neue Analyse mit Dateiname/Code in einer Mutation, leere Parameter/Inputs. Einlese-/Validierungsfehler und verspätete Antworten nach Navigation erzeugen keinen Eintrag. Download enthält aktuellen Text auch bei Speicherfehlern.
- SQL-Versionssammlung, Dialoge, Typen/Servicefunktionen, Validator-/Remapping-/Unveränderlichkeitsregeln vollständig entfernt. `createAnalysis` nimmt optional Initialname/Code entgegen. **Projektformat 3**, keine Migration; alte Formate 1/2 werden abgelehnt, nicht gelöscht. Archivhülle weiter Version 1; Katalog-/Runtimeverträge unverändert.
- Lesemodus lässt Dokumentauswahl und SQL-Download zu; Speichern und Dateieinlesen bleiben deaktiviert. SPEC, aktuelle Abnahmen, Plan, Designsystem, bekannte Grenzen und synthetische Fixtures einschliesslich Beispielarchiv aktualisiert. Keine neue Dependency.

Relevante Dateien: Domainvertrag und Workspacevalidator, `workspaceService.ts`/Archiv/Remapping, `sqlDocument.ts`, `SqlDocuments.tsx` und `SqlWorkbench.tsx`. REQ-016/019/034/062/067/068; AT-005/007/054/055/058/059.

## Tatsächlich ausgeführte Checks

| Befehl / Auswahl | Ergebnis |
| --- | --- |
| `npm run typecheck` | Exit 0, [Log](typecheck.log) |
| `npm run lint` | Exit 0 einschliesslich Modulgrenzen, [Log](lint.log) |
| `npm run build` | Exit 0, Assets/Lizenzen; bekannte Chunkgrössenwarnung, [Log](build.log) |
| `npm run test:unit -- tests/unit/sql-document.test.ts tests/unit/sql-workbench.test.ts tests/unit/archive.test.ts tests/unit/workspace.test.ts tests/unit/csv-import-options.test.ts` | Exit 0, 34/34, [Log](unit.log) |
| Hauptlauf unten | Exit 1: 7/8 bestanden; eine falsche neue Undo-Testannahme, [Log](browser.log) |
| Gezielter Undo-Diagnoselauf | Exit 1 mit derselben falschen Annahme; [Log](undo-debug.log) |
| Gezielter korrigierter Undo-Fall | Exit 0, 1/1, [Log](undo.log) |
| Abschliessender verstärkter Dokument-/Dateilauf unten | Exit 0, 2/2: zusätzlich Autosave/Reload, Cursor, leere Importparameter und Ausschluss archivierter/R-Analysen, [Log](final.log) |

Hauptlauf (fünf UI-Fälle, drei echte DuckDB-/IndexedDB-Integrationsfälle):

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts tests/e2e/sql-documents.spec.ts tests/e2e/write-access.spec.ts tests/integration/sql-workbench.spec.ts --grep 'SQL documents:|overview rename|SQL workbench: SQL documents|SQL format break|held retry keeps the SQL reader' --project=chromium --reporter=list --output=test-results/sql-documents
```

Abschliessende Dokument-/Dateifälle:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts tests/e2e/sql-documents.spec.ts --grep 'SQL documents: save|failed saves retain' --project=chromium --reporter=list --output=test-results/sql-documents-final
```

Undo-Einzelläufe verwenden `tests/e2e/sql-workbench.spec.ts --grep 'save and load independent'` mit denselben Chromium-/Reporteroptionen und Ausgabeordnern `test-results/sql-documents-undo-debug` beziehungsweise `test-results/sql-documents-undo`.

Insgesamt **acht unterschiedliche Chromiumfälle bestanden**, die Wiederholungen zählen nicht als zusätzliche Fälle. Die 34 Units prüfen Dateigrenze/UTF-8/Texttreue, atomare Dokumenterstellung, Speicherfehlerretry, unveränderte Retention, Remapping und aktuelle/abgelehnte Projekt-/Archivformate. Reale Browserfälle prüfen Text-/Cursor-/Undo-Wechsel, keine automatische Ausführung, Autosave/Reload, Download bei fehlgeschlagenem Speichern, alle Dateifehler, verspätetes Lesen, Lesemodus und Archiv mit aufbewahrtem Ergebnis. IndexedDB und Restebereinigung überspringen beide Altformate und erhalten deren Bytes.

## Zwischenfehler und Grenzen

Der erste neue Undo-Test erwartete, dass einmal Undo eine vollständig getippte SQL-Zeile zurücknimmt. Die Diagnose zeigte erhaltene Modelle und wortweise gruppierte Undo-Schritte in Monaco. Der Test ändert nun ein einzelnes Zeichen und prüft dessen Undo nach Dokumentwechsel sowie den eigenen Cursor; Produktions-Undo wurde nicht verändert. Eine Test-Mockstelle verwendete zunächst einen durch ESLint verbotenen `this`-Alias; durch lexikalisches `this` ersetzt. Keine Disable-Kommentare, deaktivierten Tests oder geänderten fachlichen Goldenwerte.

[SQL-Arbeitsfläche](screens/sql-documents.png), [Dokumentauswahl](screens/sql-document-list.png). Beide Screenshots visuell geprüft. Historische Prüfnachweise unverändert.

**Nicht ausgeführt:** komplette Unit-/Integrations-/E2E-Suiten, `npm run verify`, Firefox-/WebKit-/Deploymentmatrix, nativer Safari-Pilot und Ressourcenbenchmarks. Auswahl auf Dokument-/Datei-/Formatgrenzen und ihre Abhängigkeiten begrenzt. Kein bekannter Blocker im beauftragten Umfang. Bestehende Projektformate 1/2 sind absichtlich inkompatibel. Kein Commit/Push, keine Migration oder Browserdatenlöschung.
