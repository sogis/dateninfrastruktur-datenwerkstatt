# SQL-Ergebnisbereich und Speicherpunkt — Prüfbericht

24. Oktober 2026; Basisrevision `6c3b44d151079242b33f75db7534cd2f813ab4c0` plus uncommittierter Arbeitsbaum; [Quell-/Testhashes](source-sha256.txt). Node 22.23.1, npm 11.18.0, Playwright 1.63.0, Chromium 153.0.8010.12. Gezielter Anschluss an den vorherigen SQL-Aufräumabschnitt, keine neue V1-Gesamtabnahme.

## Geliefert

- Eine Ergebnisaktionszeile; Zeilenzahl/Laufzeit/Paging unten. Keine dauerhaften Format-, Vollständigkeits- oder Retentionsmetadaten im Ergebniskopf. Fehler, Kürzung, geänderter Arbeitsstand und Details bleiben erreichbar. CSV/XLSX zeigen den passenden Hinweis vor dem Download im Dialog; begrenztes Parquet ebenso. Vollständige Exporte behalten ihren bestehenden Datenpfad.
- Dichte JetBrains-Mono-Tabelle nach Sodata, logischer Typ neben Spaltenname, sticky Kopf/Zeilennummern und bestehende Sortierung. Normaler Analysename, keine aktive-Zeile-Hervorhebung. Beide Panelgriffe bedienbar; Schema-Breitenanteil separat gespeichert und rücksetzbar.
- Modellgebundene SQL-/DuckDB-Completion aus aktuellen aktiven Tabellen/Spalten, `data`-Namespace, korrektes Quoting und Code-Undo. Keine Engineabfrage, neue Dependency oder Alias-/CTE-Auflösung. SQLRooms-MIT-Quelle in `licenses/sqlrooms-sql-editor-0.28.0.md`.
- Konstanter Speicherpunkt unten links mit Tooltip/Statusdialog, Wiederholung und Beibehalten. Grün nur dauerhaft gespeicherte Metadaten; Orange für ungesichert/laufend/Fehler/Sitzungsmodus. Erfasste Speicherfehler werden nicht zusätzlich als globales Banner ausgegeben.

Projektformat 2 bleibt unverändert. `WorkspaceViewState.sqlSchemaFraction` ist die einzige Vertragserweiterung; Default 0.25 für bestehende Ansichtsdatensätze. REQ-019/034/041/044/046/048/062/066/067, AT-005/007/027/032/049/055/058.

## Tatsächlich ausgeführte Prüfungen

| Befehl / Auswahl | Ergebnis |
| --- | --- |
| `npm run typecheck` | Exit 0, [Log](typecheck.log) |
| `npm run lint` | Exit 0 einschliesslich Modulgrenzen, [Log](lint.log) |
| `npm run build` | Exit 0, Assets/Lizenzen vollständig; bestehende Chunkgrössenwarnung, [Log](build.log) |
| `npm run test:unit -- tests/unit/sql-completion.test.ts tests/unit/workspace-view.test.ts` | Exit 0, 6/6, [Log](unit.log) |
| Hauptlauf unten | Exit 0, 11/11, [Log](ui.log) |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/action-buttons.spec.ts --grep 'connected geometry' --project=chromium --reporter=list --output=test-results/sql-results-buttons` | Exit 0, 1/1, [Protokoll](buttons.log) |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts tests/e2e/ui-texts.spec.ts --grep 'SQL results:|real SQL status hierarchy' --project=chromium --reporter=list --output=test-results/sql-results-visual` | Exit 0, 2/2 nach konsistenter vergrösserbarer Tabellenkopf-/Zellschrift, [Log](visual.log) |
| `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/imports.spec.ts tests/e2e/multitab.spec.ts --grep 'denied OPFS|absent Web Locks' --project=chromium --reporter=list --output=test-results/sql-results-modes` | Exit 0, 2/2: Orange im Sitzungsmodus, Grün im Lesemodus, [Log](modes.log) |

Hauptlauf:

```sh
DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts tests/e2e/sql-completion.spec.ts tests/e2e/sql.spec.ts tests/e2e/xlsx.spec.ts tests/e2e/projects.spec.ts tests/e2e/ui-texts.spec.ts --grep 'SQL cleanup:|SQL results:|SQL exports:|SQL completion uses|AT-022 AT-027|XLSX SQL UI|save indicator stays|failed unpublished change|failed metadata save|real SQL status hierarchy' --project=chromium --reporter=list --output=test-results/sql-results-ui
```

Insgesamt **14 unterschiedliche Chromiumfälle**, dazu zwei gezielte visuelle Wiederholungen nach relevanter Schriftkorrektur und eine verstärkte Resetprüfung. Die Auswahl deckt vollständigen CSV/XLSX-Export nach Paging, keine Ausführung durch Completion/Sortierung, Schema-/Resultatgrösse samt Reload, Speicherfehler/Retry und konstante Geometrie ab.

Zusätzliche Resetprüfung: `DW_REUSE_DEV_SERVER=1 npx playwright test tests/e2e/sql-workbench.spec.ts --grep 'overview rename' --project=chromium --reporter=list --output=test-results/sql-results-reset` — **Exit 0, 1/1**, [Log](reset.log). Nach verändertem und wieder geladenem Layout stellt Reset sichtbar 25 % Schemabreite und 45 % Editorhöhe her, ohne Dokumentänderung. `npx eslint tests/e2e/sql-workbench.spec.ts` danach **Exit 0**.

## Zwischenfehler, Bilder und Grenzen

Der erste Speicher-UI-Lauf des Teilagenten bestand 1/3 (Exit 1): zwei neue Testassertionen waren falsch (programmgesteuerter Fokus ohne Tastaturmodalität löst bewusst keinen Tooltip aus; alter zustandsabhängiger Locator nach erfolgreichem Beibehalten). Auf echte Tabfolge und stabilen Locator korrigiert; alle drei Fälle im Hauptlauf bestanden. Keine Tests deaktiviert oder fachlichen Goldenwerte geändert.

[Ergebnistabelle](screens/sql-table.png), [Schema 1280](screens/sql-schema-1280.png), [Schema 390](screens/sql-schema-390.png), [200 % Text](screens/sql-text-200.png). Die Screenshots wurden visuell geprüft. Historische Nachweise bleiben unverändert.

**Nicht ausgeführt:** vollständige Unit-/UI-/Integrationssuiten, `npm run verify`, Browser-/Deploymentmatrix, nativer Safari-Pilot oder Benchmark. Die Änderung betrifft UI/Editorvorschläge und verwendet bestehende Engine-/Exportpfade. Keine zusätzliche Enginevalidierung für unveränderte Codec-/Abbruchverträge. Bestehende Chunkgrössenwarnung bleibt; kein bekannter Blocker im beauftragten Umfang. Kein Commit, Push, Paketupgrade oder Eingriff ins Quellportal.
