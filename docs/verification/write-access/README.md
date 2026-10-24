# Schreibschutz und Schreibrecht erneut anfordern

24. Oktober 2026 · REQ-020/REQ-076 · AT-012/AT-065.

Ausgangsrevision: `472385c`; geprüft wird der Arbeitsbaum mit den bestehenden,
separaten XLSX-Änderungen. Es wird keine uncommittete Änderung als Gitrevision
ausgegeben. Die Quellhashes des geprüften Arbeitsbaums stehen in
`source-fingerprint.json`.

## Verhalten

- Ein belegter Lock und fehlende Web Locks haben unterschiedliche Lesergründe.
  Der Hinweis bleibt unabhängig vom Speicherstatus sichtbar. Ohne Web Locks gibt
  es keinen wirkungslosen Wiederholungsbutton.
- Die erneute Anforderung zeigt Busy, weiterhin belegt, dreisekündigen Erfolg
  oder einen dauerhaften Fehler mit aufklappbaren Details. Tastaturfokus wird
  erhalten, bewusste Fokusbewegungen werden nicht rückgängig gemacht.
- Bei weiterhin belegtem Recht bleibt dieselbe Lesesitzung mit derselben
  Ansicht erhalten. Erst eine erfolgreich erworbene Lease und ein geladener
  aktueller Projektstand erlauben die neue Schreibsitzung. Fehler und überholte
  Versuche geben unveröffentlichte Leases frei.
- Projektwechsel brechen laufende Anforderungen ab. Eine überholte Antwort
  öffnet kein vorheriges Projekt. Eine erfolgreiche Übernahme behält die aktuelle
  SQL-/R-Unterseite bei.
- Der Ansichtscontroller bleibt bei einem Sitzungswechsel desselben Projekts
  erhalten. Seine Initialisierung wird einmal ausgeführt, sodass React StrictMode
  geöffnete Analysen und lokale Seitenleistenänderungen nicht nachträglich mit
  einem zweiten Leseergebnis überschreibt. Neue Controller laden weiterhin den
  gespeicherten Stand. Editor-Autofokus braucht keine Sonderregeln.
- Diagnose und Bericht enthalten Lesergrund, Web-Locks-Unterstützung sowie
  Ergebnis/Zeitpunkt des letzten Versuchs. Diese Felder sind Sitzungszustand;
  Projekt- und Archivformat bleiben unverändert. Der Bericht enthält keine
  zusätzlichen Fehlermeldungstexte oder Tabellenwerte.

## Prüfungen

Node **22.23.1**, npm **11.18.0**, Playwright **1.63.0**; gebündelte Browser
Chromium **153.0.8010.12**, Firefox **155.0**, WebKit **26.6**.

Die gezielte Matrix ist mit **Exit 0, 39/39**, je 13 Fälle pro Browser, bestanden;
keine übersprungenen, unerwarteten oder als flaky klassifizierten Fälle.
[Vollständiges Log](browser-matrix.log), [JSON-Ergebnis](browser-matrix.json).
Der letzte fokussierte Chromium-Reparaturlauf bestand mit **Exit 0, 11/11**:
[Log](final-repair.log). Die abschliessende Gesamtprüfung bestand mit **Exit 0**:
Typecheck, ESLint/Modulgrenzen, **110/110 Unit**, Build/Assets/Lizenzen,
**67/67 Integration** und **85/85 UI** in Chromium:
[vollständiges Log](verify.log). Darin sind 16 neue Lock-/Sitzungs- und zwei
neue Ansichtsinitialisierungs-Unitfälle enthalten. Der bestehende XLSX-Umfang
wurde mitgeprüft und nicht zurückgesetzt.

```sh
DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 npm run verify
write_access_output=$(mktemp -d "${TMPDIR:-/tmp}/datenwerkstatt-write-access-matrix.XXXXXX")
DW_REUSE_DEV_SERVER=1 DW_REUSE_TEST_PORTAL=1 PLAYWRIGHT_JSON_OUTPUT_FILE=docs/verification/write-access/browser-matrix.json node node_modules/@playwright/test/cli.js test tests/e2e/write-access.spec.ts tests/e2e/multitab.spec.ts tests/e2e/workspaces.spec.ts tests/e2e/required-fields.spec.ts tests/integration/recovery.spec.ts tests/e2e/navigation.spec.ts --grep 'AT-012|AT-065|Required fields: read-only|write-access reason|Navigation: settings follow' --project=chromium --project=firefox --project=webkit --output="$write_access_output" --reporter=list,json
```

Der vorhandene Vite-Server auf 4173 wurde wiederverwendet; für die abschliessenden
Läufe wurde `node tests/portal/server.mjs` separat auf 4174 gestartet. Die
Ausgabeordner der parallel geprüften Browserprofile sind voneinander getrennt.
Der tatsächliche temporäre Matrix-Ausgabeordner ist in `matrix-output-path.txt`
festgehalten. `verify.log` enthält die Gesamtprüfung.

Alle zwölf [Layoutscreenshots](screens/) bei 390/1280/1440 Pixeln und 200 %
Textgrösse (Root-Schriftgrösse, kein Browserzoom) wurden visuell geprüft:
kein horizontaler Überlauf, Bedienelemente und Meldungen lesbar. Die 200-%-Bilder
von Chromium/WebKit zeigen den Tastaturfokus; das Firefox-Bild allein belegt
keinen sichtbaren Fokusring. Die automatisierten Fokus- und Tastaturprüfungen
bestehen in allen drei Browsern. 25 von alten Tests neu erzeugte historische
Prüfbilder/Messwerte wurden aus der vor der Prüfung angelegten Kopie
wiederhergestellt; acht neu erzeugte zusätzliche Altprüfbilder wurden lokal
ausserhalb des Repositories gesichert. Keine Sollwerte wurden geändert.
`git diff --check` und die abschliessende Quellhashprüfung bestanden mit
**Exit 0**; alle 219 erfassten Quell-/Konfigurations-/Testdateien blieben während
der abschliessenden Prüfung unverändert.

## Erstfehler und Reparaturen

Logs, Fehlerkontexte und Screenshots bleiben hier erhalten. Die vier binären
Erstfehler-Traces (zusammen rund 36 MiB, einschliesslich geladener R-Runtime)
liegen zusätzlich im lokalen temporären Ordner aus `initial-traces-path.txt`.

- Erster `verify`-Lauf: **Exit 1**, 108 Unit- und 67 Integrationstests bestanden,
  80/84 UI bestanden. Ein verborgenes inaktives Hinweisselement verletzte den
  bestehenden Geometrievertrag; SQL/R verloren nach Erfolg den Fokus; ein langer
  Projektname lief bei 200 % über. [Log](verify-initial.log),
  [Navigationsevidenz](initial-navigation-failure/), [weitere Evidenz](initial-failures/).
- Erster fokussierter Lauf: **Exit 1, 8/10**. Layout repariert, Fokus weiterhin
  verloren: [Log](repair.log). Ereignisprotokollierung ohne produktive Logänderung
  wies nach, dass Monaco nach der Bestätigung erneut fokussierte.
- Nach Erhalt des Ansichtscontrollers: **Exit 1, 9/11**. Erfolgs- und bewusst
  bewegter Fokus bestanden; die zusätzlich geprüfte Seitenleiste klappte noch
  ein: [Log](focus-repair.log). Nachgewiesen wurde eine doppelte asynchrone
  Initialisierung, deren zweites Ergebnis die bereits geöffneten Analyse-IDs
  überschrieb. Die einmalige Initialisierung und zwei Unit-Regressionen beheben
  diese Ursache.
- Erste parallele Matrix: **Exit 1, 38/39**. Der eine Fehler war ein fehlendes
  Playwright-Trace-Artefakt beim Context-Close, weil der Matrixordner innerhalb
  des von `verify` geleerten `test-results/` lag. Kein fachlicher Sollwert wurde
  geändert. [Log](browser-matrix-initial.log), [JSON](browser-matrix-initial.json),
  [Fehlerdetails](matrix-output-collision.md). Die vollständige Wiederholung in
  einem unabhängigen temporären Ordner bestand mit **39/39**.

## Grenzen

Keine erzwungene oder automatische Übernahme, kein Browserdatenlöschen, keine
neue Dependency. Die ursprünglich gemeldete anhaltende Safari-Sperre ist nicht
eindeutig reproduziert; die verbesserte Diagnose weist künftig den tatsächlichen
Lesergrund aus. Eine Safari-Beobachtung ersetzt nicht die Browsermatrix und
belegt keine Ursache der früheren Sperre. Kein neuer vollständiger nativer
Safari-/VoiceOver-Pilot, keine vollständige Firefox-/WebKit-Abnahme sämtlicher
Altfunktionen und keine neue V1-Releaseabnahme.

Für den nachfolgenden Commit wurden ausschliesslich nachgestellte Leerzeichen
in Terminal-Logs und Fehlerkontexten entfernt. Prüfausgänge und Quellcode
bleiben unverändert. Die separat vorhandenen XLSX-Änderungen gehören nicht
zum Schreibschutz-Commit; die Gesamtprüfung bezog sie im Arbeitsbaum ein.

Zusätzlich wurde der abgegrenzte Git-Indexstand in ein temporäres Verzeichnis
exportiert und ohne die separaten XLSX-Änderungen geprüft:
`npm run typecheck` **Exit 0**, `npm run test:unit` **Exit 0, 94/94**.
Die oben dokumentierte Gesamtprüfung bleibt der Nachweis des gesamten damaligen
Arbeitsbaums einschliesslich XLSX.
