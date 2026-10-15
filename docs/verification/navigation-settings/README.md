# Einstellungen links und kompakter Hinweisabschluss

Prüfdatum: 14. Oktober 2026. Basis **b117b80ffcc644d662582ef92461d0ad769e28e1**,
uncommittierter Kandidat, Node **22.23.1**, npm **11.18.0**.
[Dateifingerprint](code-fingerprint.json).

## Ergebnis

REQ-061/064–067, Regression zu AT-054/055/057/058: gemeinsame Hauptnavigation
auf regulären Seiten; Einstellungen mit lokalem Gear-SVG nach R, ausserhalb
eines Projekts nur globale Ziele. 52/212 px, aktuelle Route, Tooltip und
Tastaturbedienung geprüft. Projektbeschreibung und Projektansicht überstehen
den Wechsel zu Einstellungen; globale Umschaltung bleibt sitzungslokal,
persönlicher Standard übersteht Reload. Keine neue Engine auf globalen Seiten.

Globaler Fehlerhinweis: lokales x-lg-SVG im transparenten 40×40-px-IconButton,
blau **#0B5FFF**, rechts und vertikal zur gesamten Meldung zentriert. Echte
Archiv- und Namensfehler, Maus und Tastatur, 1440×900/1280×800 und CSS-Zoom
200 % geprüft. [12 Geometriemessungen](notice-geometry.json): keine horizontale
Überbreite, kein überlappender Text, zentriertes Icon einschliesslich mehrerer
Textzeilen. PNGs der Navigation und Hinweise liegen pro Browser hier;
WebKit-Navigation und Firefox-/Chromium-Zoomhinweise wurden im Original visuell geprüft.

## Ausgeführte Befehle

Repositorypfad für die folgenden Aufrufe:
`DW_REPO=/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt`.
Browserlauf aus `/tmp/datenwerkstatt-navigation-foqrul`, damit die bestehenden
Screenshotpfade der Designsystem-/P7-Tests historische Repositorybelege nicht
überschreiben. Der vorhandene, identische Devserver auf Port 4173 wurde benutzt.

- `npm run verify`: **Exit 1**. Typecheck und Lint/Modulgrenzen bestanden;
  **40/40 Unit-Tests** bestanden. Build stoppt beim vorbereitenden Paketmirror:
  bit64 **4.8.2** erwartet, Upstream liefert **4.8.6**. Danach keine automatische
  Integrations-/E2E-Suite ausgeführt. [Originalausgabe](verify.log).
- `DW_REUSE_DEV_SERVER=1 node "$DW_REPO/node_modules/@playwright/test/cli.js" test --config="$DW_REPO/playwright.config.ts" --output=/tmp/datenwerkstatt-navigation-foqrul/test-results --project=chromium --project=firefox --project=webkit --reporter=list "$DW_REPO/tests/e2e/navigation.spec.ts" "$DW_REPO/tests/e2e/design-system.spec.ts" "$DW_REPO/tests/e2e/workspaces.spec.ts" "$DW_REPO/tests/e2e/p7-ui.spec.ts"`:
  **Exit 1, 51 bestanden / 3 gescheitert**. Alle **9 neuen Navigations-/Hinweisfälle**,
  alle **18 Designsystemfälle**, alle **15 Workspacefälle** und neun weitere
  P7-Fälle bestanden. Je Browser scheitert ausschliesslich der SQL/R-Geometriefall
  beim R-Start: der fehlende lokale Paketmirror liefert statt Lock-JSON den
  Vite-HTML-Fallback. [Gesamter Log](browser-matrix.log),
  [Chromium-Kontext](r-failure-chromium.md),
  [Firefox-Kontext](r-failure-firefox.md), [WebKit-Kontext](r-failure-webkit.md).
- `DW_REUSE_TEST_PORTAL=1 npx playwright test -c playwright.deploy.config.ts --output=/tmp/datenwerkstatt-navigation-foqrul/deployment-results --reporter=list tests/deployment/static.spec.ts tests/deployment/faults.spec.ts`:
  **Exit 1 vor Browserstart**. Deploymentserver scheitert beim Lizenzinventar,
  weil das gepinnte R6-Archiv im fehlenden R-Mirror nicht vorliegt.
  [Originalausgabe](deployment.log). Die betroffenen Deploymentprüfungen sind
  damit **nicht ausgeführt**, keine Container-/CSP-Abnahme behauptet.
- `APP_BASE_PATH=/lab/ npx vite build --outDir /tmp/datenwerkstatt-navigation-foqrul/lab-dist`:
  **Exit 0**. [Frontend-Buildausgabe](lab-build.log). Ausschliesslich im temporären
  Buildoutput `appBasePath` auf `/lab/` gesetzt. Danach
  `APP_BASE_PATH=/lab/ npx vite preview --outDir /tmp/datenwerkstatt-navigation-foqrul/lab-dist --port 4183`
  und `node /tmp/datenwerkstatt-navigation-foqrul/lab-smoke.mjs /tmp/datenwerkstatt-navigation-foqrul`:
  **Exit 0, 3/3 Browser bestanden**. Gebündelte Navigation, Direktaufruf und
  Reload von `/lab/settings`, globale/Projektziele, echter Fehler und blaues
  Schliessen-SVG ohne Worker oder pageerrors. [Prüfskript](lab-smoke.mjs),
  [Versionen und Szenarien](lab-smoke.json), [Log](lab-smoke.log).
  Dieser Frontendnachweis ersetzt den blockierten Deploymenttest nicht.
- Abschliessend `npm run typecheck && npm run lint && npx prettier --check src/app/router.tsx src/styles/app.css docs/DESIGN_SYSTEM.md tests/e2e/navigation.spec.ts tests/e2e/design-system.spec.ts tests/deployment/static.spec.ts docs/verification/navigation-settings/README.md && git diff --check`:
  **Exit 0**. [Ausgabe](final-checks.log).
- `python3 tools/verify-package.py --report docs/verification/navigation-settings/package-check.json`:
  **Exit 0**; Dokumentlinks, Verträge und synthetische Referenzwerte geprüft,
  keine Engineabnahme. [Bericht](package-check.json).

Der [Hashabgleich nach Testende](fingerprint-check.json) bestätigt den unveränderten
Produkt-/Testkandidaten. Der eigene Previewserver auf 4183 wurde beendet;
der vorhandene Nutzer-Devserver auf 4173 blieb erhalten.

## Zwischenbefunde und Grenzen

Der erste Lauf der neun neuen Fälle hatte **Exit 1, 8/9 bestanden**: Firefox
zeigt bei rein programmatischem Fokus nach Mausklick richtigerweise keinen
Tastaturtooltip. Der Test verwendet nun echte Tab-/Shift+Tab-Schritte; auf
macOS WebKit Option+Tab. Danach alle neun Fälle bestanden, Produktcode unverändert.
Der erste zusätzliche Bundle-Smoke hatte **Exit 1**, weil er den englischen
Dev-Fehlerwortlaut erwartete; der Produktionsbundle verwendet „Invalid input“.
Die Prüfung erfolgt jetzt anhand des identischen Validierungscodes `too_small`.
[Erste Ausgabe](lab-smoke-first.log). Kein Fehlertext oder Goldenwert im Produkt geändert.

Bekannte externe Abhängigkeit bleibt der gepinnte webR-Mirror. Keine Pins,
Prüfsummen, Enginepfade oder Tests deaktiviert. Keine vollständige neue
V1-Abnahme, keine erneute Ressourcenprüfung und kein nativer Safari-Smoke.
Nächster technischer Abnahmeschritt: Mirror wiederherstellen und verify,
SQL/R-Flächenvertrag und reguläre Deploymenttests erneut ausführen.
