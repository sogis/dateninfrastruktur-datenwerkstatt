# Herkunft und Nutzung der Schriften

## Aktives neutrales Theme — Source Sans 3

Seit der neutralen Migration vom 21. Oktober 2026 verwendet die UI lokal
**Source Sans 3, Release 3.052R**, OFL-1.1, aus dem offiziellen Repository
<https://github.com/adobe-fonts/source-sans/releases/tag/3.052R>.
Fixierter Release-Commit: `ed1808970eb3c7301c9a523bee26473ba0bb62fa`.
Die Originaldateien aus `WOFF2/VF/` liegen unverändert unter
`src/assets/fonts/source-sans-3/`.

| Originaldatei                     | Stil   | Gewichtsachse | SHA-256                                                            |
| --------------------------------- | ------ | ------------- | ------------------------------------------------------------------ |
| `SourceSans3VF-Upright.ttf.woff2` | normal | 200–900       | `5f16566f7a40d39b339ad26be151fa5a1ab1f0c2574c7a2e619765584a1acbd8` |
| `SourceSans3VF-Italic.ttf.woff2`  | italic | 200–900       | `b4959abc0569392f87c6c6ac612f90e3fe0104d283724189b7d8b6f61af347d3` |

Die tatsächlichen Schnitte decken 400, 500, 600 und gezielte Hervorhebung mit
700 ab. `font-synthesis: none` verhindert künstliche Schnitte; `font-display:
swap` erhält die Lesbarkeit mit dem Systemfont-Fallback. Beide WOFF2-Dateien
werden von Vite über basispfadfähige lokale URLs ausgeliefert. Es gibt keine
externen Fontabrufe. Der Lizenzwortlaut ist unverändert; für das Repository sind ausschliesslich
Zeilenenden auf LF normalisiert und nachgestellte Leerzeichen entfernt.
Die Original-OFL wird als
[Source-Sans-Lizenz](../licenses/source-sans-3.052R-OFL.txt) zusammen mit dem
[Assetinventar](../src/assets/ui-assets.json) im Build ausgeliefert.

JetBrains Mono Regular **2.304**, OFL-1.1, bleibt die lokale Code-/Konsolenschrift
(`src/assets/fonts/JetBrainsMono-Regular.woff2`). Herstellerquelle:
<https://github.com/JetBrains/JetBrainsMono/tree/v2.304>; Original-OFL:
[JetBrains Mono](../licenses/jetbrains-mono-2.304-OFL.txt). Der bestehende
Dateihash bleibt unverändert. Bootstrap Icons **1.13.1** behält seine lokale
SVG-Auswahl und MIT-Lizenz. Die neutrale Darstellung benötigt weder
Frutiger-Lizenzen noch Assets des Quellportals.

Die folgenden Herkunftsangaben bleiben als historischer Übernahmenachweis
erhalten; Frutiger wird im neutralen Theme nicht eingebunden oder geladen.

## Frutiger — historischer kantonaler Bestand

Am **10. Oktober 2026** hat der Projektverantwortliche die Verwendung und lokale
Auslieferung der vorhandenen Frutiger-Webfonts in der Datenwerkstatt bestätigt:

> Ich bestätige dir, dass das erlaubt ist. Wir haben die notwendigen Lizenzen im Kanton.

Diese Bestätigung beantwortet ausdrücklich die Frage nach der Verwendung und
Auslieferung aus den Referenzprojekten. Sie dokumentiert den kantonalen
Nutzungskontext; die Fonts bleiben proprietär und erhalten durch die
Repository-Lizenz keine zusätzliche Lizenz.

Auf ausdrücklichen Wunsch des Projektverantwortlichen stammt die endgültige
Auswahl aus **datenportal-sodata**, unverändert aus
`src/main/resources/static/vendor/so-web-components/0.1.10/styles/`,
Revision `a742dee42a26c4739e1966b86bae0d37d76ca2f6`.

| Datei                       | CSS-Gewicht wie im Portal | Metadaten                      |
| --------------------------- | ------------------------- | ------------------------------ |
| FrutigerLTW05-55Roman.woff2 | 400                       | Version 1.00, OS/2-Gewicht 400 |
| FrutigerLTW05-75Black.woff2 | 700                       | Version 1.10, OS/2-Gewicht 800 |

Die CSS-Zuordnung 400/700 entspricht der `fonts.css` des Portals: dort wird der
75Black-Schnitt für 700 verwendet, obwohl sein internes Gewicht 800 ist.
In der früheren kantonalen Variante verwendeten Labels und Überschriften damit dieselbe Schrift wie das Portal.
Die zuvor übernommenen LTCom-Dateien des Datenblatt-Editors wurden ersetzt.
Die eingebetteten Copyright- und Lizenzhinweise sind zusätzlich als
[Originalhinweise](../licenses/frutiger-original-notices.txt) übernommen.
[Assetinventar und SHA-256](../src/assets/ui-assets.json) sichern die Herkunft.

Die Fonts liegen unter `src/assets/fonts/`, werden durch Vite mit lokalem,
unterpfadfähigem URL eingebunden und verwenden `font-display: swap`.
Bei Ladefehlern greift system-ui, -apple-system, BlinkMacSystemFont, Segoe UI,
sans-serif. Es gibt keine externe Fontabfrage und keine Laufzeitabhängigkeit
auf die Referenzrepositories.

## JetBrains Mono und SVGs

JetBrains Mono Regular **2.304** stammt unverändert aus
`datenportal-sodata/src/main/resources/static/vendor/jetbrains-mono/2.304/`.
Die [Original-OFL](../licenses/jetbrains-mono-2.304-OFL.txt) ist enthalten.
Bootstrap Icons **1.13.1** stammt aus dem installierten Originalpaket des
Datenblatt-Editors; ausgewählte SVG-Pfade und die [MIT-Lizenz](../licenses/bootstrap-icons-1.13.1.txt)
sind lokal übernommen. Versionen und Dateihashes stehen im Assetinventar.
