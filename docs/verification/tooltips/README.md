# Tooltip-Fix — 14. Oktober 2026

Basis `45de19b4181983ea53cad27eab93a1aabbc7f6b9` mit uncommittiertem Tooltip-Fix
und der vorherigen SQL-/R-Linksbündigkeit. Der [Dateiabgleich](code-fingerprint.json)
bestätigt unveränderte Code-/Testdateien nach Abschluss der Prüfungen.

Tooltips erscheinen nach 250 ms Hover oder sofort bei Tastaturfokus, rechts mit
8 px Abstand und vertikal mittig. Bei Platzmangel weichen sie nach links aus.
Sichtbarkeit beginnt erst nach der Messung. Pro Dokument bleibt ein Auslöser
aktiv; Klick, Escape, Fokusverlust und Unmount schliessen beziehungsweise
verwerfen offene und wartende Anzeigen. Scrollen und Resize aktualisieren die
Position; ausserhalb des Viewports schliesst die Anzeige.

## Tatsächliche Prüfungen

Bei den gespeicherten Logs wurden ausschliesslich abschliessende Leerzeichen
und zusätzliche Leerzeilen am Dateiende normalisiert; Ergebnisse und Inhalte
blieben unverändert.

| Prüfung                                                                     | Ergebnis                                                         | Beleg                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Designsystem, Chromium/Firefox/WebKit                                       | Exit 0, 18/18 bestanden                                          | [Finaler Lauf](design-system-final.log)      |
| Designsystem plus vorhandene P7-Arbeitsflächen, drei Browser                | Exit 1, 27 bestanden / 3 gescheitert                             | [Breitere Matrix](browser-matrix-second.log) |
| Gepinnte Laufzeitassets vorbereiten                                         | Exit 1 beim R-Paketmirror; Basis-DuckDB/webR-Dateien vorbereitet | [Console-Ausgabe](assets-prepare.log)        |
| Typecheck, Lint, Prettier für geänderte UI-/Testdateien, `git diff --check` | Exit 0                                                           | Befehle im Implementierungsstatus            |

Der frühere [Chromium-Lauf](chromium-first.log) scheiterte an einem Testschritt,
der bei unveränderter Mausposition einen erneuten Pointer-Eintritt erwartete.
Mit tatsächlichem Verlassen/Wiedereintritt [6/6 bestanden](chromium-second.log).
Die [erste breitere Matrix](browser-matrix.log) scheiterte zusätzlich an fehlenden
Laufzeitassets und WebKits nativer Tastaturnavigation auf macOS. Der Tastaturtest
nutzt dort Option+Tab; die Anforderungen und Sollwerte wurden nicht abgeschwächt.

## Geometrie und Frames

Bei 1440×900 und 1280×800: eingeklappte und ausgeklappte Navigation, SQL/R,
rechter Abstand 8 px und gleiche vertikale Mitte. Zusätzlich 720×300/450,
Scrollen, Schliessen ausserhalb des Viewports und links platzierter IconButton
mit geänderter Tooltip-Grösse. Kein erfasster Frame zeigt falsche Koordinaten
oder mehrere Tooltips. Messungen:
[Chromium](navigation-chromium.json), [Firefox](navigation-firefox.json),
[WebKit](navigation-webkit.json). Screenshots liegen in diesem Verzeichnis;
historische Designsystem-Belege wurden nicht überschrieben.

## Offene Abnahmegrenze

Die drei gescheiterten P7-Fälle erreichen echte SQL-Ausführung, scheitern dann
beim R-Start: Der Paketmirror wurde nicht publiziert; die fehlende `lock.json`
liefert im Devserver HTML statt JSON. [Browserdiagnose](r-init-failure.md).
Das bestehende Vorbereitungsskript lehnt den aktuellen Upstream-Index ab:
`bit64` ist dort 4.8.6, das unveränderte Projektlock verlangt 4.8.2. Das alte
4.8.2-Archiv ist weiterhin HTTP 200 erreichbar und hat den gepinnten SHA-256;
dies ersetzt jedoch nicht den fehlenden, passenden Mirror-Index.

Paketpins, Prüfsummen und Mirror-Skripte blieben unverändert. Nächster Schritt
für eine vollständige R-Abnahme: den passenden gepinnten Mirror wiederherstellen
und die drei P7-Fälle erneut ausführen. `npm run verify`, Deploymentchecks,
Ressourcenbenchmarks und nativer Safari-Smoke wurden nicht erneut ausgeführt.
Die Tooltip-Abnahme ist bestanden; die breitere Matrix ist ausdrücklich nicht
vollständig bestanden.
