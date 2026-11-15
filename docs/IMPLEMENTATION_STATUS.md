# Implementierungsstatus

Die [Spezifikation](../SPEC.md) und der [Abnahmekatalog](../ACCEPTANCE_TESTS.md)
sind verbindlich. Das [Designsystem](DESIGN_SYSTEM.md) ist die aktuelle
Gestaltungsreferenz. P0–P8 und der Safari-Pilot wurden historisch im
Testprofil technisch abgenommen. Die [Abnahmematrix](ACCEPTANCE_STATUS.md)
und die [Releasecheckliste](RELEASE_CHECKLIST.md) dokumentieren den damaligen
Prüfstand und die offenen produktiven Portal- und Ingressvoraussetzungen.

Der [historische Implementierungsverlauf](https://github.com/sogis/dateninfrastruktur-datenwerkstatt/blob/87b25af0f05171166483da2b44e11b88e3b3301d/docs/IMPLEMENTATION_STATUS.md)
und die [damaligen Prüfbelege](https://github.com/sogis/dateninfrastruktur-datenwerkstatt/tree/87b25af0f05171166483da2b44e11b88e3b3301d/docs/verification)
sind über die Basisrevision archiviert. Neue lokale Rohbelege unter
`docs/verification/` und Playwright-Ausgaben werden ignoriert.

## DW-R1, R0

Basisrevision `87b25af0f05171166483da2b44e11b88e3b3301d`.
REQ-049, REQ-072–075 und REQ-077–080 im Bereich Paketinstallation, Build
und CI. Die Prüfungen decken Teile von AT-069/070 ab. `scripts/mirrorWebRPackages.mjs` stellt
den Spiegel anhand eines festen Index, exakter Archiv-URLs und SHA-256
bereit. `.github/workflows/verify.yml` trennt statische, funktionale und
Deployment-Prüfungen. Aktuelle Screenshots und Traces liegen in den
Ausgaben des jeweiligen Testlaufs.

`npm ci` im frischen Checkout, erste und wiederholte Assetvorbereitung,
`npm run build`, Typecheck, Lint und Unit-Tests liefen mit Exit 0. Die
ursprüngliche Assetvorbereitung reproduzierte den bit64-Versionsfehler
mit Exit 1. Die fehlende bit64-Datei wurde bytegenau wiederhergestellt.
Ein absichtlich beschädigtes Archiv führte zur erwarteten
Checksum-Fehlermeldung. Der echte Pakettest `tests/integration/r-packages.spec.ts` bestand mit
Exit 0 in Chromium, Firefox und WebKit. Vollständige Suiten und Safari
gehören zur abschliessenden Abnahme.

Nächster Schritt ist das unabhängige Review von R0. Der veröffentlichte
Actions-Lauf zur Basisrevision war fehlgeschlagen. Ergebnisse eines
Remote-Laufs für den Kandidaten stehen aus.

R0 wurde für `4bdbdff8d5f29125ed823422a4228a3131f13a86` unabhängig
abgenommen. Der Linux-Containerbuild und drei gezielte Chromium-
Deploymentfälle unter `/lab/` bestanden mit Exit 0. Die
Nacharbeit weist zusätzliche Dateien im webR-Spiegel zurück.
Der alte Fixtureprüfer erwartet auf Basis und Kandidat Format 1
und scheitert deshalb nach erfolgreicher Anforderungs- und Linkprüfung.

## DW-R1, R1 in Arbeit

`SqlRoomsSqlEngine.readPage` liest die VARCHAR-Projektion positionsgenau
aus den Arrow-Vektoren. REQ-038, REQ-042–045 und AT-025/027–032. Der
gezielte Chromium-Lauf für exakte Darstellung, Limits und echte
Worker-Beendigung bestand 2/2. Die Messung für breite Seiten und die
unabhängige Abnahme von R1 stehen als eigener Phasenabschluss aus.

R1 wurde unabhängig für `3d3855855f4a38a979e7069d7eceb423f703da23`
abgenommen. Bei 100 × 200 Zellen sank der gemessene Median vom
Paging-Klick bis zur sichtbaren Seite von 2 685 ms auf 287 ms.
Die bisherige Byteprüfung bleibt nach einer isolierten
`send()`-Probe mit unbestätigter früher Beendigung im Einsatz.

## DW-R1, R2

Für `d94ba8f150dae2c2b8c029baca1bb4a98500434f` unabhängig abgenommen.
Die native Ergebnistabelle bleibt nach vier Prototypen im Einsatz.
Sticky-Kopf und Zeilennummern decken WebKit-Lücken ab. REQ-043/044/066/067,
AT-027/029/054/055. Gezielte Matrix je 9/9 in zwei Läufen, Chromium,
Firefox und WebKit, Exit 0. Typisierte Sortierung, breite Tabelle und
zuletzt angeforderte Seite sind durch echte Browser-/Engine-Tests belegt.

## DW-R1, R3

Die Architekturprüfung entfernte die aufruflosen Arrow-IPC-Adapter,
einen zweiten ungenutzten Import-Factory-Weg und historische
Unit-Tests gegen abgelöste Implementierungen. Die produktiven
Codec-, Worker-, Persistenz- und Importtests bleiben im Prüfumfang.
Der Paketprüfer verwendet Format 3 und das aktuelle Font-Inventar.
`python3 tools/verify-package.py` Exit 0. Die Resultate der lokalen Abnahme stehen unten.

### R3 Nachprüfung am Kandidaten `afaf8ba`

Die sechs Firefox-XLSX-Fehler der vorherigen Deploymentmatrix betrafen
die URL-Auswertung im Testmonitor nach dem Download. Der Monitor löst
relative Worker-URLs gegen die Seitennavigation auf. Der isolierte
Firefox-R-XLSX-Deploymenttest auf `582ae55` bestand mit Exit 0
(14,4 Sekunden Testdauer). Unter früherer paralleler Last wurde
auch ein echter Initialisierungstimeout beobachtet. Drei isolierte Kaltstarts auf `afaf8ba` bestanden (Exit 0, je
13,3–15,3 Sekunden einschliesslich XLSX-Prüfung) mit
`npm run test:deployment -- --project=firefox-1 tests/deployment/xlsx.spec.ts -g 'static R' --repeat-each=3 --reporter=list`.
Das Laufzeitlimit blieb bei 60 Sekunden.

`tests/deployment/xlsx.spec.ts` prüft vor dem R-Lauf den Leerlaufstatus
und das Wegfallen der Initialisierungsaktion. Die UI-Abnahmetests
`tests/e2e/p7-ui.spec.ts` und `tests/e2e/workspaces.spec.ts` prüfen
die Platzierung der SQL-Ergebniszusammenfassung und die konkrete
Speicherbestätigung. `git diff --check` Exit 0. Verify, Browser- und
Deploymentmatrix, Ressourcenprüfung und unabhängiges
Review sind unten dokumentiert.

### Lokale Abnahme auf `d5ee80a897a3e7e967fc8d9f02187db8fbb186d8`

- `npm run verify` Exit 0. Typecheck, Lint, Build, 119 Unit-Tests,
  71 Chromium-Integrationstests und 111 Chromium-E2E-Tests.
- `npm run test:browser-matrix -- --project=firefox --project=webkit`
  Exit 0, 142/142 zusätzlich zur Chromium-Integration aus Verify.
- `npm run test:deployment` Exit 0, 99/99 über drei Browser und drei
  statische Containerprofile. Alle Firefox-SQL/R-XLSX-Fälle bestanden.
- `npm run test:resources` Exit 0, AT-071. In 20 realen Workspace-/SQL/R-
  Zyklen blieben nach jedem Schliessen null Worker und null Handles.
  Die Transfers mit 10’000 und 100’000 Zeilen bestanden.
- `npx playwright test tests/e2e/p8-golden.spec.ts tests/e2e/p7-ui.spec.ts --project=firefox --project=webkit --output=/tmp/dw-r3-golden-ui --reporter=list`
  Exit 0, 10/10. Golden Path mit Prozessneustart und frischem Archivprofil
  sowie UI-Flächenvertrag, Fokus, Bedienung und Speicherung.
- Unabhängiges R3.14-Review für diesen lokalen Prüfumfang: abgenommen.

Die vollständige Firefox-/WebKit-E2E-Suite auf `c0ed8db` bestand
mit Exit 0, je 111/111 Fällen. Der Erstlauf endete mit Exit 1
und 219/222. Die Nacharbeit betrifft die browsergerechte Eingabe in
`tests/e2e/sql-documents.spec.ts`, `tests/e2e/action-buttons.spec.ts`
und `tests/e2e/projects.spec.ts`. Alle drei korrigierten Fälle bestanden
auch gezielt in Chromium. `npm run typecheck`, `npm run lint` und
`git diff --check` Exit 0.
Der entfernte CI-Lauf wurde nicht ausgeführt. Der native Safari-Pilot
prüfte diese Änderungen mit Tab-Reopen, Persistenz, Archiv und Cancel.
Ein kompletter nativer Safari-Prozessneustart wurde für diesen
Kandidaten nicht wiederholt. Kein Push oder Merge.

### Linux-CI-Nacharbeit in PR #1

Auf `97a97aa` bestand der statische Job. Der Chromium-
Integrationstest AT-012/015/017/061 traf beim ersten manuellen
Übernahmeversuch noch auf den Writer-Lock. Der Test wartet jetzt
auf die vom Browser gemeldete Freigabe und prüft dann unverändert
den manuellen Übernahmeweg und die Wiederherstellung.
Firefox scheiterte auf Ubuntu vor der Seitennavigation an einem
fehlenden Browserfenster; WebKit MiniBrowser brach bei der
Automationsinitialisierung ab. Die CI verwendet für diese Browser
einen virtuellen X11-Display, auch für direkt gestartete
persistente Profile. Deploymentfälle laufen seriell pro Browser auf
getrennten Runnern. Der Workflow prüft Feature-Branches im PR
und startet nach dem Merge zusätzlich auf main.

Lokal: `npm run typecheck`, `npm run lint`, `git diff --check`
und die sechs gezielten Recovery-/Profilisolationsfälle aller drei
Browser Exit 0. Linux-Nachweis folgt im PR-Workflow.

Der erste Linux-Nachlauf `43707504424` bestätigte das Chromium-
Deployment. Firefox und WebKit scheiterten beim OPFS-Aufräumen:
Der Test schloss erst das letzte Fenster und versuchte danach einen
neuen Tab zu öffnen. Die Bereinigung öffnet ihren Tab vor dem
Schliessen der Arbeitsseiten. Der gleiche Fensterwechsel beim
Import-Recovery wurde korrigiert. Sechs gezielte Fälle bestanden
damit im Linux-amd64-Playwright-Container ohne virtuellen Display.
Die CI nutzt wieder Headless. Für WebKit unter Linux bildet der
Test-User-Agent die Plattform des Runners ab, damit Monacos
Tastenkürzel zur Linux-Tastatur passen.

`f95b9b4`: Alle drei Deploymentjobs des Linux-Laufs `43708878725`
bestanden. Vier gezielte Linux-Fälle für SQL-Eingabe und Import-Recovery
bestanden im Playwright-Container. Die OPFS-Bereinigung überlässt
den letzten Tab dem Eigentümer des Browserkontexts, der ihn zusammen
mit dem Kontext schliesst.

WebKitGTK gab nativen Auswahlfeldern eine grössere intrinsische Höhe
als den benachbarten Eingabefeldern. Die gemeinsame CSS-Kontrollhöhe
gilt jetzt auch für native Auswahlfelder. Paint-Containment verhindert,
dass lange Auswahltexte den CSV-Dialog bei 200 % Schriftgrösse
horizontal vergrössern. Der Tooltip-Test prüft Tastaturfokus über
Vorwärtsnavigation. Die gezielten Linux-Fälle und 24 lokale
Browserfälle der betroffenen UI-Tests bestanden.

Die Folgeprüfung deckte weitere Testfehler auf. Die Web-Locks-Probe
überlässt den letzten Tab dem Fixture. Der Portalserver löst den
404-Fehler nur beim eigenen Pfadsegment aus. Der Golden Path benutzt
gezielt eine gültige ID mit `404` im Namen. SQL-Snapshot-Tests
warten auf den Wert des aktuellen Laufs, bevor sie sein Menü öffnen.
Die Sticky-Table-Aufnahmen blenden die unabhängig animierten
Scrollleisten für den Pixelvergleich aus. Der Tooltip-Test erhält
beim programmgesteuerten Fokuswechsel die Scrollposition.

Typecheck, Lint und Diff-Prüfung Exit 0. Die sechs gezielten
macOS-Browserfälle zu SQL-Snapshots, Locks und Portalfehlern
bestanden. Der Linux-Lauf `43710732694` bestätigte den separaten
Firefox- und WebKit-Deploymentpfad. Seine Chromium-Spur belegt
den falschen 404 für einen bestehenden Testdatensatz.
