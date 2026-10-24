# ADR-009 — CSV ohne Umwandlung fehlender Werte

Status: implementiert; betrifft REQ-025 / AT-008.

Im gepinnten `@duckdb/duckdb-wasm` 1.33.1-dev57.0 (DuckDB v1.5.4) weist
`read_csv(..., nullstr=[], ...)` eine leere Marker-Liste mit dem Binderfehler
«CSV Reader function option nullstr requires a non-empty list of possible null
strings (varchar) as input» zurück. Dies trat im echten Importdialog auf, wenn
«Leere Felder als fehlende Werte (NULL) importieren» ausgeschaltet und kein
«Text für fehlende Werte» gesetzt war. Die native Vergleichsprobe bestätigte den
Fehler und erfolgreiche SELECT-/CTAS-Abfragen derselben Datei mit `nullstr=chr(0)`.

Wenn keine NULL-Umwandlung ausgewählt ist, verwendet der interne Reader deshalb
`nullstr=chr(0)`. NUL ist im CSV-Eingang bereits ausdrücklich verboten und wird
bei der UTF-8-Prüfung vor Dateiregistrierung abgewiesen. Dieses Zeichen kann somit
keinen gültigen Nutzerwert treffen. Gewöhnliche Texte wie `NULL`, `NA`, `\N` oder
`__NULL__` bleiben ebenso wie leere Felder unverändert. Bei ausgewählten Markern
verwendet der Reader weiterhin ausschliesslich deren explizite Liste. Im Dokument
bleiben `nullStrings: []` und `emptyStringIsNull: false` gespeichert; die technische
Anpassung wird nicht als zusätzliche Nutzeroption oder Herkunftsmarker publiziert.

Ein gewöhnlicher Ersatztext wäre wegen möglicher Datenkollisionen ungeeignet.
Die bestehende NUL-Sperre erlaubt die kleine Anpassung
ohne zweiten Parserlauf, eigene CSV-Verarbeitung oder Dependencyupgrade.

Dauerhaft reproduzierbarer Nachweis:

```sh
npx playwright test --project=chromium tests/integration/csv-options.spec.ts
```

Die Fälle für ausgeschaltete Leerfeldumwandlung prüfen Vorschau, vollständigen
strikten Import und Parquet-Reopen: Zahlen plus Leertext werden als VARCHAR
vorgeschlagen, alle gewöhnlichen Markertexte bleiben Text, NUL-Dateien werden
abgewiesen. Bestehende Standard-NULL- und explizite Markerfälle bleiben erhalten.
