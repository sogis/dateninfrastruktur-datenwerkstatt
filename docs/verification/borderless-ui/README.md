# Meldungen und Navigation ohne linken Akzentstrich

Prüfstand 14. Oktober 2026, Basis `2d3632a` mit den im
[Dateinachweis](code-fingerprint.json) erfassten CSS-Änderungen.

**Bestanden:** [Designsystem-Suite](design-system.log), Exit 0, **18/18 Tests**
in Chromium, Firefox und WebKit. Die [Layoutprüfung](geometry.log), Exit 0,
deckt zusätzlich **18/18 Szenarien** ab: vier Meldungstöne sowie tatsächlicher
globaler Validierungsfehler mit eingeklappter/ausgeklappter Navigation, jeweils
bei 1440×900 und 1280×800 in den drei Browsern.

Die [Messdaten](geometry.json) bestätigen `border-left-width` und
`border-inline-start-width` von 0 px sowie fehlenden `::before`-Inhalt bei der
aktiven Navigation. Farben, Innenabstände, Abrundungen, Meldungsrollen und
`aria-current` erhalten; Tastaturfokus weiterhin 3 px blau. Die
[visuelle Übersicht](visual-review.png) enthält alle 18 getrennt gespeicherten
Screenshots. Chromium/1440 zusätzlich in Originalgrösse geprüft.

Der [erste Layoutlauf](geometry-first.log) hatte Exit 1: Der Prüfablauf wartete
auf den Fehlerbanner, bevor er den für die Namensvalidierung erforderlichen
Fokusverlust auslöste. Ablauf korrigiert; Produktcode und Sollwerte unverändert.

Die Befehle stehen im Implementierungsstatus; das einmalige Messskript liegt
unter `/tmp/datenwerkstatt-borderless-yRXOu4/verify-borderless.mjs`.
Gespeicherte Logs haben normalisierte abschliessende Leerzeichen/Leerzeilen;
Inhalte und Ergebnisse unverändert. Historische Abnahmebelege bleiben erhalten.
Keine erneute vollständige Engine-/Deployment-/Safari-Abnahme in diesem CSS-Fix.
