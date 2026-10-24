# Designsystem Datenwerkstatt – neutrale Oberfläche

**Version:** 1.4
**Stand:** 23. Oktober 2026
**Standardtheme:** `neutral-blue`
**Status:** Verbindliche aktuelle Projektfassung; abgestimmte Konventionen sind Bestandteil dieses Designsystems. Umsetzungs- und Prüfnachweise stehen separat im Implementierungsstatus.

Dieses Dokument beschreibt eine vollständige organisationsunabhängige Variante
des Designsystems der Datenwerkstatt. Grundlage ist das bereitgestellte
`DESIGN_SYSTEM.md`, Version 1.0 vom 10. Oktober 2026. Die neutrale Variante
verwendet gedämpftes Blau, neutrale Grautöne, Source Sans 3 und einen einfachen
Markenplatzhalter.

Das Dokument konkretisiert weiterhin die im Ausgangsdokument genannten
REQ-061–067 und AT-054–058. Fachliche Funktionen, Engine-Lebenszyklen,
Speicherformate, Berechtigungen und Datenverträge bleiben in der bestehenden
SPEC und den Contracts geregelt. Bei einem Konflikt haben diese funktionalen
Verträge Vorrang; die Gestaltung wird daran angepasst. Die Designmigration
führt keine neuen fachlichen Validierungsregeln ein.

**Verbindlichkeit:** „MUSS“ bezeichnet eine Anforderung dieser Spezifikation.
„SOLL“ bezeichnet den Standardfall; eine Abweichung benötigt einen konkreten
fachlichen oder gestalterischen Grund. „DARF“ bezeichnet eine zulässige Option.

**Massgebliche Fassung:** Diese Datei (`DESIGN_SYSTEM.md`) ist die aktuelle
Gestaltungsreferenz für die Anwendung. `DESIGN_SYSTEM_NEUTRAL_v1.4.md` enthält
die nachgeführte Referenzfassung; `DESIGN_SYSTEM_NEUTRAL.md` ist historisch.
Die am 21. Oktober 2026 abgestimmten Regeln sind nachfolgend direkt eingearbeitet
und benötigen bei der Umsetzung keine erneute Ausnahme oder Übersteuerung.

## 1. Gestaltungsziel und verbindliche Entscheidungen

Die Datenwerkstatt ist eine ruhige Arbeitsumgebung für Daten, SQL und R.
Formulare, Tabellen, Ergebnisse und Editorflächen stehen im Vordergrund.
Visuelle Hierarchie entsteht durch Anordnung, Abstand, Schriftgrösse und
moderate Gewichtsunterschiede.

Für die erste neutrale Version gelten folgende Entscheidungen:

1. **Aktionsfarbe:** gedämpftes Blau `#2B5C8A`.
2. **Flächen:** überwiegend Weiss; helles Neutralgrau für Funktionsbereiche.
3. **UI-Schrift:** lokal ausgelieferte Source Sans 3 als Variable Font.
4. **Gewichte:** 400 für normalen Text, 500 für Bedienung und Labels, 600 für
   Überschriften; 700 nur für gezielte inhaltliche Hervorhebung.
5. **Code-Schrift:** lokal ausgelieferte JetBrains Mono.
6. **Marke:** kleiner monochromer Platzhalter und Produktname „Datenwerkstatt“.
7. **Buttons:** drei Gewichtungen `primary`, `secondary`, `tertiary`; dazu
   unabhängig die Bedeutung `default` oder `danger`.
8. **Status:** Information, Erfolg, Warnung und Fehler verwenden eigene Rollen.
   Rot ist für Fehler und destruktive Aktionen vorgesehen.
9. **Geometrie:** 4-px-Raster, 4-px-Controlradien, sparsame Trennlinien; Schatten
   nur an schwebenden Elementen.
10. **Betrieb:** Fonts und Icons werden mit der Anwendung ausgeliefert und
    funktionieren auch unter dem Anwendungspfad `/lab/`.

### 1.1 Abgestimmte Projektkonventionen

| Bereich | Verbindliche Regel |
| --- | --- |
| Pflicht und Optionalität | Erforderliche Felder ohne Zusatz; optionale Felder mit gedämpftem „(optional)“. Keine Sternchen oder Pflichtfeldhinweise. Native `required`-Semantik bleibt erhalten. |
| Analysenamen | In SQL/R bleibt das kompakte Label sichtbar; die Ausnahme für ausgeblendete Parameterlabels gilt nur in Parametertabellen. |
| Feldfehler und Aktionslayout | Eingabe und zugehörige Buttons bleiben auch bei mehrzeiligen Fehlern ausgerichtet. Bei schmaler Projekterstellung folgt der Button unter der Feldgruppe. |
| Vergrösserter Text | Zeilenhöhen wachsen mit der Schrift. Die Labelzeilenhöhe beträgt dimensionslos `1.42857143`, entsprechend 20 px bei 14 px Schrift. |
| Prüfungen | Gezielte Prüfung des betroffenen UI-Umfangs gemäss Abschnitt 15.2; kein automatischer Start vollständiger Suiten oder Browser-/Deploymentmatrizen. |

Diese Regeln gelten als regulärer Projektstandard. Die Einzelheiten und
Ausnahmen stehen in den jeweiligen Abschnitten, insbesondere 4, 8 und 15.2.

Die neutrale Version benötigt kein neues gemeinsames Komponentenpaket.
Gemeinsame Tokens und Komponenten innerhalb der bestehenden Anwendung genügen.
Die vorgeschlagenen Alternativen Petrol, Indigo und Graphit sind mit dieser
Version nicht automatisch zusätzliche produktive Themes.

## 2. Grundregeln, Theme und Marke

Die Implementierung MUSS drei Verantwortlichkeiten unterscheiden:

| Ebene                        | Inhalt                                                                                          | Veränderbarkeit                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Gemeinsame Gestaltungsregeln | Layout, Abstände, Bediengrössen, Komponenten, Zustände, Tastaturbedienung, zugängliche Semantik | Gemeinsamer Vertrag aller Themes                                                         |
| Theme                        | Aktions- und Neutralfarben, Schriftfamilie, zugehörige Schriftgewichte                          | Zentral austauschbar; Änderungen erfordern erneute Prüfung der betroffenen Darstellungen |
| Marke und Absender           | Produktname, Logo, optionaler Organisationsname                                                 | Über eine zentrale Konfiguration austauschbar                                            |

Komponenten MÜSSEN semantische Tokens verwenden. Direkte Farbwerte gehören in
die Theme-Definition, nicht in einzelne Komponenten. Dies gilt auch für Links,
ausgewählte Navigation, Fokus, Eingabekonturen und Schliessen-Icons.

Aktions-, Auswahl-, Fokus- und Statusrollen bleiben getrennt, auch wenn zwei
Rollen im Standardtheme denselben Farbwert verwenden. Ein späteres
Organisationstheme kann dadurch beispielsweise seine Aktionsfarbe ändern,
ohne zugleich die Fehlerfarbe zu verändern.

Der bestehende Token-Präfix `--dw-` bleibt erhalten. Das Designsystem bleibt
produktbezogen, aber unabhängig von einer bestimmten Organisation.

## 3. Farben des Standardthemes

### 3.1 Neutrale Flächen und Text

| Token                       | Rolle                                                             | Wert      |
| --------------------------- | ----------------------------------------------------------------- | --------- |
| `--dw-surface`              | Seite, Navigation, Editor, Resultate, Dialoge, Eingaben           | `#FFFFFF` |
| `--dw-surface-subtle`       | Werkzeugleisten, Tabellenköpfe, Konsole, schreibgeschützte Felder | `#F3F5F7` |
| `--dw-surface-neutral`      | Neutrale Statuslabels und zurückgesetzte Bereiche                 | `#EEF1F4` |
| `--dw-surface-hover`        | Hover neutraler Bedienelemente                                    | `#F3F5F7` |
| `--dw-surface-pressed`      | Gedrückter Zustand neutraler Bedienelemente                       | `#E7EBEF` |
| `--dw-text`                 | Haupttext                                                         | `#25313C` |
| `--dw-text-secondary`       | Hilfetext, Metadaten, nachgeordnete Beschriftung                  | `#5B6673` |
| `--dw-border-subtle`        | Gliedernde Trennlinien                                            | `#D9DFE5` |
| `--dw-border-control`       | Erkennbare Eingabe- und Controlkonturen                           | `#7C8793` |
| `--dw-border-control-hover` | Eingabekontur bei Hover                                           | `#5B6673` |
| `--dw-disabled-bg`          | Hintergrund deaktivierter Controls                                | `#ECEFF2` |
| `--dw-disabled-text`        | Text deaktivierter Controls                                       | `#626D79` |

Arbeitsflächen bleiben weiss. Funktionsbereiche werden mit Abstand,
zurückhaltenden Flächen und feinen Trennlinien gegliedert. Flächendeckende
Kartencontainer, grosse farbige Kopfbereiche, dekorative Akzentstriche und
Farbverläufe sind für die Arbeitsoberfläche nicht vorgesehen.

Eine Trennlinie DARF subtil sein, wenn sie nur gliedert. Eine Kontur, die zum
Erkennen eines leeren Eingabefeldes benötigt wird, MUSS ausreichend sichtbar
sein. Dafür werden unterschiedliche Tokens verwendet.

### 3.2 Aktion, Links, Auswahl und Fokus

| Token                    | Rolle                                | Wert      |
| ------------------------ | ------------------------------------ | --------- |
| `--dw-action-bg`         | Gefüllte Primäraktion                | `#2B5C8A` |
| `--dw-action-bg-hover`   | Hover der Primäraktion               | `#234E75` |
| `--dw-action-bg-pressed` | Gedrückte Primäraktion               | `#1D4162` |
| `--dw-action-fg`         | Text und Icons auf der Primäraktion  | `#FFFFFF` |
| `--dw-link`              | Textlinks                            | `#2B5C8A` |
| `--dw-link-hover`        | Textlinks bei Hover oder Drücken     | `#234E75` |
| `--dw-selection-bg`      | Zurückhaltende Auswahlfläche         | `#EAF1F8` |
| `--dw-selection-fg`      | Text und Icons ausgewählter Elemente | `#2B5C8A` |
| `--dw-selection-border`  | Zusätzliche sichtbare Auswahlkontur  | `#2B5C8A` |
| `--dw-focus-ring`        | Tastaturfokus                        | `#0B5FFF` |

Blau wird sparsam eingesetzt. Vollflächen sind hauptsächlich für die führende
Aktion des jeweiligen Entscheidungskontexts vorgesehen. Navigation und
Auswahl verwenden helle Flächen und eine zusätzliche sichtbare Markierung.

Textlinks im Inhalt MÜSSEN unterstrichen sein. Die Unterstreichung bleibt auch
ohne Hover sichtbar. Navigationslinks und als Schaltfläche gestaltete Links
erhalten ihre Erkennbarkeit durch die jeweilige Komponentenform.

Innerhalb der Arbeitsanwendung gibt es keine zusätzliche violette
Visited-Farbe. Ein besuchter Projektlink behält die Linkrolle des Themes.

### 3.3 Status und destruktive Aktionen

| Bedeutung   | Vordergrund-Token / Wert     | Hintergrund-Token / Wert     |
| ----------- | ---------------------------- | ---------------------------- |
| Information | `--dw-info-fg`: `#245C83`    | `--dw-info-bg`: `#ECF3F9`    |
| Erfolg      | `--dw-success-fg`: `#276749` | `--dw-success-bg`: `#EBF5EF` |
| Warnung     | `--dw-warning-fg`: `#8A5700` | `--dw-warning-bg`: `#FFF4DB` |
| Fehler      | `--dw-error-fg`: `#B42318`   | `--dw-error-bg`: `#FEF3F2`   |

| Token                        | Rolle                                       | Wert      |
| ---------------------------- | ------------------------------------------- | --------- |
| `--dw-danger-bg`             | Gefüllte destruktive Bestätigung            | `#B42318` |
| `--dw-danger-bg-hover`       | Hover dieser Bestätigung                    | `#912018` |
| `--dw-danger-bg-pressed`     | Gedrückte destruktive Bestätigung           | `#751A14` |
| `--dw-danger-fg`             | Text und Icons auf gefülltem Danger-Button  | `#FFFFFF` |
| `--dw-danger-text`           | Destruktive Textaktion und Danger-Kontur    | `#B42318` |
| `--dw-danger-subtle-hover`   | Hover einer ungefüllten destruktiven Aktion | `#FEF3F2` |
| `--dw-danger-subtle-pressed` | Gedrückte ungefüllte destruktive Aktion     | `#FEE4E2` |

Statusmeldungen MÜSSEN ihre Bedeutung mit Text benennen. Farbe und Icons
ergänzen die Aussage. Nicht jede erfolgreiche Bedienhandlung benötigt eine
grüne Meldung; dauerhafte Statusangaben und relevante Rückmeldungen genügen.

Die gemeinsame rote Farbfamilie verbindet Fehler und destruktive Bedeutung.
Die dafür vorgesehenen Tokens bleiben trotzdem getrennt. Normale
Projektlinks, Optionalzusätze und aktive Navigation sind nicht rot.

### 3.4 Geltungsbereich und Kontrast

Diese Palette definiert ein **helles Theme**. Ein Betriebssystem-Dark-Mode
darf sie nicht automatisch teilweise umfärben. Ein späteres dunkles Theme
benötigt vollständige Farbpaare und eine eigene Prüfung.

Das Qualitätsziel ist WCAG 2.2 AA für die umgesetzte Oberfläche. Für normalen
Text gilt grundsätzlich mindestens 4.5:1. Für zur Erkennung notwendige
Control- und Zustandsmerkmale gilt grundsätzlich mindestens 3:1 gegen
angrenzende Farben. Die jeweiligen normativen Ausnahmen bleiben zu beachten;
dekorative Linien müssen nicht pauschal 3:1 erreichen. [1][2]

Deaktivierte Controls bleiben nach dem eigenen Gestaltungsziel gut lesbar,
auch wenn die WCAG für inaktive Komponenten Ausnahmen vorsieht. Eine pauschale
Reduktion der Opazität des gesamten Controls ist nicht zulässig.

Berechnete Farbpaare sind im Anhang dokumentiert. Sie ersetzen keine Prüfung
der zusammengesetzten Komponenten, ihrer Zustände und des tatsächlichen
Hintergrunds.

## 4. Typografie

### 4.1 UI-Schrift und Auslieferung

Die UI verwendet **Source Sans 3 als Variable Font**. Die Familie ist für
Benutzeroberflächen ausgelegt und unter OFL-1.1 verfügbar. Die offizielle
variable Datei unterstützt Gewichte von 200 bis 900. [4][5]

Die Anwendung MUSS die tatsächlich verwendeten Gewichte 400, 500 und 600
bereitstellen. Die variable Datei ist der Standardweg. Statische Dateien
sind nur zulässig, wenn alle verwendeten Gewichte tatsächlich enthalten sind.
Ein fehlender Schnitt darf nicht durch eine irreführende Gewichtszuordnung
oder künstlich erzeugte Fettschrift kaschiert werden.

Die konkrete Fontversion beziehungsweise der verwendete Release-Commit wird
im Repository fixiert. Quelle, Version, Originaldateinamen, Lizenz und lokale
Assetpfade werden in `FONT_PROVENANCE.md` dokumentiert. Lizenztexte werden mit
den Assets ausgeliefert. Die frühere kantonale Frutiger-Lizenzbestätigung ist
keine Herkunftsdokumentation für diese neutrale Variante.

Fonts werden lokal als WOFF2 ausgeliefert. In der produktiven Anwendung gibt
es keine externen Fontabrufe. Asset-URLs werden relativ beziehungsweise über
den konfigurierten Build-Basispfad aufgelöst, damit `/lab/` funktioniert.

Font-Stack:

```css
font-family:
  'Source Sans 3',
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

`font-display: swap` erhält die sofortige Lesbarkeit. Der System-Fallback
MUSS funktionsfähig bleiben. Webfont und Fallback dürfen keine abgeschnittenen
Labels oder unbedienbaren Controls verursachen.

### 4.2 Grössen, Gewichte und Zeilenhöhen

Die Pixelangaben beziehen sich auf eine Basis von 16 px bei 100 % Zoom.
Textgrössen werden bevorzugt in `rem` umgesetzt; die Schriftgrösse des
Browser-Root-Elements wird nicht verkleinert.

| Verwendung                           | Grösse            | Gewicht | Zeilenhöhe       |
| ------------------------------------ | ----------------- | ------- | ---------------- |
| Seitentitel                          | 28 px / 1.75 rem  | 600     | 1.25             |
| Abschnittstitel                      | 1.42857143 (20 px bei 14 px Schrift)  | 600     | 1.4              |
| Produktname im Header                | 18 px / 1.125 rem | 500     | 1.4              |
| Standardtext, normale Tabellenzellen | 16 px / 1 rem     | 400     | 1.5              |
| Navigation                           | 14 px / 0.875 rem | 500     | 1.4              |
| Formularlabel                        | 14 px / 0.875 rem | 500     | 1.42857143 (20 px bei 14 px Schrift) |
| Hilfetext                            | 14 px / 0.875 rem | 400     | 1.5              |
| Standardbutton                       | 16 px / 1 rem     | 500     | 1.25             |
| Kompakter Button, kompakte Bedienung | 14 px / 0.875 rem | 500     | 1.3              |
| Tabellenkopf                         | 14 px / 0.875 rem | 600     | 1.4              |
| Nachgeordnete Metadaten, Statusbadge | 12 px / 0.75 rem  | 400     | 1.5              |

Die Zeilenhöhen skalieren mit der jeweiligen Schriftgrösse. Labels verwenden
`line-height: 1.42857143` statt einer festen Pixel- oder rem-Zeilenhöhe, damit
mehrzeilige Labels bei Textvergrösserung nicht überlappen.

Gewicht 700 DARF für gezielte inhaltliche Hervorhebung verwendet werden.
Gewichte 800 und 900 sind für die Bedienoberfläche nicht vorgesehen.
Formularlabels und Buttons werden nicht pauschal fett dargestellt.

12-px-Text bleibt auf nachgeordnete Metadaten beschränkt. Fehlertexte,
notwendige Bedienhinweise und wesentliche Formularinformationen verwenden
mindestens die Hilfetextgrösse.

Beschriftungen verwenden normale Gross- und Kleinschreibung. Keine
flächendeckenden Grossbuchstaben und kein zusätzliches Letterspacing für
Buttons oder Tabellenköpfe. Überschriftenhierarchie und HTML-Heading-Level
richten sich nach der inhaltlichen Struktur.

### 4.3 Code, Konsole und Zahlen

Code und Konsole verwenden lokal **JetBrains Mono 2.304, OFL-1.1**, entsprechend
dem vorhandenen Bestand. Herkunft und Lizenz werden eigenständig dokumentiert;
die neutrale Anwendung benötigt dafür keinen Verweis auf ein anderes Portal.

Der Editor startet mit 14 px. Die vorhandene Einstellung von 12–22 px bleibt
erhalten. Codeinhalte dürfen horizontal scrollen und werden nicht automatisch
typografisch umgeschrieben.

Zahlenkolonnen verwenden bei Unterstützung der Schrift
`font-variant-numeric: tabular-nums`. Die Ausrichtung folgt dem logischen
Datentyp; numerisch aussehende Identifikatoren werden nicht automatisch als
Messwerte behandelt.

### 4.4 UI-Kurztexte, Informationshierarchie und Trennzeichen

Die Oberfläche SOLL Informationen in verständlicher Sprache und erkennbarer
Hierarchie vermitteln. **Der Mittelpunkt (`·`) ist kein allgemeines
Trennzeichen für Status, Kennzahlen oder Metadaten.** Verkettete Kurztexte nach
dem Muster `Information · Information · Information` werden vermieden. Sie
werden nicht lediglich durch senkrechte Striche, Schrägstriche oder Gedankenstriche
ersetzt; die Gliederung richtet sich nach Inhalt und Bedeutung.

| Art der Information | Bevorzugte Darstellung |
| --- | --- |
| Hinweis oder Erklärung | Ein kurzer, vollständiger Satz, der die praktische Bedeutung erklärt. |
| Ergebnis oder Status | Eine eindeutige Hauptaussage; zusätzliche Lauf-, Revisions- oder Diagnosewerte sind visuell nachgeordnet. |
| Mehrere Kennzahlen oder Eigenschaften | Klar beschriftete Label-Wert-Paare, bei Bedarf als kompakte Gruppe oder Definition List (`<dl>`). |
| Technische Metadaten | Sekundärtext oder eine zugängliche Detailansicht; keine Wiederholung des bereits sichtbaren Kontexts. |
| Mehrere zusammengehörige Bedienelemente | Räumliche Gruppierung und Abstände gemäss Abschnitt 5 statt Trennzeichen im Text. |

Für die Textgestaltung gelten folgende Regeln:

- Informationen SOLLEN **nicht allein durch Satzzeichen aneinandergereiht**
  werden. Zusammenhänge werden durch Sätze, eindeutige Beschriftungen und
  passende Abstände sichtbar gemacht. Einfache Metadaten dürfen nebeneinander
  stehen, wenn ihre Zuordnung und Hierarchie ohne Separator eindeutig bleiben.
- Der **wichtigste Sachverhalt steht zuerst**: etwa, ob eine Ausführung
  erfolgreich war. Laufzeit, Revision oder andere Kontextwerte erscheinen
  kleiner beziehungsweise in `text-secondary` und dürfen auf eine zweite Zeile
  oder in eine Detailansicht wechseln.
- **Redundante Angaben entfallen.** In einem eindeutig als SQL gekennzeichneten
  Bereich ist eine zusätzliche Präfixangabe „SQL“ vor der Revisionsnummer
  normalerweise unnötig.
- Der Text SOLL **knapp, aber nicht telegrammartig** sein. Ein verständlicher
  Satz ist einer Folge isolierter Stichwörter vorzuziehen, wenn eine Aussage
  erklärt oder ein Ergebnis beurteilt werden muss.
- Label-Wert-Gruppen SOLLEN eine **konstante Reihenfolge, eindeutige
  Beschriftungen und semantisch zusammengehöriges HTML** verwenden. Für
  mehrere Eigenschaften bietet sich `<dl>` mit `<dt>` und `<dd>` an.
  Reine CSS-Abstände ersetzen nicht die zugängliche Zuordnung der Werte.
- Einheiten, Zahlenpräzision und fachliche Unterscheidungen bleiben erhalten.
  Die sprachliche Vereinfachung DARF weder einen erfolgreich geprüften
  Datenbestand noch eine vollständige Integritätsprüfung vortäuschen, wenn
  beispielsweise eine Hashprüfung noch aussteht.
- Der Mittelpunkt DARF dort stehen bleiben, wo er **inhaltlich selbst zum
  Ausdruck gehört**, beispielsweise in Formeln, Datenwerten oder technischen
  Originaltexten. Diese Ausnahme gilt nicht als Erlaubnis für verkettete
  Meldungen der Benutzeroberfläche.

Beispiele für die Anwendung der Regeln (inhaltlich illustrativ):

| Vermeidbares Textmuster | Bessere Darstellung |
| --- | --- |
| `Lokal im Browser · Browserdaten sind kein Backup.` | „Die Daten werden lokal in diesem Browser gespeichert und nicht automatisch gesichert.“ |
| `Erfolgreich · Revision 56 · 53 ms` | „Ausführung erfolgreich“ als Hauptaussage; darunter oder daneben nachgeordnet „Revision 56“ und „Laufzeit 53 ms“. |
| `SQL · Revision 56` | „Revision 56“, wenn „SQL“ bereits aus der Ansicht hervorgeht. |
| `0 fehlende · 0 beschädigte · 0 verwaiste Dateien` | „Bei der Inventarprüfung wurden keine fehlenden, beschädigten oder verwaisten Dateien festgestellt.“ Noch ausstehende Prüfungen separat benennen. |

**Darstellungsdichte:** In einer schmalen Werkzeugleiste DARF eine Hauptaussage
neben einer kurzen sekundären Angabe stehen. Sind mehrere Angaben erforderlich,
werden sie in einer geordneten Metadatengruppe angezeigt oder in zugängliche
Details verlagert. Die Oberfläche erhält dadurch nicht automatisch zusätzliche
Badges, farbige Hinweisboxen oder Karten. Bei wenig Platz dürfen Zeilen
umbrechen; relevante Inhalte bleiben erreichbar und werden nicht bloss im
Tooltip versteckt.

Semantisches Beispiel für eine kleine Metadatengruppe:

```html
<dl class="dw-meta-list">
  <dt>Revision</dt>
  <dd>56</dd>
  <dt>Laufzeit</dt>
  <dd>53 ms</dd>
</dl>
```

Die Basisgestaltung für `dw-meta-list` steht in `src/styles/app.css`.
Zusammengehörige Label-Wert-Paare dürfen in einem `div` gruppiert werden, damit
sie in kompakten Werkzeugleisten nebeneinander stehen und bei Bedarf umbrechen.
Die Liste ist ein Darstellungsbeispiel und begründet keine neue fachliche Komponente.

## 5. Abstände, Grössen und Oberflächen

Verbindliches Abstandsraster: **4, 8, 12, 16, 20, 24, 32, 40, 48 und 64 px**.

| Beziehung                             | Abstand                   |
| ------------------------------------- | ------------------------- |
| Icon–Text                             | 8 px                      |
| Benachbarte Aktionen derselben Gruppe | 8 px in beiden Richtungen |
| Unterschiedliche Aktionsgruppen       | 16 px                     |
| Label–Control                         | 8 px                      |
| Control–Hilfetext oder Fehlermeldung  | 8 px                      |
| Formularfelder                        | 16 px                     |
| Inhaltsabschnitte                     | 32 px                     |
| Dialoginnenraum, normaler Inhaltsrand | 24 px                     |
| Inhaltsrand bei schmalem Viewport     | 16 px                     |

Aktionsgruppen verwenden Layout-`gap` und dürfen umbrechen. Leerzeichen,
leere Elemente und individuelle Button-Margins werden nicht zur
Layoutsteuerung verwendet. Zusammengehörige Aktionen behalten beim Umbruch
ihre Reihenfolge und mindestens 8 px Abstand.

| Element                              | Vorgabe                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| Standardcontrol                      | Mindestens 40 px hoch                                     |
| Kompaktes Control                    | Mindestens 32 px hoch; für dichte Arbeitsbereiche         |
| IconButton / Navigation im Standard  | Mindestens 40 × 40 px                                     |
| Bedienziel bei grobem Zeiger / Touch | Mindestens 44 × 44 px wirksame, nicht überlappende Fläche |
| Controls, Menüs und Dialoge          | 4 px Radius                                               |
| Einfache Kontur                      | 1 px                                                      |
| Auswahlkontur                        | 2 px innenliegend, ohne Layoutverschiebung                |
| Fokus                                | 3 px Ring mit 2 px Abstand                                |

Controlhöhen sind Mindesthöhen. Mehrzeilige oder vergrösserte Texte dürfen die
Höhe vergrössern. Buttons und relevante Labels werden nicht abgeschnitten.
Komprimierte Tabellen- und Editorbereiche dürfen ihre passende Dichte
behalten; eine zusätzliche kompakte Variante wird nicht global erzwungen.

Schatten sind ausschliesslich für schwebende Menüs, Tooltips, Popover und
Dialoge zulässig. Normale Inhaltsabschnitte erhalten keine Schatten.

## 6. Buttons, Links und Aktionsgruppen

### 6.1 Gewichtung und Bedeutung

Der öffentliche Komponentenvertrag trennt Gewichtung und Bedeutung:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonTone = 'default' | 'danger';
type ControlSize = 'default' | 'compact';
```

`variant` beschreibt die Hervorhebung. `tone` beschreibt eine gegebenenfalls
destruktive Bedeutung. Unbenannte Sondervarianten einzelner Bildschirmseiten
sind nicht vorgesehen. `IconButton` verwendet dieselben Rollen.

Die vorhandene Variante `ghost` wird bei der Migration auf `tertiary`
abgebildet. Das bisherige `danger` wird auf eine explizite Kombination von
`variant` und `tone="danger"` überführt. Ein interner Übergangsadapter DARF
bestehende Aufrufer vorübergehend kompatibel halten.

### 6.2 Normale Aktionen

| Variante  | Standard                                                | Hover                                   | Gedrückt            |
| --------- | ------------------------------------------------------- | --------------------------------------- | ------------------- |
| Primary   | `action-bg`, Text/Icon `action-fg`, transparente Kontur | `action-bg-hover`                       | `action-bg-pressed` |
| Secondary | `surface`, Text/Icon `text`, Kontur `border-control`    | `surface-hover`, Kontur bleibt sichtbar | `surface-pressed`   |
| Tertiary  | Transparent, Text/Icon `text`, transparente Kontur      | `surface-hover`                         | `surface-pressed`   |

Die Rollen in den Tabellen bezeichnen jeweils das gleichnamige `--dw-`-Token.
Text und Icons einer Schaltfläche verwenden dieselbe Vordergrundrolle.
Farbliche Betonung von Tertiary-Aktionen ist kein zusätzlicher Standard.

Pro zusammengehörigem Entscheidungskontext SOLL genau eine visuell führende
Aktion vorhanden sein. Es müssen nicht auf jeder Seite alle drei Varianten
vorkommen.

| Kontext                             | Führende Aktion                                        | Nachgeordnete Aktionen                                                  |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| Projektliste                        | „Neues Projekt“ als Primary                            | „Projekt öffnen“ als Secondary; weitere Werkzeuge als Tertiary          |
| SQL-/R-Arbeitsbereich               | „Ausführen“ als Primary                                | „Speichern“ als Secondary; Ansicht und weitere Aktionen nachgeordnet    |
| Formular oder Dialog zum Bearbeiten | Abschliessendes „Speichern“ / „Übernehmen“ als Primary | „Abbrechen“ als Secondary                                               |
| Projektdatei und Speicher           | Aufgabenabhängig; keine erzwungene Primary-Aktion      | Exportieren, Duplizieren, Integrität prüfen als Secondary oder Tertiary |

### 6.3 Destruktive Aktionen

| Variante mit `tone="danger"` | Standard                                      | Hover                 | Gedrückt                |
| ---------------------------- | --------------------------------------------- | --------------------- | ----------------------- |
| Primary                      | `danger-bg`, Text/Icon `danger-fg`            | `danger-bg-hover`     | `danger-bg-pressed`     |
| Secondary                    | `surface`, Text/Icon und Kontur `danger-text` | `danger-subtle-hover` | `danger-subtle-pressed` |
| Tertiary                     | Transparent, Text/Icon `danger-text`          | `danger-subtle-hover` | `danger-subtle-pressed` |

„Projekt löschen“ steht räumlich getrennt von häufigen Arbeitsaktionen und
erscheint dort als Secondary oder Tertiary mit Danger-Bedeutung. Eine gefüllte
rote Hauptaktion ist für die abschliessende destruktive Bestätigung vorgesehen.
Bestehende Bestätigungen, Sperren und Löschregeln bleiben wirksam. Diese
Spezifikation autorisiert keine Änderung des Löschverhaltens.

### 6.4 Technische und sprachliche Regeln

- Ein Button ist standardmässig `type="button"`; Formular-Submit wird explizit
  als `type="submit"` gesetzt.
- Eine Aktion wird mit einem Button ausgelöst. Ein Wechsel zu einer anderen
  Ansicht verwendet einen Link mit gültigem Ziel.
- Beschriftungen benennen die Aktion: „Projekt öffnen“, „Ausführen“,
  „Änderungen speichern“. Unklare Bezeichnungen wie „OK“ werden vermieden,
  wenn die konkrete Aktion benannt werden kann.
- Icon-only-Aktionen benötigen einen zugänglichen Namen und einen Tooltip.
  Ein Icon ersetzt keine unklare Aktionsbeschriftung.
- Aktionsgruppen haben eine logisch konsistente Reihenfolge. DOM- und
  sichtbare Reihenfolge stimmen überein.
- Ein Link wird nicht mit `href="#"` als Aktionsbutton verwendet.

### 6.5 Musterwahl: direkte Aktion, MenuButton, SplitButton und ActionMenu

Die Anzahl sichtbarer Buttons wird nicht durch möglichst viele Menüs minimiert.
Die **Häufigkeit, fachliche Zusammengehörigkeit und Vorhersagbarkeit** einer
Aktion bestimmen ihre Darstellung. Verwandte Funktionen dürfen zusammengefasst
werden; wichtige oder zeitkritische Aktionen bleiben unmittelbar erreichbar.

| Muster | Verhalten | Geeigneter Einsatz |
| --- | --- | --- |
| `Button` | Aktivierung führt die beschriftete Aktion unmittelbar aus. | Einzelne, häufige oder führende Aktion. |
| `MenuButton` | Der gesamte Button öffnet ein Menü; er führt selbst keine fachliche Aktion aus. | Mehrere gleichwertige Aktionen ohne sinnvollen Standard. |
| `SplitButton` | Hauptfläche führt die ausdrücklich beschriftete Standardaktion aus; separater Pfeil öffnet alternative Ausführungen derselben Aktion. | Eine klar dominierende Standardaktion mit wenigen eng verwandten Varianten. |
| `ActionMenu` (Overflow-Menü) | Beschriftung „Weitere Aktionen“ oder ein eindeutig benanntes Drei-Punkte-Icon öffnet untergeordnete Aktionen. | Selten genutzte, kontextuelle oder administrative Aktionen. |

- Ein `SplitButton` ist **kein** gewöhnlicher Dropdown-Button: Seine Hauptfläche
  führt sofort eine Aktion aus. Bei einem `MenuButton` und `ActionMenu` öffnet
  jede Aktivierung zunächst nur das Menü.
- Ein `SplitButton` SOLL nur verwendet werden, wenn die Standardaktion aus
  Nutzersicht naheliegt und die Menüeinträge Varianten **derselben Operation**
  sind, beispielsweise verschiedene Ausgabeformate. Gleichrangige Wege zu
  einem Ziel rechtfertigen keinen willkürlichen Standard; dafür ist ein
  `MenuButton` vorgesehen.
- Zusammengehörige Aktionen werden nicht allein deshalb in einem
  `SplitButton` gruppiert, weil sie auf derselben Werkzeugleiste stehen.
  Ansichtsumschaltung, Zustandsauswahl und Navigation werden bei Bedarf als
  Tabs, Auswahl-Controls oder Links gestaltet, nicht als Split-Aktionen.
- Ein Overflow-Menü SOLL keine regelmässig benötigten Hauptaktionen verstecken.
  Bei nur einer untergeordneten Aktion ist ein direkt sichtbarer Tertiary-Button
  in der Regel verständlicher, sofern der verfügbare Platz dies zulässt.
- Einträge mit destruktiver Bedeutung werden **nicht** als Varianten einer
  harmlosen Split-Hauptaktion angeboten. In Menüs bleiben sie sprachlich
  eindeutig, erhalten die Danger-Rolle und respektieren vorhandene
  Bestätigungs- und Berechtigungsregeln.

### 6.6 MenuButton und SplitButton: sichtbarer Aufbau

`MenuButton` und `SplitButton` übernehmen `variant`, `tone` und `size` aus
Abschnitt 6.1 und verwenden die vorhandenen semantischen Tokens. Sie begründen
keine neue Aktionsfarbe oder Buttongewichtung.

**MenuButton:** Er besteht aus einer beschrifteten Schaltfläche mit optionalem
nach unten zeigendem Chevron (`chevron-down`). Die Beschriftung beschreibt die
Aktionsfamilie, zum Beispiel „Exportieren“; sie verspricht keine sofortige
Ausführung. Das ganze Control ist eine einzige interaktive Schaltfläche.

**SplitButton:** Er besteht aus zwei unmittelbar verbundenen, **separat
fokussierbaren** nativen Buttons. Links steht die konkrete Hauptaktion,
rechts der Menüauslöser mit Chevron. Ein Klick auf die Hauptfläche führt
**ohne Menüöffnung** genau die beschriftete Aktion aus; ein Klick auf den Pfeil
öffnet **ohne Ausführung** das Variantenmenü. Zwischen beiden Flächen liegt
lediglich eine feine Trennung. Es gibt keinen Abstand wie zwischen
unabhängigen Buttons. Aussenkontur und äussere Radien bilden optisch ein
zusammenhängendes Control; innere Ecken sind nicht gerundet.

- Der Menüauslöser eines `SplitButton` MUSS einen aussagekräftigen zugänglichen
  Namen besitzen, etwa „Weitere Exportformate“. Der Chevron allein genügt
  nicht. Nur dieser zweite Button erhält die Menü-ARIA-Eigenschaften; die
  Hauptaktion bleibt ein normaler Button.
- Der Hauptbutton führt eine **stabile** Standardaktion aus. Die Hauptaktion
  darf nach Wahl eines Menüeintrags nicht unbemerkt auf „zuletzt verwendet“
  umschalten. Eine ausdrücklich einstellbare Standardaktion wäre eine separate,
  sichtbar erklärte Produktfunktion, nicht das Standardverhalten.
- Beide Teilflächen behalten eine eigenständige Tastatur-Fokusmarkierung,
  verständliche Hover-/Pressed-Zustände und die im Designsystem festgelegten
  Mindestgrössen. Auch der Pfeilauslöser muss mit grobem Zeiger ausreichend
  gross bedienbar sein; eine schmale dekorative Pfeilfläche ist nicht zulässig.
- Disabled- und Busy-Zustände werden **aktionsbezogen** gehandhabt: Eine
  laufende Hauptaktion verhindert Doppelaufrufe; weiterhin zulässige
  Alternativen dürfen erreichbar bleiben. Ein vollständiges Deaktivieren der
  Gruppe ist nur zulässig, wenn keine ihrer Aktionen verfügbar ist. Die
  Gründe sind bei Bedarf zugänglich erklärbar.
- Wenn keine Alternativen vorhanden sind, wird aus einem `SplitButton` ein
  normaler `Button`. Ein leeres Menü oder ein dauerhaft funktionsloser Pfeil
  wird nicht angezeigt.

### 6.7 ActionMenu (Overflow) und gemeinsame Menüinfrastruktur

`ActionMenu` bleibt der Name für das bestehende Menü mit untergeordneten
Aktionen. In einer Werkzeugleiste ist „Weitere Aktionen“ eine verständliche
Beschriftung. In engen Tabellenzeilen DARF ein Icon-only-Button mit lokalem
Bootstrap-Icon `three-dots` verwendet werden, sofern sein zugänglicher Name
präzise ist, zum Beispiel „Aktionen für [Elementname]“. Ein solches
Overflow-Menü besitzt **keine** direkt ausführbare Standardaktion.

`MenuButton`, der Menüpfeil eines `SplitButton` und `ActionMenu` SOLLEN dieselbe
Menüinfrastruktur und dieselben Regeln aus Abschnitt 10.2 verwenden. Die
Muster unterscheiden sich im Auslöser und in der Auswahl der Aktionen,
**nicht** in der Tastatur- oder Fokuslogik. Damit entsteht keine parallele
Implementierung für jede Buttonart.

Gemeinsame visuelle Regeln:

- Menüflächen verwenden `surface`, Text `text`, passende Hover-/Fokusrollen,
  den vorhandenen Controlradius und einen Schatten ausschliesslich auf dem
  schwebenden Menü. Lange Einträge dürfen lesbar umbrechen.
- Menügruppen dürfen durch neutrale Trennlinien gegliedert werden. Einträge
  besitzen aussagekräftige Beschriftungen und ein ausreichend grosses
  Bedienziel; reine Icons sind im Menü nicht der Standard.
- Menüs überlagern die Arbeitsfläche, verändern ihr Layout nicht und werden an
  den Viewportgrenzen umpositioniert. Eine seitliche oder vertikale
  abgeschnittene Darstellung ist nicht zulässig.

Die Einbindung neuer Muster ändert **keine** fachlichen Abläufe, Dialoge,
Autorisierungsregeln oder Bestätigungen. Die Entscheidung, welche konkreten
Aktionen unter welchem Auslöser erscheinen, bleibt Sache der jeweiligen Ansicht.

## 7. Zustände und ihr Zusammenspiel

| Zustand                   | Bedeutung                             | Verbindliches Verhalten                                                                                           |
| ------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `hover`                   | Zeiger befindet sich über dem Element | Definierte Hover-Fläche; keine Layoutverschiebung                                                                 |
| `pressed` / CSS `:active` | Momentanes Drücken                    | Definierte dunklere beziehungsweise neutrale Pressed-Fläche                                                       |
| `focus-visible`           | Sichtbarer Tastaturfokus              | 3-px-Fokusring mit 2 px Abstand; bestehende Auswahl oder Fehlerkontur bleibt erkennbar                            |
| `selected`                | Dauerhafte Auswahl                    | Auswahlfläche und zusätzliche sichtbare Form/Kontur; passende Semantik, z. B. `aria-selected` oder `aria-pressed` |
| `current`                 | Aktuelles Navigationsziel             | Auswahlgestaltung plus `aria-current="page"` am Navigationslink                                                   |
| `disabled`                | Derzeit nicht bedienbar               | Explizite Disabled-Farben, keine Hover-/Pressed-Reaktion; native Semantik, wo möglich                             |
| `busy`                    | Vorgang läuft                         | Verständlicher Lauftext, Schutz vor Doppelaktionen und passende Busy-Semantik                                     |

`pressed`, `selected` und `current` sind unterschiedliche Zustände. Ein normaler
Aktionsbutton erhält kein `aria-pressed`, nur weil er kurz gedrückt wird.

### 7.1 Deaktiviert

Deaktivierte Buttons verwenden `disabled-bg`, `disabled-text` und bei einer
konturierten Variante weiterhin `border-control`. Eine deaktivierte
Tertiary-Aktion bleibt transparent und verwendet `disabled-text`.

Native Buttons und Formularelemente verwenden `disabled`, wenn sie tatsächlich
deaktiviert sind. Ein erklärender Hinweis steht bei Bedarf ausserhalb des
deaktivierten Elements, damit seine Erreichbarkeit nicht von dessen Fokus
abhängt. Ein Navigationslink erhält keine wirkungslose `disabled`-Eigenschaft.

### 7.2 Laufende Vorgänge

Ein laufender Vorgang verhindert erneute gleichartige Auslösung. Dieser Schutz
MUSS auch im Aktions- beziehungsweise Submit-Handler gelten und darf nicht nur
auf der Darstellung beruhen.

Die auslösende Schaltfläche zeigt einen passenden Lauftext, beispielsweise
„Wird ausgeführt …“, und kann ein ergänzendes dekoratives Fortschrittsicon
anzeigen. Text und Spinner dürfen sich nicht gegenseitig ersetzen.
`aria-busy` wird am passenden Vorgangs- oder Ergebnisbereich gesetzt.

Soll der Fokus auf der auslösenden Schaltfläche erhalten bleiben, kann diese
während des Vorgangs `aria-disabled="true"` statt eines Fokusverlusts durch
native Deaktivierung verwenden. In diesem Fall MÜSSEN Maus-, Tastatur- und
Formularauslösung tatsächlich blockiert werden. ARIA allein blockiert keine
Aktion. Die Busy-Gestaltung behält eine gut lesbare Rollenfarbgebung.

„Abbrechen“ bleibt erreichbar und aktiv, soweit der Vorgang fachlich
abgebrochen werden kann. Eine globale Blockade aller Controls ist nicht
vorgesehen. Bestehende fachliche Sperren bleiben erhalten.

### 7.3 Prioritäten

Disabled und Busy unterdrücken unzulässige Hover-/Pressed-Aktionen. Ein
bedienbares ausgewähltes Element behält bei Hover seine Auswahlkontur. Ein
Fokusring wird zusätzlich dargestellt und überschreibt weder Auswahl noch
Fehlerzustand. Ein ungültiges fokussiertes Feld behält seine Fehlerkontur und
erhält den äusseren Fokusring.

## 8. Formulare und Labels

Labels stehen sichtbar, linksbündig und oberhalb des Controls. Sie verwenden
`text` und Gewicht 500. IDs und `htmlFor` verbinden Label und Control;
vorhandene IDs bleiben bei der Migration erhalten.

Hilfetext folgt darunter in 14 px, Gewicht 400 und `text-secondary`.
Placeholder ersetzt kein Label. Ein Placeholder, sofern sinnvoll, zeigt ein
Beispiel und verwendet eine gut lesbare Textrolle.

Erforderliche Felder tragen keinen sichtbaren Zusatz und behalten ihre native
`required`-Semantik.
Optionale Felder zeigen direkt hinter dem Label „(optional)“ in
`text-secondary`, Gewicht 400 und derselben Schriftgrösse. Der Zusatz wird
über `aria-describedby` vermittelt; der zugängliche Feldname bleibt stabil.
Es gibt keine Sternchen und keine Pflichtfeldhinweise. `FormField.optional`
wird explizit gesetzt; gewöhnliche Optionscheckboxen, Navigation und fest
vorgegebene/deaktivierte Werte erhalten keinen Zusatz. Stringparameter zeigen
ihren Optionalzusatz pro Werteingabe, auch bei ausgeblendeten Labels;
NULL deaktiviert die Werteingabe ohne Zusatz. Die fachlichen Regeln bleiben
unverändert. Feldfehler verschieben benachbarte Aktionsbuttons nicht gegenüber
der Eingabe; bei schmaler Projekterstellung folgt der Button unter der Feldgruppe.

Als optional gekennzeichnet werden Beschreibung, Zufallsseed, «Text für fehlende
Werte» beim CSV-Import, Diagrammkategorie und Stringparameterwerte. Die deaktivierte
NULL-Werteingabe erhält keinen Zusatz. Benötigte Zahlen- und andere typisierte
Parameterwerte bleiben erforderlich. „Projekt öffnen“, Navigationsauswahlen
und fest vorgegebene SQL-Namen erhalten keinen Optionalzusatz. Für die Portal-ID
bleibt der aktionsbezogene Hinweis „für Kontext laden erforderlich“ massgeblich;
Indexsuche und aufgelöste Deep Links verlangen keine zusätzliche Eingabe.

Die Projekterstellung verwendet gemeinsame Rasterzeilen für Label, Eingabe und
Fehler. Der Button steht in der Eingabezeile; mehrzeilige Fehler darunter
verändern seine Ausrichtung nicht. Analysewerkzeugleisten halten ihre Buttons
ebenfalls an der Eingabe ausgerichtet. Feste Fehlerhöhen, leere Platzhalter und
individuelle Pixelversätze werden nicht als Ausgleich verwendet.

| Feldzustand      | Gestaltung                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Standard         | `surface`, Text `text`, Kontur `border-control`                                                                                      |
| Hover            | Kontur `border-control-hover`                                                                                                        |
| Fokus            | Vorhandene Kontur plus Fokusring                                                                                                     |
| Fehler           | Kontur und Fehlermeldung `error-fg`; zusätzliche Textbeschreibung                                                                    |
| Schreibgeschützt | `surface-subtle`, Text `text`, erkennbare Kontur; Inhalt bleibt fokussier- und kopierbar, soweit das native Control dies unterstützt |
| Deaktiviert      | `disabled-bg`, Text `disabled-text`, native Deaktivierung                                                                            |

Fehlermeldungen nennen das konkrete Problem und werden über
`aria-describedby` dem Feld zugeordnet. `aria-invalid="true"` kennzeichnet
ungültige Eingaben. Bestehender Hilfetext und Fehlertext können gemeinsam
referenziert werden. Validierung erzeugt keine Live-Meldung pro Tastendruck.
Vorübergehendes Leeren bleibt während der Bearbeitung möglich. Geprüft wird
beim Verlassen eines bearbeiteten Felds und vor der zugehörigen Aktion. Während
des Tippens entstehen keine neuen Fehler; ein vorhandener Fehler verschwindet,
sobald der Wert gültig ist. Ungültige Entwürfe bleiben zur Korrektur erhalten,
im Projektdokument bleibt der letzte gültige Wert. Eine fehlgeschlagene Aktion
fokussiert das erste ungültige aktive Feld; Blur erzwingt keinen Fokuswechsel.
Formulare mit eigener Feldvalidierung verwenden `noValidate` und behalten
`required`. Eingabefehler erzeugen keinen zusätzlichen globalen Fehlerbanner.
Netzwerk-, Engine- und Speicherfehler verwenden weiterhin ihre eigenen Wege.

Checkboxen und Radiobuttons stehen links; die anklickbare Beschriftung folgt
rechts mit 8 px Abstand und Gewicht 400. Mehrzeilige Texte dürfen umbrechen.
Die gesamte Label-Fläche ist anklickbar. Haken, Auswahlpunkte und Konturen
bleiben ausreichend kontrastreich.

Der Analysename in SQL-/R-Werkzeugleisten besitzt ein sichtbares kompaktes
Inline-Label. Nur Parametertabellen dürfen ihre eindeutigen Feldlabels visuell
ausblenden, weil sichtbare Spaltenköpfe den Kontext vermitteln. Der Optionalzusatz
bei Stringwerten bleibt dann sichtbar neben der betreffenden Werteingabe.
Normale Formulare behalten sichtbare Labels oberhalb des Controls.

## 9. Meldungen, Badges und leere Zustände

### 9.1 Notice und Fehlermeldung

Eine Notice verwendet das zugehörige Statusfarbpaar und verständlichen Text.
Ein passendes Icon kann die Bedeutung ergänzen. Dekorative linke Rahmen und
Akzentstriche werden nicht verwendet.

Eine Notice SOLL einen beachtenswerten Zustand, ein Problem oder eine relevante
Rückmeldung vermitteln. **Normale Metadaten, unauffällige Kennzahlen und dauerhaft
erfolgreiche Zustände benötigen nicht automatisch eine farbige Hinweisfläche.**
Sie können als normaler Text oder beschriftete Metadaten gemäss Abschnitt 4.4
angezeigt werden. Bei einer Prüfung MUSS die Formulierung klar zwischen einem
geprüften Teilaspekt und noch ausstehenden Prüfungen unterscheiden.

Schliessbare Hinweise haben rechts einen transparenten IconButton mit
dem lokalen Bootstrap-Icon `x-lg`, mindestens 40 × 40 px und dem zugänglichen
Namen sowie Tooltip „Hinweis schliessen“. Seine Iconfarbe ist
`text-secondary`; bei Hover verwendet das Icon `error-fg` auf einer hellroten
Fläche (`danger-subtle-pressed`), die auch beim Drücken erhalten bleibt.
Der Fokusring verwendet die gemeinsame Fokusrolle.

Das Schliessen-Icon bleibt zur gesamten Meldung vertikal zentriert. Text darf
mehrzeilig werden und wird weder unter das Icon gelegt noch abgeschnitten.
Im Hinweis dürfen nur tatsächlich mögliche fachliche Handlungen angeboten
werden.

Einstellungen zeigen unter der gesamten Optionsgruppe eine reservierte,
ungefärbte Statuszeile. Beim Öffnen ist sie leer. Nach einer Änderung zeigt sie
den laufenden Speichervorgang und anschliessend für drei Sekunden die
Speicherbestätigung. Fehler bleiben bis zum nächsten Speicherversuch sichtbar;
es zählt nur die Rückmeldung des neuesten Versuchs.

Diese Unterscheidung gilt appweit für vorhandene Aktionsrückmeldungen:

| Art | Darstellung und Lebensdauer |
| --- | --- |
| Einfacher Erfolg | Kleine ungefärbte Statuszeile; nach drei Sekunden leer. |
| Beachtenswerte Aktionsmeldung | Notice mit Schliessen-Icon; ohne Zeitlimit. |
| Laufender Vorgang oder fortbestehender Zustand | Bleibt für die Dauer des Vorgangs beziehungsweise Zustands sichtbar. |

Kurze Erfolge sind insbesondere Export ohne Auslassungen, erfolgreiche
Dateibereinigung und abgeschlossene Dateiprüfung. Export mit Auslassungen
bleibt eine blaue, manuell schliessbare Information, auch bei bewusst gewähltem
Rezeptexport. Bereinigungsberichte mit Teilfehlern zeigen die Zusammenfassung
und die originalen Fehlerdetails gemeinsam in einer schliessbaren Warnung.
Aktionsfehler bei Datei-/Portalimport, Parameterübernahme und R-Transfer sind
ebenfalls manuell schliessbar. Schliessen entfernt nur die Rückmeldung und
gibt den Fokus an die zugehörige Aktion zurück; Eingaben, Vorschauvalidität
und fachliche Prüfbedingungen bleiben erhalten.

Jeder neue Versuch entfernt seine vorherige Rückmeldung. Ein erneuter
identischer Erfolg startet die drei Sekunden neu. Veraltete Antworten und
Timer dürfen neuere Versuche nicht überschreiben; beim Verlassen der Ansicht
werden Timer aufgeräumt. Dauerhafte Speicherprobleme, Schreibschutz,
Feldvalidierungen, Verfügbarkeitsangaben und ausgewählte SQL-/R-Laufdiagnosen
bleiben sichtbar. Daraus entstehen keine zusätzlichen Bestätigungen für bisher
stille Aktionen.

Relevante, neu eintretende Statusänderungen verwenden gezielte Live-Regionen.
Dringliche neue Fehler können als Alert angekündigt werden; nicht jede
dauerhafte Hinweisbox ist ein Alert.

### 9.2 StatusBadge

Ein Badge bezeichnet einen nicht interaktiven Zustand. Neutrale Labels
verwenden `surface-neutral` und `text-secondary`; semantische Statusbadges das
passende Statusfarbpaar. Die Bezeichnung bleibt ohne Farbwahrnehmung
verständlich. Badges erhalten keine Buttonwirkung und keinen Fokus.

### 9.3 Leere Zustände

Ein leerer Zustand erklärt knapp, was fehlt und welcher nächste Schritt
möglich ist. Er verwendet eine zurückhaltende Fläche oder normalen Text und
höchstens die tatsächlich passende Einstiegsaktion. Er ist kein Fehler,
sofern das Fehlen von Inhalt fachlich zulässig ist.

Wartung und Diagnose bleiben von Einstiegsaktionen getrennt.

## 10. Dialoge, Menüs und Tooltips

### 10.1 Modal

Modale Dialoge verwenden einen nativen Dialog mit Kopf, Inhalt und Fuss.
Sie haben einen zugänglichen Namen, geregelten initialen Fokus, wirksame
Fokusbegrenzung und Fokusrückgabe zum auslösenden Element.

Eine Escape- oder Schliessen-Aktion berücksichtigt bestehende Regeln zu
laufenden Vorgängen und ungespeicherten Änderungen. Die Designmigration
entfernt keine vorhandenen Sperren oder Bestätigungen.

Der Dialoginnenraum beträgt im Standard 24 px. Aktionsgruppen dürfen
umbrechen; Buttons und Inhalte bleiben auch bei geringer Höhe erreichbar.
Ein überhoher Dialog erhält zugängliches Scrollen. Fokus und Fehlermeldungen
dürfen nicht durch fixierte Bereiche verdeckt werden.

### 10.2 Gemeinsames Aktionsmenü und Tastaturbedienung

Das bestehende `ActionMenu` und die in Abschnitt 6.5–6.7 beschriebenen
Menüauslöser verwenden einen gemeinsamen zugänglichen Menüvertrag. Für Menüs
mit Befehlen gelten die WAI-ARIA-Menu-Button- und Menu-Patterns. [7][8]

- **Auslöser:** Ein natives `<button type="button">` besitzt einen zugänglichen
  Namen, `aria-haspopup="menu"` und ein zum Sichtbarkeitszustand passendes
  `aria-expanded="true"` oder `"false"`. `aria-controls` DARF zusätzlich die
  ID des zugeordneten Menüs referenzieren, sofern das Ziel vorhanden ist.
  Bei einem Split-Button trägt ausschliesslich sein Pfeilbutton diese Angaben.
- **Öffnen:** `Enter` und `Space` am Auslöser öffnen das Menü und fokussieren
  den ersten verfügbaren Menüeintrag. `ArrowDown` DARF dasselbe tun;
  `ArrowUp` DARF öffnen und den letzten verfügbaren Eintrag fokussieren.
  Ein blosses Hover öffnet kein Aktionsmenü.
- **Im Menü:** `ArrowDown`/`ArrowUp` bewegen den Fokus zwischen Einträgen;
  `Home`/`End` springen zum ersten/letzten Eintrag. `Enter` bzw. `Space`
  aktivieren eine gewählte Aktion. Das gewählte Element und das Menü
  schliessen sich anschliessend, sofern die Aktion nicht ausdrücklich eine
  andere Interaktion verlangt. Deaktivierte Aktionen dürfen nicht ausgeführt
  werden; `aria-disabled` allein verhindert keine Aktivierung.
- **Schliessen:** `Escape` schliesst das Menü und bringt den Fokus zum
  auslösenden Button zurück. Ein Klick ausserhalb oder eine abgeschlossene
  Aktion schliesst ebenfalls. `Tab`/`Shift+Tab` verlassen das Menü in der
  logischen Fokusreihenfolge und schliessen es, ohne den Fokus darin zu fangen.
- **Semantik:** Die Menüfläche besitzt `role="menu"`; Befehle werden als
  `menuitem` mit einem verständlichen Namen angeboten. Links dürfen im
  Menü die Linknavigation beibehalten. Menüeinträge sind nicht unverbundene
  Buttons mit aufgemalten ARIA-Rollen; Fokusführung und Tastaturverhalten
  MÜSSEN die gewählte Semantik tatsächlich erfüllen.
- **Layout:** Der Menüinhalt wird innerhalb des sichtbaren Viewports
  positioniert und schwebt über dem Inhalt, ohne ihn umzubrechen. Bei
  Scrollen, Viewportänderungen, Kontextwechseln und Unmount wird die Position
  korrigiert beziehungsweise das Menü sauber geschlossen.

Menüeinträge verwenden klare Aktionsnamen. Destruktive Einträge sind textlich
eindeutig, erhalten die Danger-Rolle und werden bei Bedarf durch Abstand oder
eine neutrale Trennlinie von häufigen Aktionen getrennt. Fachliche Sperren und
Bestätigungen bleiben wirksam. Enthält ein Popup Formulare, komplexe
Einstellungen oder frei fokussierbare Inhalte, ist es **kein** solches
Aktionsmenü; dafür wird das passende Popover- oder Dialogmuster verwendet.

### 10.3 Tooltip

Der bestehende Tooltipvertrag wird beibehalten und für den Zeigerwechsel
zwischen Auslöser und Tooltip präzisiert:

- Hover am Auslöser zeigt den Tooltip nach 250 ms.
- Tastaturfokus über `:focus-visible` zeigt ihn sofort; Mausfokus allein nicht.
- Standardposition ist rechts mit 8 px Abstand und vertikal mittig zum
  Auslöser, bei fehlendem Platz links. Zum Viewport bleiben mindestens 8 px.
- Vor dem Anzeigen wird vollständig gemessen. Scrollen sowie Fenster- und
  Grössenänderungen lösen eine neue Positionierung aus.
- Pro Dokument ist höchstens ein Tooltip sichtbar.
- Der Zeiger darf vom Auslöser auf den Tooltip wechseln, ohne dass dieser
  dabei verschwindet. Solange Auslöser oder Tooltip gehovert werden, bleibt
  er sichtbar; bei bestehendem Tastaturfokus gilt dies ebenfalls.
- Escape schliesst den Tooltip. Eine Auslösung der zugehörigen Aktion, das
  Ende sämtlicher aktiver Hover-/Fokusbedingungen, das vollständige Verlassen
  des Viewports durch den Auslöser oder dessen Unmount schliessen ihn ebenfalls.
- Wartende Anzeige- und Schliessetimer werden bei Zustandswechsel und Unmount
  aufgeräumt. Nach explizitem Schliessen erscheint der Tooltip erst bei einem
  neuen Hover- oder Tastaturfokusbeginn.
- Der Auslöser besitzt selbst einen zugänglichen Namen. Tooltip und
  `aria-describedby` ergänzen diesen Namen; sie ersetzen keine
  Formularbeschriftung.

Notwendige Bedieninformation ist auch ohne Hover erreichbar. Der Tooltip
enthält keine fokussierbaren Bedienelemente; dafür wird ein anderes geeignetes
Muster verwendet. Die Hover-/Fokusinhalte müssen die Anforderungen an
Schliessbarkeit, Hover-Erreichbarkeit und Beständigkeit erfüllen. [6]

## 11. Marke, Header, Icons und Navigation

### 11.1 Neutraler Header und Markenplatzhalter

Der Header enthält im Standard einen **28 × 28 px grossen monochromen
Platzhalter mit „DW“** und daneben „Datenwerkstatt“ in 18 px, Gewicht 500.
Zwischen Platzhalter und Produktname liegen 12 px.

Der Platzhalter verwendet `surface-subtle`, `text-secondary` und eine dezente
Kontur. Er ist mit 4 px leicht gerundet. Weil der Produktname daneben lesbar
steht, ist der Platzhalter dekorativ und für assistive Technologien verborgen.
Er wird als einfaches HTML-/CSS-Element oder vorhandenes lokales SVG
implementiert; dafür wird keine neue Bilddatei benötigt.

Eine zentrale Markenkonfiguration SOLL mindestens folgende Werte unterstützen:

```ts
type BrandConfig = {
  productName: string; // Standard: "Datenwerkstatt"
  organisationName?: string;
  logoSrc?: string; // Lokales Asset oder freigegebener eigener Assetpfad
  logoAlt?: string;
};
```

Ohne `logoSrc` erscheint der neutrale Platzhalter. Ein optionales Logo bleibt
höchstens 32 px hoch und 160 px breit, bewahrt sein Seitenverhältnis und darf
die Headerhöhe nicht erzwingen. Ein Absendername ist nachgeordnet.
Bei schmalem Platz darf die Marke mehrzeilig beziehungsweise der Header höher
werden, statt wichtige Bedienung zu überlagern.

Ein Logo mit bereits daneben ausgeschriebenem identischem Namen kann
dekorativ sein. Trägt das Logo allein eine benötigte Absenderinformation,
erhält es einen passenden Alternativtext. Ein verlinkter Markenbereich hat
ein eindeutiges Ziel und einen verständlichen zugänglichen Namen.

Im neutralen Standard sind kein Kantonslogo, kein Wappen, kein kantonaler
Absender und keine Frutiger-Datei für die Darstellung erforderlich.

### 11.2 Lokale Icons

Die produktive Anwendung verwendet weiterhin die lokale SVG-Auswahl aus
**Bootstrap Icons 1.13.1**, einschliesslich MIT-Lizenz. Die Migration ist kein
Auftrag für einen Wechsel der Iconbibliothek.

SVGs verwenden `currentColor`. Dekorative SVGs erhalten `aria-hidden` und
`focusable="false"`; der zugängliche Name steht am bedienbaren Auslöser.
Es gibt keine Unicode-Ersatzbilder, Iconfonts oder externen Iconabrufe.

| Ziel                  | Bootstrap-Icon   |
| --------------------- | ---------------- |
| Navigation umschalten | `layout-sidebar` |
| Projekte              | `collection`     |
| Übersicht             | `folder2-open`   |
| Daten                 | `table`          |
| SQL / DuckDB          | `database`       |
| R / webR              | `bar-chart-line` |
| Einstellungen         | `gear`           |
| Diagnose              | `info-circle`    |

Navigationsicons sind 20 × 20 px auf mindestens 40 × 40 px grossen
Bedienflächen. Eingeklappt erscheint ein Tooltip, ausgeklappt zusätzlich das
sichtbare Label. SQL und R behalten diese Namen; der Tooltip ergänzt DuckDB
beziehungsweise webR.

### 11.3 Aktuelles Navigationsziel

Das aktuelle Ziel verwendet `selection-bg`, Text und Icon in `selection-fg`
und eine **2 px starke innenliegende Kontur** in `selection-border`.
Die Kontur verschiebt keine Inhalte. Es gibt keinen zusätzlichen seitlichen
Marker. Der Navigationslink erhält `aria-current="page"`.

Die helle Auswahlfläche allein genügt nicht als Zustandsmerkmal. Die Kontur
macht die Auswahl zusätzlich unabhängig vom Farbton sichtbar. Ein
Tastaturfokus kommt als äusserer Fokusring hinzu. [2][3]

### 11.4 Navigationsstruktur und gespeicherte Zustände

Die linke Navigation erscheint auf Projektliste, Einstellungen und
Portaleinstieg. Ohne geöffnetes Projekt zeigt sie Navigation umschalten,
Projekte und Einstellungen.

Im Projekt stehen Übersicht, Daten, SQL und R zwischen Projekte und
Einstellungen. Einstellungen folgt direkt nach R; darunter steht bei geöffnetem
Projekt „Diagnose“. Einstellungen und Diagnose sind Projekt-Unterseiten und
erhalten die laufende Sitzung. Einstellungen zeigt einen kompakten Projektverweis
mit Rücklink und den Hinweis „Diese Einstellungen gelten für alle Projekte in
diesem Browser.“ Ohne Projekt bleibt der globale Einstieg `/settings` verfügbar.
Im Header gibt es keinen zusätzlichen Einstellungslink.

Ausserhalb eines Projekts gilt der persönliche Einklappstandard; manuelles
Umschalten bleibt sitzungslokal. Projektansichten behalten ihren gespeicherten
Einklappzustand. SQL/R verwenden bei fehlender individueller Vorgabe die
eingeklappte Navigation.

## 12. Arbeitsflächen, Tabellen und Projektansichten

### 12.1 Desktop-Arbeitsflächenvertrag

Bei der normalen Desktopdarstellung gelten die bestehenden Zielgrössen:

| Bereich                            | Vorgabe                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Header                             | 56 px im Standard                                                                               |
| Navigation eingeklappt             | 52 px                                                                                           |
| Navigation ausgeklappt             | 212 px                                                                                          |
| Zusätzliche Analysenbedienung      | Höchstens 88 px in der Standardansicht                                                          |
| SQL-/R-Arbeitsflächen              | Mindestens 75 % der Viewporthöhe in der Standardarbeitsansicht bei geschlossenen Zusatzpanels   |
| Breite der Arbeitsflächen          | Mindestens 90 % der Breite rechts der eingeklappten Iconleiste in dieser Standardarbeitsansicht |
| SQL-Editor bei 900 px Viewporthöhe | Mindestens 180 px                                                                               |
| Ergebnis bei 900 px Viewporthöhe   | Mindestens 220 px                                                                               |

Die Breitenmessung bezieht sich auf die Standardarbeitsansicht mit
eingeklappter Navigation. Bewusst geöffnete Navigation und Zusatzpanels
verkleinern den Arbeitsbereich entsprechend.

Bei geringer Höhe, Textvergrösserung, Zoom oder längeren Meldungen haben
Erreichbarkeit und Lesbarkeit Vorrang vor starren Höhen. Elemente dürfen
umbrechen und die Seite beziehungsweise geeignete Teilbereiche dürfen
zugänglich scrollen. Es entstehen keine verdeckten oder überlagerten Controls.

Bei 1280 × 800 px und 100 % Zoom entsteht kein horizontaler Seiten-Overflow.
Code und breite Datentabellen dürfen innerhalb ihrer Bereiche horizontal
scrollen. Ein grosser Editor oder eine Tabelle darf nicht die gesamte
Anwendung über den Viewport hinaus aufweiten.

### 12.2 Reihenfolge der Analysebedienung

Die Reihenfolge bleibt:

**Analysename → Ausführen/Abbrechen → Speichern → Ansichtsaktionen → Weitere Aktionen.**

Layoutreset und R-Reset stehen im Menü. Parameter und Optionen sind
einblendbar. Ergebnis-, Paging- und Grafikaktionen stehen am zugehörigen
Ergebnis und verwenden eine gemeinsame ActionGroup.

Status- und Metadatentexte in Werkzeugleisten folgen Abschnitt 4.4: Ein Status
wird eindeutig benannt, technische Angaben wie Revision und Laufzeit sind
nachgeordnet. Die vorhandene Anzeige wird nicht durch Ketten mit Mittelpunkten
oder anderen universellen Textseparatoren verdichtet.

### 12.3 Tabellen

Tabellen bleiben semantische Tabellen. Tabellenköpfe verwenden
`surface-subtle`, Zeilen werden durch feine neutrale Linien gegliedert.
Vertikale Gitterlinien und eine zusätzliche Kartengestaltung jeder Zeile sind
nicht der Standard.

`NULL` bleibt explizit erkennbar und wird nicht mit einem leeren String oder
einer Null gleichgesetzt. Sortierung ist auch durch eine sichtbare
Richtungsanzeige und passende zugängliche Semantik erkennbar.

Die Darstellung darf Datentypen, Werte, Präzision oder Exportinhalte nicht
unbemerkt verändern. Eine lesefreundliche Anzeige ist von der fachlich
unveränderten Datenverarbeitung zu unterscheiden.

Ausgewählte Tabellenzeilen verwenden bei vorhandener Auswahlfunktion eine
helle Auswahlfläche und einen zusätzlichen Indikator, etwa die vorhandene
Auswahlcheckbox. Die Gestaltung führt keine neue Zeilenauswahlfunktion ein.

#### 12.3.1 Ausrichtung nach logischem Spaltentyp

**Die Ausrichtung einer Spaltenüberschrift MUSS grundsätzlich der Ausrichtung
aller Datenzellen dieser Spalte entsprechen.** Tabellenüberschriften werden
nicht pauschal zentriert oder linksbündig dargestellt. Entscheidend ist der
logische Datentyp und nicht, ob ein Zellwert zufällig nur aus Ziffern besteht.

| Spaltentyp                                        | Tabellenkopf                   | Datenzellen | Beispiele                             |
| ------------------------------------------------- | ------------------------------ | ----------- | ------------------------------------- |
| Text, Namen, Bezeichnungen, Links                 | Links                          | Links       | Projektname, Dateiname, Beschreibung  |
| Mengen, Zählwerte, numerische Kennzahlen, Beträge | Rechts                         | Rechts      | Anzahl Daten, Anzahl Analysen, Grösse |
| Datum und Zeitstempel                             | Links                          | Links       | Erstellt, Zuletzt bearbeitet          |
| Identifikatoren und Codes                         | Links                          | Links       | BFS-Nummer, Postleitzahl, UUID        |
| Status, Kategorien                                | Links                          | Links       | Aktiv, Validiert, Fehler              |
| Reine Aktionsspalte                               | Zentriert (sofern beschriftet) | Zentriert   | Aktionsmenü oder IconButton           |

Für links-nach-rechts geschriebene Oberflächen entsprechen `text-align: start`
und `text-align: end` der linken beziehungsweise rechten Ausrichtung. Die
Ausrichtung wird **spaltenweise einheitlich** angewendet, auch für den Wert
`0`, leere Zellen und explizite `NULL`-Darstellungen. Ein `0` ist ein Wert und
kein leeres Feld. Identifikatoren sind keine Zahlenkolonnen: führende Nullen
müssen erhalten bleiben, und die Anzeige wird nicht numerisch formatiert.

Für die Projektliste gilt beispielsweise: **Name links, Daten rechts,
Analysen rechts, Zuletzt bearbeitet links.** Die Kopftexte „Daten“ und
„Analysen“ stehen damit unmittelbar über der rechten Kante ihrer Zahlenwerte.

#### 12.3.2 Zahlen, Zeitangaben und Spaltenbreiten

- Numerische Kolonnen verwenden `font-variant-numeric: tabular-nums`, sofern
  die Schrift dies unterstützt. Dadurch stehen Ziffern bei wechselnden
  Werten optisch sauber untereinander. Für Zeitstempel ist das ebenfalls
  sinnvoll.
- Anzeigeformate folgen dem jeweiligen fachlichen Datentyp und dem gewählten
  Gebietsschema. Werte werden für Sortierung und Berechnungen nicht als
  formatierte Zeichenketten behandelt.
- In kompakten Übersichten SOLLEN Zeitstempel nur bis auf Minuten angezeigt
  werden, sofern Sekunden für die Aufgabe nicht relevant sind. In der Projektliste
  zeigt der gemeinsame Tooltip den vollständigen Wert mit Sekunden, Millisekunden
  und Zeitzone bei Hover und Tastaturfokus. Das sichtbare `<time>` bleibt mit
  unverändertem `datetime` per Tab erreichbar; `aria-describedby` vermittelt den
  vollständigen Wert assistiven Technologien. Es gibt dort kein Aufklappelement,
  keinen zusätzlichen Button und keinen nativen `title`-Tooltip. Die Tabellenzeile
  verändert beim Anzeigen ihre Höhe nicht. Der vollständige Wert ist somit auch
  ohne Hover erreichbar. Datenraster mit fachlich wichtigen Sekunden oder
  Subsekunden behalten ihre erforderliche Präzision.
- Kopf- und Datenzellen verwenden pro Spalte dieselben horizontalen Innenabstände.
  Als Standard dienen 12 px vertikal und 16 px horizontal. Ausrichtung entsteht
  durch `text-align`, nicht durch zusätzliche Leerzeichen oder individuelle
  Margins innerhalb der Zellen.
- Projekt- und Übersichtslisten SOLLEN ihre Spaltenbreiten an Inhalt und
  verfügbarem Platz ausrichten. Besonders breite Ansichten dürfen durch eine
  geeignete maximale Inhaltsbreite begrenzt werden. Diese Begrenzung DARF
  **nicht** pauschal auf SQL-/R-Ergebnistabellen angewandt werden; sie nutzen
  den vorgesehenen breiten Arbeitsbereich.
- Lange Überschriften dürfen umbrechen. Breite Datentabellen erhalten bei
  Bedarf einen eigenen horizontal scrollbaren Bereich, ohne den gesamten
  Viewport zu verbreitern. Die Tabellenstruktur und Tastaturbedienbarkeit
  bleiben dabei erhalten.

#### 12.3.3 Semantisches HTML und CSS-Konvention

Tabellen verwenden `<thead>`, `<tbody>` und `<th scope="col">` für
Spaltenüberschriften. Numerische Spalten erhalten dieselbe semantische
CSS-Klasse am `<th>` und an jeder zugehörigen `<td>`; beispielsweise
`dw-table__numeric`. Für Aktionsspalten gilt entsprechend
`dw-table__actions`. Eine globale Regel `th { text-align: center; }` ist
nicht zulässig. Eine Sortierung verwendet einen echten Button innerhalb
der Kopfzelle und `aria-sort` am aktuell sortierten `<th>`.

Beispiel für die Projektliste (Pfad und Werte sind illustrativ):

```html
<table class="dw-table">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col" class="dw-table__numeric">Daten</th>
      <th scope="col" class="dw-table__numeric">Analysen</th>
      <th scope="col">Zuletzt bearbeitet</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="/projects/beispiel">elk</a></td>
      <td class="dw-table__numeric">0</td>
      <td class="dw-table__numeric">2</td>
      <td>
        <time datetime="2026-10-20T20:35:31+02:00">20.10.2026, 20:35</time>
      </td>
    </tr>
  </tbody>
</table>
```

Die zugehörigen minimalen CSS-Regeln stehen in Abschnitt 13 und verwenden
nur die vorhandenen Theme-Tokens. Komponentenspezifische Anpassungen dürfen
die hier definierten Ausrichtungsregeln nicht unbeabsichtigt überschreiben.

### 12.4 Projektbegriff und Zuständigkeit der Ansichten

Benutzerseitig heisst die gespeicherte Einheit **Projekt**. `Workspace*`
bleibt gegebenenfalls ein technischer Name. Kanonische Projektrouten liegen
unter `/projects`. Die bestehende Vorgabe, bisherige `/workspaces`-Routen
entfallen zu lassen, bleibt verbindlich; parallele Routen werden nicht wieder
eingeführt.

Die Übersicht zeigt Projektangaben, gespeicherte Analysen und eine kompakte
lesende Datenliste mit „Daten verwalten“. Vollständige Datenaktionen gehören
auf die Datenseite. Projektdatei- und Speicheraktionen folgen unten.
Diagnosebericht sowie Inventar- und Hashprüfung stehen auf der eigenen
Diagnoseseite unter `/projects/$workspaceId/diagnostics`. Die Übersicht zeigt nur
relevante Warnungen über fehlende/beschädigte Daten oder eine fehlgeschlagene
Inventarprüfung und verlinkt zur Diagnose. Technische IDs und Buildangaben
bleiben dort zunächst eingeklappt.

Datenstände und Herkunft werden je Datensatz eingeklappt dargestellt. Der
aktuelle Stand ist explizit markiert. Quelle, Umfang, Schema, Nachweis und
Verfügbarkeit bleiben unterscheidbar.

SQL und R teilen lesbare Laufdetails, die Analyse, eingefrorene Eingaben und
konkrete Ergebnisse zuordnen. Technische IDs und Rohdaten stehen in
untergeordneten Details. Es entsteht kein zusätzliches Dashboard und keine
automatische Ausführung beim Lesen.

## 13. CSS-Referenz für die Tokens

Der folgende Block ist die Referenzbelegung des Standardthemes. Der konkrete
Dateipfad und die Einbindung richten sich nach der bestehenden Anwendung.
Theme-Overrides gehören ebenfalls an eine zentrale Stelle.

```css
:root {
  color-scheme: light;

  --dw-font-ui:
    'Source Sans 3', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --dw-font-code: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --dw-weight-regular: 400;
  --dw-weight-medium: 500;
  --dw-weight-semibold: 600;
  --dw-weight-strong: 700;

  --dw-surface: #ffffff;
  --dw-surface-subtle: #f3f5f7;
  --dw-surface-neutral: #eef1f4;
  --dw-surface-hover: #f3f5f7;
  --dw-surface-pressed: #e7ebef;
  --dw-text: #25313c;
  --dw-text-secondary: #5b6673;
  --dw-border-subtle: #d9dfe5;
  --dw-border-control: #7c8793;
  --dw-border-control-hover: #5b6673;
  --dw-disabled-bg: #eceff2;
  --dw-disabled-text: #626d79;

  --dw-action-bg: #2b5c8a;
  --dw-action-bg-hover: #234e75;
  --dw-action-bg-pressed: #1d4162;
  --dw-action-fg: #ffffff;
  --dw-link: #2b5c8a;
  --dw-link-hover: #234e75;
  --dw-selection-bg: #eaf1f8;
  --dw-selection-fg: #2b5c8a;
  --dw-selection-border: #2b5c8a;
  --dw-focus-ring: #0b5fff;

  --dw-info-fg: #245c83;
  --dw-info-bg: #ecf3f9;
  --dw-success-fg: #276749;
  --dw-success-bg: #ebf5ef;
  --dw-warning-fg: #8a5700;
  --dw-warning-bg: #fff4db;
  --dw-error-fg: #b42318;
  --dw-error-bg: #fef3f2;
  --dw-danger-bg: #b42318;
  --dw-danger-bg-hover: #912018;
  --dw-danger-bg-pressed: #751a14;
  --dw-danger-fg: #ffffff;
  --dw-danger-text: #b42318;
  --dw-danger-subtle-hover: #fef3f2;
  --dw-danger-subtle-pressed: #fee4e2;

  --dw-space-1: 4px;
  --dw-space-2: 8px;
  --dw-space-3: 12px;
  --dw-space-4: 16px;
  --dw-space-5: 20px;
  --dw-space-6: 24px;
  --dw-space-8: 32px;
  --dw-space-10: 40px;
  --dw-space-12: 48px;
  --dw-space-16: 64px;

  --dw-radius-control: 4px;
  --dw-border-width: 1px;
  --dw-selection-width: 2px;
  --dw-control-min-height: 40px;
  --dw-control-compact-min-height: 32px;
  --dw-touch-target-min-size: 44px;
  --dw-focus-width: 3px;
  --dw-focus-offset: 2px;
}
```

Beispiel für die lokale variable UI-Schrift; der relative Assetpfad wird an
die tatsächliche CSS-/Buildstruktur angepasst:

```css
@font-face {
  font-family: 'Source Sans 3';
  src: url('./fonts/source-sans-3/SourceSans3VF-Upright.ttf.woff2') format('woff2');
  font-style: normal;
  font-weight: 200 900;
  font-display: swap;
}

@font-face {
  font-family: 'Source Sans 3';
  src: url('./fonts/source-sans-3/SourceSans3VF-Italic.ttf.woff2') format('woff2');
  font-style: italic;
  font-weight: 200 900;
  font-display: swap;
}

body {
  margin: 0;
  background: var(--dw-surface);
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 1rem;
  line-height: 1.5;
  font-weight: var(--dw-weight-regular);
  font-synthesis: none;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

.dw-control:focus-visible {
  outline: var(--dw-focus-width) solid var(--dw-focus-ring);
  outline-offset: var(--dw-focus-offset);
}

.dw-action-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--dw-space-2);
}

/* Tabellen: Kopf und Zellen erhalten die Ausrichtung derselben Spalte. */
.dw-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--dw-text);
}

.dw-table th,
.dw-table td {
  padding: var(--dw-space-3) var(--dw-space-4);
  border-bottom: 1px solid var(--dw-border-subtle);
  text-align: start;
  vertical-align: middle;
}

.dw-table th {
  background: var(--dw-surface-subtle);
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: var(--dw-weight-semibold);
}

.dw-table .dw-table__numeric {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.dw-table .dw-table__actions {
  text-align: center;
}

.dw-table time {
  font-variant-numeric: tabular-nums;
}
```

Die Beispiele ersetzen keine vollständige Komponentenimplementierung.
Insbesondere dürfen `overflow`, native Styles oder ein CSS-Reset den
Fokusring nicht abschneiden oder entfernen. Die vorhandene Codefont-Einbindung
wird mit korrekter Zuordnung ihrer tatsächlichen Schnitte übernommen.

## 14. Umsetzung und Migration

Die Umsetzung erfolgt in nachvollziehbaren Schritten innerhalb der
bestehenden Anwendung:

1. **Bestand erfassen:** zentrale Styles, Komponenten und Theme-Hardcodierungen
   identifizieren; vorhandene funktionale Tests und Verträge beibehalten.
2. **Tokens einführen:** die Referenzbelegung zentral hinterlegen; bestehende
   Farben auf Rollen abbilden. Farbliterale insbesondere in Navigation,
   Notices, Links und Formularlabels entfernen.
3. **Schrift umstellen:** Source Sans 3 lokal hinzufügen, Herkunft und Lizenz
   dokumentieren, tatsächliche Gewichte zuordnen; bisherige Frutiger-Nutzung
   aus dem neutralen Theme und dessen unnötigen Preloads entfernen.
4. **Marke austauschbar machen:** zentralen Markenbereich mit neutralem
   Standard konfigurieren. Die Headerhöhe und Navigation erhalten.
5. **Komponenten vereinheitlichen:** Buttons, IconButtons, ActionGroup,
   FormField, Inputs, Notice, Badge, Modal, ActionMenu und Tooltip auf die
   gemeinsamen Rollen und Zustandsregeln bringen.
6. **Ansichten migrieren:** Projektliste, Übersicht, Daten, SQL, R und
   Einstellungen verwenden dieselben Komponenten und Tokens.
7. **Zustände prüfen:** normale und destruktive Aktionen, Auswahl, Fokus,
   Disabled, Busy, Fehler, lange Labels und Umbruch in der Entwicklungsreferenz
   sowie in repräsentativen realen Ansichten prüfen.
8. **Abnahme dokumentieren:** tatsächlich ausgeführte Prüfungen und verbleibende
   Einschränkungen festhalten; funktionale Verträge und Arbeitsflächenmasse
   berücksichtigen.

Die zuvor gezeigte Farbvergleichsvorschau veranschaulicht die Farbwirkung.
Sie ist keine Quelle für neue Fachfunktionen, Speicherregeln oder eine andere
Iconbibliothek. Für die Umsetzung gelten dieses Dokument und die bestehenden
funktionalen Verträge.

## 15. Referenzansicht und Abnahmekriterien

Die bestehende Entwicklungsreferenz unter `/tests/design-system/` bleibt eine
reine Vite-Entwicklungsansicht ohne Workspace-/Engine-Abhängigkeit und wird
nicht in den Produktbuild aufgenommen.

Sie zeigt alle Buttongewichtungen mit beiden Bedeutungen, IconButtons,
MenuButtons, SplitButtons, ActionMenus, Formulare, Checkboxen, Radios,
Statusmeldungen, Badges, Navigation, leere Zustände, Tabellen, Dialoge, Menüs
und Tooltips. Lange Beschriftungen und
mehrzeilige Texte gehören ausdrücklich dazu.

### 15.1 Visuelle und funktionale Abnahme

- [ ] Das Standardtheme verwendet die hier festgelegten Rollen; normale
      Aktionen, Links und Navigation verwenden keine rote Akzentfarbe.
- [ ] Source Sans 3 wird tatsächlich mit den vorgesehenen Gewichten geladen.
      Formularlabels und Buttons sind 500, Überschriften 600.
- [ ] Der neutrale Header funktioniert ohne Organisationslogo und zeigt den
      Produktnamen mit dem vorgesehenen Platzhalter.
- [ ] Primary, Secondary, Tertiary und Danger sind konsistent; destruktive
      Aktionen stehen passend getrennt von häufigen Arbeitsaktionen.
- [ ] Hover, Pressed, Fokus, Auswahl, Disabled und Busy sind in den tatsächlich
      verwendeten Kombinationen sichtbar und bedienbar.
- [ ] Ausgewählte Navigation besitzt neben der hellen Fläche eine Kontur;
      der Tastaturfokus bleibt zusätzlich erkennbar.
- [ ] Text-, Control- und Zustandskontraste wurden auf den realen Hintergründen
      geprüft. Meldungen und Auswahl sind nicht ausschliesslich farbcodiert.
- [ ] Alle Eingaben haben passende Labels; Labelklick, Checkboxklick,
      Optionalzusatz, native `required`-Semantik und Fehlerzuordnung funktionieren.
- [ ] Menüs und Dialoge sind mit Tastatur bedienbar; Fokusbegrenzung und
      Fokusrückgabe funktionieren. Tooltips erfüllen den beschriebenen Lebenszyklus.
- [ ] `MenuButton`, `SplitButton` und `ActionMenu` unterscheiden sich
      sichtbar und im Verhalten: Menüöffnung ohne Aktion, direkte stabile
      Standardaktion plus separater Pfeil, beziehungsweise Overflow-Menü.
- [ ] Split-Hauptfläche und Pfeil sind separat fokussierbar und bedienbar;
      Fokus, Busy, Disabled, Danger und die Zielgrössen sind auch im verbundenen
      Control korrekt. Die Wahl einer Variante ändert die Standardaktion nicht.
- [ ] Alle Aktionsmenüs besitzen korrekte ARIA-Zustände, Fokusführung und
      Tastaturbedienung (Enter, Space, Pfeile, Home/End, Escape und Tab);
      Menüschliessung und Fokus-Rückgabe funktionieren bei Kontextwechseln.
- [ ] Busy verhindert doppelte Ausführung; fachlich verfügbares Abbrechen
      bleibt erreichbar. Bestehende Sperren und Bestätigungen wirken weiter.
- [ ] Bei 1440 × 900, 1280 × 800, geringer Höhe und 200 % Zoom überlagern sich
      keine Bedienelemente; Labels dürfen umbrechen und Inhalte bleiben erreichbar.
- [ ] Aktionsgruppen besitzen auch beim Umbruch mindestens 8 px Abstand.
- [ ] Bei 1280 × 800 und 100 % Zoom entsteht kein horizontaler Seiten-Overflow;
      Code- und Tabellenscrollen funktionieren innerhalb ihrer Bereiche.
- [ ] Tabellenköpfe und Datenzellen sind je Spalte konsistent ausgerichtet:
      Text/Datum/Identifikatoren links, Zahlen rechts, reine Aktionen zentriert.
      Insbesondere stehen „Daten“ und „Analysen“ rechtsbündig über ihren Werten.
- [ ] Numerische Kolonnen verwenden tabellarische Ziffern. `0`, `NULL` und
      Identifikatoren bleiben eindeutig; Zahlensortierung erfolgt numerisch und
      Datumssortierung chronologisch, unabhängig vom Anzeigeformat.
- [ ] Zeitstempel in kompakten Übersichten sind sinnvoll gekürzt, ohne die
      fachlich benötigte Präzision oder zugängliche Detailinformation zu verlieren.
- [ ] Die SQL-/R-Arbeitsflächen erfüllen die Masse der Standardarbeitsansicht;
      Editorgrösse und vorhandene Grösseneinstellungen bleiben verwendbar.
- [ ] Lokale Font- und SVG-Pfade funktionieren unter `/lab/`; der
      Systemfont-Fallback ist bedienbar und es gibt keine externen Font-/Iconabrufe.
- [ ] Projektbegriffe, kanonische Routen, Navigationszustände, Datenzuständigkeit
      der Ansichten, Laufdetails und Diagnoseanordnung bleiben fachlich korrekt.

### 15.2 Gezielter Prüfumfang für die neutrale Oberfläche

Für die neutrale Designmigration gelten Typecheck, ein Produktionsbuild und
fünf gezielte Chromium-Fälle:

1. Komponentenreferenz mit Rollen, Zuständen, Menü-/Split-Button-Mustern,
   Tastaturbedienung und Kontrasten.
2. Tooltip-Lebenszyklus einschliesslich Zeigerwechsel und Timerbereinigung.
3. Reale Ansichten mit Navigation, Tabellen, Optionalzusätzen und Fehlerlayout.
4. Der bestehende einzelne SQL-/R-Geometriefall mit echten Ergebnissen.
5. Lokale Assets und Font-Fallback unter `/lab/` in einer einzelnen
   Vite-Produktionsvorschau.

Bei reinen UI-Korrekturen werden nur die betroffenen Prüfungen ausgeführt;
ein fehlgeschlagener Fall wird nach einer Korrektur gezielt wiederholt.
Vollständiges `npm run verify`, gesamte Testsuiten, Firefox-/WebKit-Matrix,
Docker-Deploymentmatrix und nativer Safari-Smoke gehören nicht automatisch zu
diesem UI-Prüfumfang. Änderungen an Fachfunktionen, Engines, Speicherung und
vollständige V1-/Releaseabnahmen richten sich weiterhin nach der SPEC und dem
jeweiligen Auftrag.

Textvergrösserung um 200 % und die verkleinerte Layoutsimulation prüfen
Lesbarkeit und Umbruch. Sie werden ausdrücklich nicht als native
Browserzoom-Abnahme bezeichnet.

Tatsächliche Befehle, Exitcodes, geprüfte Revision, Screenshots und verbleibende
Grenzen werden im Implementierungsstatus dokumentiert. Nicht ausgeführte
Prüfungen werden benannt. Die Buttonerweiterung v1.3 verwendet `verification/buttons-v1.3/`; historische
Nachweise der neutralen Migration unter `verification/neutral-v1.2/` werden nicht überschrieben.
Die abgestimmten Regeln sind in dieser Projektfassung und der nachgeführten
Referenz `DESIGN_SYSTEM_NEUTRAL_v1.4.md` enthalten.

## 16. Anhang: rechnerische Farbprüfung

Die folgenden Werte wurden aus den angegebenen sRGB-Hexwerten mit der
WCAG-Relativluminanzformel berechnet. Für die Beurteilung wurden ungerundete
Werte verwendet; die Tabelle zeigt zur Vermeidung einer Aufrundung über einen
Grenzwert auf zwei Nachkommastellen **abgerundete** Werte. [1]

| Vordergrund / Hintergrund | Verhältnis mindestens | Beurteilte Rolle                  |
| ------------------------- | --------------------- | --------------------------------- |
| `#FFFFFF` / `#2B5C8A`     | 6.99:1                | Text auf Primary                  |
| `#FFFFFF` / `#234E75`     | 8.68:1                | Text auf Primary-Hover            |
| `#FFFFFF` / `#1D4162`     | 10.58:1               | Text auf Primary-Pressed          |
| `#25313C` / `#FFFFFF`     | 13.26:1               | Haupttext auf Arbeitsfläche       |
| `#5B6673` / `#F3F5F7`     | 5.34:1                | Sekundärtext auf Funktionsfläche  |
| `#2B5C8A` / `#EAF1F8`     | 6.14:1                | Auswahltext und Auswahlkontur     |
| `#7C8793` / `#FFFFFF`     | 3.65:1                | Controlkontur auf Weiss           |
| `#7C8793` / `#F3F5F7`     | 3.34:1                | Controlkontur auf Funktionsfläche |
| `#0B5FFF` / `#FFFFFF`     | 5.12:1                | Fokusring auf Weiss               |
| `#626D79` / `#ECEFF2`     | 4.56:1                | Text deaktivierter Controls       |
| `#245C83` / `#ECF3F9`     | 6.39:1                | Information                       |
| `#276749` / `#EBF5EF`     | 6.03:1                | Erfolg                            |
| `#8A5700` / `#FFF4DB`     | 5.57:1                | Warnung                           |
| `#B42318` / `#FEF3F2`     | 6.04:1                | Fehler                            |
| `#FFFFFF` / `#B42318`     | 6.57:1                | Text auf gefülltem Danger-Button  |

Alle aufgeführten aktiven Textpaare liegen über 4.5:1; die geprüften
Controlkonturen liegen über 3:1. Die normale blaue Primärfarbe liegt mit Weiss
ungerundet knapp unter 7:1; sie wird hier nicht als 7:1- beziehungsweise
AAA-Textpaar ausgewiesen.

Die Prüfung umfasst Farbpaare, keine gerenderte Anwendung. Schriftladung,
Rendering, Fokusführung, Hoververhalten, Zoom und sonstige
Barrierefreiheitsanforderungen sind bei der Implementierung separat zu prüfen.

## 17. Quellen und Herkunft

Die Farbauswahl, Komponentenentscheidungen, Gewichtungen und Layoutvorgaben
sind Gestaltungsentscheidungen für die Datenwerkstatt. Die folgenden Quellen
belegen die herangezogenen Kontrast-/Zugänglichkeitsregeln und Eigenschaften
der Schrift; sie schreiben diese konkrete Palette nicht vor.

- **Ausgangsdokument:** vom Projektverantwortlichen bereitgestelltes
  `DESIGN_SYSTEM.md`, Version 1.0, 10. Oktober 2026. Daraus stammen insbesondere
  funktionale Verweise, lokale Assetversionen, Navigationsstruktur,
  Arbeitsflächenvertrag und bestehende Prüf-Gates.
- **[1] W3C – WCAG 2.2, Understanding SC 1.4.3: Contrast (Minimum):**
  <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>
- **[2] W3C – WCAG 2.2, Understanding SC 1.4.11: Non-text Contrast:**
  <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
- **[3] W3C – WCAG 2.2, Understanding SC 1.4.1: Use of Color:**
  <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html>
- **[4] Adobe – Source Sans 3, offizielles Repository und Lizenz:**
  <https://github.com/adobe-fonts/source-sans>
- **[5] Adobe – offizielle CSS-Deklaration der variablen Source Sans 3:**
  <https://github.com/adobe-fonts/source-sans/blob/release/source-sans-3VF.css>
- **[6] W3C – WCAG 2.2, Understanding SC 1.4.13: Content on Hover or Focus:**
  <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>

- **[7] W3C WAI-ARIA APG – Menu Button Pattern:**
  <https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/>
- **[8] W3C WAI-ARIA APG – Menu and Menubar Pattern:**
  <https://www.w3.org/WAI/ARIA/apg/patterns/menubar/>

Die W3C-Understanding-Dokumente erläutern die normativen Kriterien. Die
normative WCAG-2.2-Spezifikation steht unter <https://www.w3.org/TR/WCAG22/>.
