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
