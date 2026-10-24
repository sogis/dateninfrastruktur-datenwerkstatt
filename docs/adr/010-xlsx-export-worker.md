# ADR-010 — XLSX aus bestehenden Tabellen mit eigenem Exportworker

Entscheidung vom 24. Oktober 2026, REQ-048 / AT-032.

Der XLSX-Export im Quellportal ist bereits in der dokumentierten Baseline
`6b45fc4e22116fba8fc00bd48175e347aa740562` vorhanden. Er verwendet `INSTALL excel`,
`LOAD excel` und `COPY (<executedSql>) ... (FORMAT XLSX)`. Die Datenwerkstatt
exportiert stattdessen ihren unveränderlichen Tabellenhandle, ohne SQL erneut
auszuführen; R verwendet seine bereits geprüfte temporäre Tabellenaufnahme.
Das Quellportal bleibt unverändert.

## Reproduzierbarer Fehler im gepinnten Build

DuckDB-WASM `1.33.1-dev57.0` verwendet Engine `v1.5.4`. Deren Excel-Erweiterung
pinnt `f4c72b5ef04a03b3a78a95b5a2ee94ba93e3178d`; ihr wiederverwendeter Cast-Chunk
behält NULL-Masken aus früheren Blöcken. 10000 DOUBLE-Zeilen mit genau einem NULL
ergeben beim nativen XLSX-Export 9995 statt 9999 belegte Werte. Eine vollständige
VARCHAR-Projektion ergibt 9999. Das sind echte WASM-Aufrufe, keine Connector-Mocks.

Mit laufendem `npm run dev` reproduziert `node scripts/prove-native-xlsx.mjs`
den Fehler. Das Skript lädt ausschliesslich die beiden hashgepinnten offiziellen
Excel-WASM-Dateien in den Speicher und beantwortet damit den Testrequest; weder
Vendorassets noch Projektspeicher werden verändert. Der Test liefert Exit 0 nur
bei der dokumentierten Fehlerreproduktion. Nachweis: [Log](../verification/xlsx/native-proof.log).

Quellen: [DuckDB-Fehler 24779](https://github.com/duckdb/duckdb/issues/24779),
[Upstreamfix 92](https://github.com/duckdb/duckdb-excel/pull/92),
[v1.5.4-Pin](https://github.com/duckdb/duckdb/blob/v1.5.4/.github/config/extensions/excel.cmake).
Zusätzlich schreibt der native Writer NaN/Inf ohne passenden Excel-Zelltyp,
konvertiert Zeitwerte in Serienzahlen und prüft Zell-/Spaltenlimits nicht.

## Gewählter Weg

ExcelJS **4.4.0** (MIT) wird exakt gepinnt und nur im XLSX-Worker geladen.
Kein Engineupgrade, kein weiterer Connector, kein neuer persistierter Zustand.
Der SQL-Adapter liest ausschliesslich Nutzerfelder in Ordinalreihenfolge als
exakte SQL-Textwerte mit logischem Schema. Erst der Worker entscheidet anhand
der gesamten Spalte, ob Zahlen Excel-genau sind; andernfalls schreibt er Text.
DECIMAL und Zeitwerte bleiben Text, Bool bleibt Boolean. OOXML-Escapes erhalten
Sonderzeichen; Formeln/Links werden nicht aus Text abgeleitet. NULL bleibt von
Leerstring unterscheidbar; auch vollständig fehlende Zeilen bleiben gezählt.

Die Workergrenze ermöglicht tatsächliches `terminate()` bei Abbruch, Timeout und
Sitzungsende auch während der synchronen XML-/ZIP-Erzeugung. Ein zusätzliches
Signal an `downloadStream` unterbindet veraltete Downloads beim Streamlesen.
Die vorhandene Runtime reicht ihr kombiniertes Operations-/Lebenszeitsignal an
den Export weiter. Scheduler und Limits gelten wie für die übrigen Operationen.
Kein Zero-Copy- oder Peak-RAM-Versprechen; 100000 Zeilen und gemeinsam 64 MiB für Payload plus Datei
sowie Excel-Zell-/Spaltengrenzen werden explizit begrenzt.

## Alternativen

Ein ungeprüftes Engineupgrade oder selbst kompilierter Extensionfix vergrössert
die Änderung am gepinnten Stack. Native XLSX-Ausgabe ausschliesslich als Text
umgeht den NULL-Fehler, verliert aber nutzbare numerische/Boolean-Zelltypen und
benötigt weiterhin zusätzliche Zeichen-/Grenzbehandlung. `write-excel-file` 4.1.1
wurde verworfen: Leerstring wird NULL, Shared-String-Lookups mit normalen Objekten
scheitern bei `constructor`/`__proto__`, und Zeichen werden still entfernt.

Die ExcelJS-Browserausgabe wurde vor Auswahl real mit 10000 Zeilen getestet:
9999 belegte Zahlen, expliziter Leerstring, prototypgleiche Strings und keine
Formelzellen. Fflate **0.8.3** ist ausschliesslich Testdependency zum unabhängigen
Entpacken/Prüfen der erzeugten ZIP-/XML-Zellen. Die konkreten abschliessenden
Checks stehen im Implementierungsstatus.
