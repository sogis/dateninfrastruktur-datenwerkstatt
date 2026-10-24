# Einstellungen im geöffneten Projekt

24. Oktober 2026. Ausgangsrevision `d52281463aaf10281c31fee94c922f2339acc40a`,
uncommittierter Arbeitsbaum. Der geprüfte Quell-, Konfigurations- und Teststand
ist durch [222 SHA-256-Werte](source-fingerprint.json) bezeichnet. Node 22.23.1,
npm 11.18.0; [Browser-Versionen](browser-versions.json): Chromium 153.0.8010.12,
Firefox 155.0, WebKit 26.6.

## Gelieferter Umfang

REQ-059/060/064, Regression zu REQ-020/067 und AT-012/055/057/058:

- Neue Route `/projects/:workspaceId/settings` unter dem bestehenden Provider.
  Einstellungen erhält Sitzung, acht Navigationsaktionen und die Writer-Lease.
  Ein gemeinsamer Einstellungsinhalt mit Projektverweis erklärt browserweite
  Gültigkeit. `/settings` bleibt der explizite globale Einstieg.
- Interne Navigation erhält ungesicherte Entwürfe auch bei Speicherfehlern.
  Tatsächliches Verlassen über Projekte bleibt bei erfolglosem Flush blockiert.
- R-Aktivierung wartet bei Rückkehr auf den freien Scheduler. SQL-/R-Läufe werden
  nicht neu gestartet; Modelle, Undo/Cursor, Resultate und R-Scope bleiben erhalten.
- Persönliche Optionen wirken bei Rückkehr im Editor; ein geänderter
  Seitenleistenstandard überschreibt keine gespeicherte Projektansicht.
- Vorhandene Bereinigung schützt aktive und gespeicherte Projekte. Der Test
  schreibt drei echte OPFS-Dateien: aktive und gespeicherte Bytes bleiben,
  ausschliesslich die verwaisten Bytes werden entfernt.
- Caddy erlaubt die neue Unterroute und hält die Grenzen für unbekannte Routen
  und fehlende Assets ein. Ein Seitenumbruch verhindert den nachgewiesenen
  Überlauf bei 390 px und ausgeklappter Navigation.

Produktänderungen: Router, RWorkbench, App-CSS und statische Routenfreigabe.
Neue echte Browserfälle in `tests/e2e/project-settings.spec.ts` und
`tests/deployment/project-settings.spec.ts`; bestehende Navigation,
Metadatenspeicherfehler und statische UI-Assets angepasst. SPEC, Abnahmetests,
Designsystem und Implementierungsplan sind nachgeführt. Keine Dependency-,
Domain-, Speicher- oder Archivformatänderung.

## Tatsächliche Prüfungen

Alle unten genannten abschliessenden Prozesse endeten mit Exit 0. Keine Skips oder automatischen Wiederholungen in den erfolgreichen Läufen.

| Prüfung | Tatsächlicher Stand / Beleg |
| --- | --- |
| `DW_REUSE_DEV_SERVER=1 npm run verify` | Exit 0; 110/110 Unit, 67/67 Integration, 90/90 UI einschliesslich Golden Path, [Log](verify.log) |
| Typecheck | Exit 0, [abschliessendes Log](typecheck-final.log) |
| Lint und Modulgrenzen | Exit 0, [abschliessendes Log](lint-final.log) |
| Gezielte Units | Exit 0, 4/4; `npx vitest run scripts/deployment.test.mjs tests/unit/workspace-view.test.ts`, [Log](unit-focused.log) |
| Formatierung der geänderten Quellen, Tests, SPEC, Abnahmetests und Plan | Exit 0, [Log](format-final.log) |
| Neue Einstellungsfälle in Chromium/Firefox/WebKit | Exit 0, 15/15; [Log](browser-matrix-final.log) |
| Statische Deploymentprüfung | Exit 0, 18/18, [Log](deployment.log) |

Reproduzierbare Hauptbefehle:

```sh
DW_REUSE_DEV_SERVER=1 npm run verify
DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 npx playwright test tests/e2e/project-settings.spec.ts --reporter=list --output=/tmp/datenwerkstatt-project-settings-final
DW_REUSE_TEST_PORTAL=1 npx playwright test -c playwright.deploy.config.ts tests/deployment/project-settings.spec.ts tests/deployment/static.spec.ts --grep 'Project settings static route|UI assets' --reporter=list --output=/tmp/datenwerkstatt-project-settings-deployment
```

Die Reuse-Variablen gelten nur für den bereits laufenden identischen lokalen
Vite-Kandidaten und den synthetischen Testportalserver. Ohne vorhandene Server
startet Playwright die konfigurierten Prozesse selbst. Statische Tests bauen und
starten echte Caddy-Container: Root/PostMessage, `/lab/`/PostMessage und
`/lab/`/auto, jeweils mit nicht privilegierter UID und schreibgeschütztem Root.

## Zwischenfehler und fachliche Testanpassungen

- Der erste Typecheck endete Exit 2: ein Test verwendete `Node.remove()`.
  Durch `parentNode.removeChild()` ersetzt; abschliessender Typecheck Exit 0.
- Erster gezielter Chromiumlauf: **3/7, Exit 1** ([Log](chromium-first.log)).
  Tastaturmodalität vor Fokus explizit hergestellt; SQL-Zellen statt
  unterschiedlich serialisiertem Tabellen-`innerText` verglichen. Die
  Langläufe warten auf den tatsächlich veröffentlichten Status `running`.
- Wiederholung: **3/4, Exit 1** ([Log](chromium-retry.log)). Echter 390px-Überlauf
  mit ausgeklappter Seitenleiste; Umbruch ergänzt. Anschliessend Layout und
  erweiterte echte Bereinigung **2/2, Exit 0** ([Log](chromium-responsive.log)).
- Erster Dreierlauf: **17/21, Exit 1** ([Log](browser-matrix.log)). Drei
  Firefoxfälle prüften Monacos vor Fokus verborgene Texteingabe. Der Helfer
  fokussiert jetzt den sichtbaren Editor wie die bestehenden Tests. WebKit
  benötigte nach echtem R-Abbruch länger als zehn Sekunden für die neue Runtime;
  der Test erlaubt jetzt das bestehende 60-Sekunden-Startbudget und fordert
  danach eine echte erfolgreiche Folgeausführung.
- Die bisherigen Erwartungen auf `/settings` und drei Navigationseinträge wurden
  für Projektaufrufe auf die neue Unterroute und acht Einträge geändert. Der
  Speicherfehlerfall testet das blockierte Verlassen nun über Projekte und
  zusätzlich den erlaubten internen Einstellungswechsel bei demselben Fehler.
  Kein Schutztest wurde entfernt oder deaktiviert; keine Goldenwerte geändert.
- Ein früher vollständiger Markdown-Formatcheck meldete vorhandene
  Tabellenformatierung im Designsystem. Keine sachfremde Umformatierung übernommen;
  der abschliessende Formatcheck benennt seinen tatsächlichen Dateiumfang.

[Erste Fehlerkontexte und das 390px-Vorherbild](initial-failures/) bleiben erhalten.
27 geänderte historische Artefakte wurden nach Sicherung der neuen Ergebnisse
auf ihre ursprünglichen Bytes zurückgesetzt; acht neu erzeugte Bilder in alten
Belegordnern wurden ebenfalls hierher verschoben. Neue Regressionsergebnisse
stehen getrennt unter [regression-rerun/](regression-rerun/).
Der abschliessende Hashvergleich bestätigte alle 222 Quelldateien unverändert
zum finalen Fingerprint.
Die erneuten Browserläufe ändern ausschliesslich Testmechanik und Wartebudget;
Produktquellen bleiben dabei unverändert.

## Sichtprüfung und Grenzen

Die zwölf neuen Einstellungen-Screens bei 1440/1280/390 px und 200 % Text wurden
im Dreiervergleich visuell geprüft. [Screenshots](screens/) enthalten zusätzlich
neun statische Ansichten. Keine Überlagerung oder horizontales Abschneiden;
bei 390 px und bewusst ausgeklappter Leiste umbrechen lange Wörter.

Kein neuer nativer Safari-/VoiceOver-Pilot, keine vollständige Firefox-/WebKit-
Abnahme aller Altfunktionen und keine neue V1-Releaseabnahme. WebKit ist kein
Nachweis eines nativen Safari-Piloten. Die bestehende Editorchunk-Warnung bleibt.
Kein Push und keine Veröffentlichung.

Für den Commit wurden ausschliesslich nachgestellte Leerzeichen und zusätzliche
Leerzeilen am Ende generierter Logs/Fehlerkontexte normalisiert. Befehle,
Exitcodes, Fehler und Messdaten bleiben erhalten.
