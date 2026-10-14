# R-Initialisierung: Diagnose des bestehenden Arbeitsflächentests

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.r-plot img')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.r-plot img') with timeout 10000ms
  - waiting for locator('.r-plot img')

```

```yaml
- banner:
  - img "Kanton Solothurn"
  - link "Datenwerkstatt":
    - /url: /workspaces
  - text: Entwicklungsstand · nicht abgenommen
  - link "Einstellungen":
    - /url: /settings
- alert:
  - strong: Unexpected token '<', "<!doctype "... is not valid JSON
  - button "Hinweis schliessen"
- navigation "Arbeitsbereich":
  - button "Navigation ausklappen"
  - link "Arbeitsbereiche":
    - /url: /workspaces
  - link "Projektübersicht":
    - /url: /workspaces/68a077a5-91dd-4555-be2a-a4d469233f34
  - link "Daten":
    - /url: /workspaces/68a077a5-91dd-4555-be2a-a4d469233f34/data
  - button "SQL"
  - button "R"
- text: Lokal gespeichert · kein Backup Analysename
- textbox "Analysename": Neues R-Skript
- button "Ausführen"
- button "Speichern"
- button "Objekte / Eingaben" [pressed]
- button "Konsole" [pressed]
- button "Weitere Aktionen"
- group: Parameter (0)
- text: R-Lauf
- combobox "R-Lauf":
  - option "Letzter Lauf" [selected]
- text: Bereit · R-Epoche 0
- button "R initialisieren"
- complementary:
  - heading "Objekte" [level=3]
  - text: Scope nicht aktiv
  - heading "Eingaben" [level=3]
- code:
  - textbox "Analysecode": plot(1:4); cat("Gemessene R-Ausgabe")
- separator "R Editor und Ausgabe teilen"
- paragraph: Grafiken erscheinen nach einem erfolgreichen Lauf. Dataframes sind über die Objektliste erreichbar.
- separator "R Konsole teilen"
- log "R-Konsole":
  - paragraph: Ausgabe, Meldungen und Warnungen. print()/cat() für explizite Ausgabe verwenden.
- alert
- alert
```
