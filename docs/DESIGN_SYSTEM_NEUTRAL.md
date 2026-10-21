# Designsystem Datenwerkstatt – organisationsunabhängige Basis

**Version:** 1.1  
**Stand:** 20. Oktober 2026  
**Standardtheme:** `neutral-blue`  
**Status:** Historische Fassung v1.1; nicht als aktuelle Umsetzungsvorgabe verwenden.

> Massgeblich ist [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Die nachgeführte
> [Referenzfassung v1.2](DESIGN_SYSTEM_NEUTRAL_v1.2.md) enthält die abgestimmten
> Regeln zu Optionalzusätzen, sichtbaren Analysenamen, Fehlerlayout,
> Textvergrösserung und gezielten Prüfungen. Die folgenden älteren Regeln
> bleiben ausschliesslich zur historischen Einordnung erhalten.

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

Die neutrale Version benötigt kein neues gemeinsames Komponentenpaket.
Gemeinsame Tokens und Komponenten innerhalb der bestehenden Anwendung genügen.
Die vorgeschlagenen Alternativen Petrol, Indigo und Graphit sind mit dieser
Version nicht automatisch zusätzliche produktive Themes.

## 2. Grundregeln, Theme und Marke

Die Implementierung MUSS drei Verantwortlichkeiten unterscheiden:

| Ebene | Inhalt | Veränderbarkeit |
| --- | --- | --- |
| Gemeinsame Gestaltungsregeln | Layout, Abstände, Bediengrössen, Komponenten, Zustände, Tastaturbedienung, zugängliche Semantik | Gemeinsamer Vertrag aller Themes |
| Theme | Aktions- und Neutralfarben, Schriftfamilie, zugehörige Schriftgewichte | Zentral austauschbar; Änderungen erfordern erneute Prüfung der betroffenen Darstellungen |
| Marke und Absender | Produktname, Logo, optionaler Organisationsname | Über eine zentrale Konfiguration austauschbar |

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

| Token | Rolle | Wert |
| --- | --- | --- |
| `--dw-surface` | Seite, Navigation, Editor, Resultate, Dialoge, Eingaben | `#FFFFFF` |
| `--dw-surface-subtle` | Werkzeugleisten, Tabellenköpfe, Konsole, schreibgeschützte Felder | `#F3F5F7` |
| `--dw-surface-neutral` | Neutrale Statuslabels und zurückgesetzte Bereiche | `#EEF1F4` |
| `--dw-surface-hover` | Hover neutraler Bedienelemente | `#F3F5F7` |
| `--dw-surface-pressed` | Gedrückter Zustand neutraler Bedienelemente | `#E7EBEF` |
| `--dw-text` | Haupttext | `#25313C` |
| `--dw-text-secondary` | Hilfetext, Metadaten, nachgeordnete Beschriftung | `#5B6673` |
| `--dw-border-subtle` | Gliedernde Trennlinien | `#D9DFE5` |
| `--dw-border-control` | Erkennbare Eingabe- und Controlkonturen | `#7C8793` |
| `--dw-border-control-hover` | Eingabekontur bei Hover | `#5B6673` |
| `--dw-disabled-bg` | Hintergrund deaktivierter Controls | `#ECEFF2` |
| `--dw-disabled-text` | Text deaktivierter Controls | `#626D79` |

Arbeitsflächen bleiben weiss. Funktionsbereiche werden mit Abstand,
zurückhaltenden Flächen und feinen Trennlinien gegliedert. Flächendeckende
Kartencontainer, grosse farbige Kopfbereiche, dekorative Akzentstriche und
Farbverläufe sind für die Arbeitsoberfläche nicht vorgesehen.

Eine Trennlinie DARF subtil sein, wenn sie nur gliedert. Eine Kontur, die zum
Erkennen eines leeren Eingabefeldes benötigt wird, MUSS ausreichend sichtbar
sein. Dafür werden unterschiedliche Tokens verwendet.

### 3.2 Aktion, Links, Auswahl und Fokus

| Token | Rolle | Wert |
| --- | --- | --- |
| `--dw-action-bg` | Gefüllte Primäraktion | `#2B5C8A` |
| `--dw-action-bg-hover` | Hover der Primäraktion | `#234E75` |
| `--dw-action-bg-pressed` | Gedrückte Primäraktion | `#1D4162` |
| `--dw-action-fg` | Text und Icons auf der Primäraktion | `#FFFFFF` |
| `--dw-link` | Textlinks | `#2B5C8A` |
| `--dw-link-hover` | Textlinks bei Hover oder Drücken | `#234E75` |
| `--dw-selection-bg` | Zurückhaltende Auswahlfläche | `#EAF1F8` |
| `--dw-selection-fg` | Text und Icons ausgewählter Elemente | `#2B5C8A` |
| `--dw-selection-border` | Zusätzliche sichtbare Auswahlkontur | `#2B5C8A` |
| `--dw-focus-ring` | Tastaturfokus | `#0B5FFF` |

Blau wird sparsam eingesetzt. Vollflächen sind hauptsächlich für die führende
Aktion des jeweiligen Entscheidungskontexts vorgesehen. Navigation und
Auswahl verwenden helle Flächen und eine zusätzliche sichtbare Markierung.

Textlinks im Inhalt MÜSSEN unterstrichen sein. Die Unterstreichung bleibt auch
ohne Hover sichtbar. Navigationslinks und als Schaltfläche gestaltete Links
erhalten ihre Erkennbarkeit durch die jeweilige Komponentenform.

Innerhalb der Arbeitsanwendung gibt es keine zusätzliche violette
Visited-Farbe. Ein besuchter Projektlink behält die Linkrolle des Themes.

### 3.3 Status und destruktive Aktionen

| Bedeutung | Vordergrund-Token / Wert | Hintergrund-Token / Wert |
| --- | --- | --- |
| Information | `--dw-info-fg`: `#245C83` | `--dw-info-bg`: `#ECF3F9` |
| Erfolg | `--dw-success-fg`: `#276749` | `--dw-success-bg`: `#EBF5EF` |
| Warnung | `--dw-warning-fg`: `#8A5700` | `--dw-warning-bg`: `#FFF4DB` |
| Fehler | `--dw-error-fg`: `#B42318` | `--dw-error-bg`: `#FEF3F2` |

| Token | Rolle | Wert |
| --- | --- | --- |
| `--dw-danger-bg` | Gefüllte destruktive Bestätigung | `#B42318` |
| `--dw-danger-bg-hover` | Hover dieser Bestätigung | `#912018` |
| `--dw-danger-bg-pressed` | Gedrückte destruktive Bestätigung | `#751A14` |
| `--dw-danger-fg` | Text und Icons auf gefülltem Danger-Button | `#FFFFFF` |
| `--dw-danger-text` | Destruktive Textaktion und Danger-Kontur | `#B42318` |
| `--dw-danger-subtle-hover` | Hover einer ungefüllten destruktiven Aktion | `#FEF3F2` |
| `--dw-danger-subtle-pressed` | Gedrückte ungefüllte destruktive Aktion | `#FEE4E2` |

Statusmeldungen MÜSSEN ihre Bedeutung mit Text benennen. Farbe und Icons
ergänzen die Aussage. Nicht jede erfolgreiche Bedienhandlung benötigt eine
grüne Meldung; dauerhafte Statusangaben und relevante Rückmeldungen genügen.

Die gemeinsame rote Farbfamilie verbindet Fehler und destruktive Bedeutung.
Die dafür vorgesehenen Tokens bleiben trotzdem getrennt. Normale
Projektlinks, Pflichtfeldmarkierungen und aktive Navigation sind nicht rot.

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
font-family: "Source Sans 3", system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

`font-display: swap` erhält die sofortige Lesbarkeit. Der System-Fallback
MUSS funktionsfähig bleiben. Webfont und Fallback dürfen keine abgeschnittenen
Labels oder unbedienbaren Controls verursachen.

### 4.2 Grössen, Gewichte und Zeilenhöhen

Die Pixelangaben beziehen sich auf eine Basis von 16 px bei 100 % Zoom.
Textgrössen werden bevorzugt in `rem` umgesetzt; die Schriftgrösse des
Browser-Root-Elements wird nicht verkleinert.

| Verwendung | Grösse | Gewicht | Zeilenhöhe |
| --- | --- | --- | --- |
| Seitentitel | 28 px / 1.75 rem | 600 | 1.25 |
| Abschnittstitel | 20 px / 1.25 rem | 600 | 1.4 |
| Produktname im Header | 18 px / 1.125 rem | 500 | 1.4 |
| Standardtext, normale Tabellenzellen | 16 px / 1 rem | 400 | 1.5 |
| Navigation | 14 px / 0.875 rem | 500 | 1.4 |
| Formularlabel | 14 px / 0.875 rem | 500 | 20 px / 1.25 rem |
| Hilfetext | 14 px / 0.875 rem | 400 | 1.5 |
| Standardbutton | 16 px / 1 rem | 500 | 1.25 |
| Kompakter Button, kompakte Bedienung | 14 px / 0.875 rem | 500 | 1.3 |
| Tabellenkopf | 14 px / 0.875 rem | 600 | 1.4 |
| Nachgeordnete Metadaten, Statusbadge | 12 px / 0.75 rem | 400 | 1.5 |

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

## 5. Abstände, Grössen und Oberflächen

Verbindliches Abstandsraster: **4, 8, 12, 16, 20, 24, 32, 40, 48 und 64 px**.

| Beziehung | Abstand |
| --- | --- |
| Icon–Text | 8 px |
| Benachbarte Aktionen derselben Gruppe | 8 px in beiden Richtungen |
| Unterschiedliche Aktionsgruppen | 16 px |
| Label–Control | 8 px |
| Control–Hilfetext oder Fehlermeldung | 8 px |
| Formularfelder | 16 px |
| Inhaltsabschnitte | 32 px |
| Dialoginnenraum, normaler Inhaltsrand | 24 px |
| Inhaltsrand bei schmalem Viewport | 16 px |

Aktionsgruppen verwenden Layout-`gap` und dürfen umbrechen. Leerzeichen,
leere Elemente und individuelle Button-Margins werden nicht zur
Layoutsteuerung verwendet. Zusammengehörige Aktionen behalten beim Umbruch
ihre Reihenfolge und mindestens 8 px Abstand.

| Element | Vorgabe |
| --- | --- |
| Standardcontrol | Mindestens 40 px hoch |
| Kompaktes Control | Mindestens 32 px hoch; für dichte Arbeitsbereiche |
| IconButton / Navigation im Standard | Mindestens 40 × 40 px |
| Bedienziel bei grobem Zeiger / Touch | Mindestens 44 × 44 px wirksame, nicht überlappende Fläche |
| Controls, Menüs und Dialoge | 4 px Radius |
| Einfache Kontur | 1 px |
| Auswahlkontur | 2 px innenliegend, ohne Layoutverschiebung |
| Fokus | 3 px Ring mit 2 px Abstand |

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
type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonTone = "default" | "danger";
type ControlSize = "default" | "compact";
```

`variant` beschreibt die Hervorhebung. `tone` beschreibt eine gegebenenfalls
destruktive Bedeutung. Unbenannte Sondervarianten einzelner Bildschirmseiten
sind nicht vorgesehen. `IconButton` verwendet dieselben Rollen.

Die vorhandene Variante `ghost` wird bei der Migration auf `tertiary`
abgebildet. Das bisherige `danger` wird auf eine explizite Kombination von
`variant` und `tone="danger"` überführt. Ein interner Übergangsadapter DARF
bestehende Aufrufer vorübergehend kompatibel halten.

### 6.2 Normale Aktionen

| Variante | Standard | Hover | Gedrückt |
| --- | --- | --- | --- |
| Primary | `action-bg`, Text/Icon `action-fg`, transparente Kontur | `action-bg-hover` | `action-bg-pressed` |
| Secondary | `surface`, Text/Icon `text`, Kontur `border-control` | `surface-hover`, Kontur bleibt sichtbar | `surface-pressed` |
| Tertiary | Transparent, Text/Icon `text`, transparente Kontur | `surface-hover` | `surface-pressed` |

Die Rollen in den Tabellen bezeichnen jeweils das gleichnamige `--dw-`-Token.
Text und Icons einer Schaltfläche verwenden dieselbe Vordergrundrolle.
Farbliche Betonung von Tertiary-Aktionen ist kein zusätzlicher Standard.

Pro zusammengehörigem Entscheidungskontext SOLL genau eine visuell führende
Aktion vorhanden sein. Es müssen nicht auf jeder Seite alle drei Varianten
vorkommen.

| Kontext | Führende Aktion | Nachgeordnete Aktionen |
| --- | --- | --- |
| Projektliste | „Neues Projekt“ als Primary | „Projekt öffnen“ als Secondary; weitere Werkzeuge als Tertiary |
| SQL-/R-Arbeitsbereich | „Ausführen“ als Primary | „Speichern“ als Secondary; Ansicht und weitere Aktionen nachgeordnet |
| Formular oder Dialog zum Bearbeiten | Abschliessendes „Speichern“ / „Übernehmen“ als Primary | „Abbrechen“ als Secondary |
| Projektdatei und Speicher | Aufgabenabhängig; keine erzwungene Primary-Aktion | Exportieren, Duplizieren, Integrität prüfen als Secondary oder Tertiary |

### 6.3 Destruktive Aktionen

| Variante mit `tone="danger"` | Standard | Hover | Gedrückt |
| --- | --- | --- | --- |
| Primary | `danger-bg`, Text/Icon `danger-fg` | `danger-bg-hover` | `danger-bg-pressed` |
| Secondary | `surface`, Text/Icon und Kontur `danger-text` | `danger-subtle-hover` | `danger-subtle-pressed` |
| Tertiary | Transparent, Text/Icon `danger-text` | `danger-subtle-hover` | `danger-subtle-pressed` |

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

## 7. Zustände und ihr Zusammenspiel

| Zustand | Bedeutung | Verbindliches Verhalten |
| --- | --- | --- |
| `hover` | Zeiger befindet sich über dem Element | Definierte Hover-Fläche; keine Layoutverschiebung |
| `pressed` / CSS `:active` | Momentanes Drücken | Definierte dunklere beziehungsweise neutrale Pressed-Fläche |
| `focus-visible` | Sichtbarer Tastaturfokus | 3-px-Fokusring mit 2 px Abstand; bestehende Auswahl oder Fehlerkontur bleibt erkennbar |
| `selected` | Dauerhafte Auswahl | Auswahlfläche und zusätzliche sichtbare Form/Kontur; passende Semantik, z. B. `aria-selected` oder `aria-pressed` |
| `current` | Aktuelles Navigationsziel | Auswahlgestaltung plus `aria-current="page"` am Navigationslink |
| `disabled` | Derzeit nicht bedienbar | Explizite Disabled-Farben, keine Hover-/Pressed-Reaktion; native Semantik, wo möglich |
| `busy` | Vorgang läuft | Verständlicher Lauftext, Schutz vor Doppelaktionen und passende Busy-Semantik |

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

Pflichtfelder erhalten ein sichtbares Sternchen in der Label-Farbe und native
`required`-Semantik. Einmal pro Formular wird „* Pflichtfeld“ erklärt.
Fachliche Pflichtfeldregeln werden durch die Migration nicht verändert.

| Feldzustand | Gestaltung |
| --- | --- |
| Standard | `surface`, Text `text`, Kontur `border-control` |
| Hover | Kontur `border-control-hover` |
| Fokus | Vorhandene Kontur plus Fokusring |
| Fehler | Kontur und Fehlermeldung `error-fg`; zusätzliche Textbeschreibung |
| Schreibgeschützt | `surface-subtle`, Text `text`, erkennbare Kontur; Inhalt bleibt fokussier- und kopierbar, soweit das native Control dies unterstützt |
| Deaktiviert | `disabled-bg`, Text `disabled-text`, native Deaktivierung |

Fehlermeldungen nennen das konkrete Problem und werden über
`aria-describedby` dem Feld zugeordnet. `aria-invalid="true"` kennzeichnet
ungültige Eingaben. Bestehender Hilfetext und Fehlertext können gemeinsam
referenziert werden. Validierung erzeugt keine Live-Meldung pro Tastendruck.

Checkboxen und Radiobuttons stehen links; die anklickbare Beschriftung folgt
rechts mit 8 px Abstand und Gewicht 400. Mehrzeilige Texte dürfen umbrechen.
Die gesamte Label-Fläche ist anklickbar. Haken, Auswahlpunkte und Konturen
bleiben ausreichend kontrastreich.

Der Analysename in einer kompakten Werkzeugleiste DARF ein visuell ausgeblendetes
Label haben. Parametertabellen verwenden Spaltenköpfe und eindeutige
zugängliche Feldnamen. Diese Ausnahmen ersetzen nicht die sichtbaren Labels
normaler Formulare.

## 9. Meldungen, Badges und leere Zustände

### 9.1 Notice und Fehlermeldung

Eine Notice verwendet das zugehörige Statusfarbpaar und verständlichen Text.
Ein passendes Icon kann die Bedeutung ergänzen. Dekorative linke Rahmen und
Akzentstriche werden nicht verwendet.

Globale schliessbare Hinweise haben rechts einen transparenten IconButton mit
dem lokalen Bootstrap-Icon `x-lg`, mindestens 40 × 40 px und dem zugänglichen
Namen sowie Tooltip „Hinweis schliessen“. Seine Iconfarbe ist
`text-secondary`; sie ist kein fest codiertes Blau. Der Fokusring verwendet
die gemeinsame Fokusrolle.

Das Schliessen-Icon bleibt zur gesamten Meldung vertikal zentriert. Text darf
mehrzeilig werden und wird weder unter das Icon gelegt noch abgeschnitten.
Im Hinweis dürfen nur tatsächlich mögliche fachliche Handlungen angeboten
werden.

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

### 10.2 ActionMenu

Ein ActionMenu unterstützt Tastaturöffnung, Pfeiltasten, Home/End, Escape und
Fokusrückgabe. Offener Zustand, Auslöser und Menü sind semantisch verknüpft.
Die Positionierung bleibt innerhalb des Viewports. Ein geöffnetes Menü
überlagert Inhalte, ohne sie umzubrechen.

Menüeinträge verwenden klare Aktionsnamen. Destruktive Einträge sind textlich
eindeutig, erhalten die Danger-Rolle und werden bei Bedarf durch Abstand oder
eine neutrale Trennlinie von häufigen Aktionen getrennt.

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
  productName: string;       // Standard: "Datenwerkstatt"
  organisationName?: string;
  logoSrc?: string;          // Lokales Asset oder freigegebener eigener Assetpfad
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

| Ziel | Bootstrap-Icon |
| --- | --- |
| Navigation umschalten | `layout-sidebar` |
| Projekte | `collection` |
| Übersicht | `folder2-open` |
| Daten | `table` |
| SQL / DuckDB | `database` |
| R / webR | `bar-chart-line` |
| Einstellungen | `gear` |

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
Einstellungen. Einstellungen folgt direkt nach R. Im Header gibt es keinen
zusätzlichen Einstellungslink.

Ausserhalb eines Projekts gilt der persönliche Einklappstandard; manuelles
Umschalten bleibt sitzungslokal. Projektansichten behalten ihren gespeicherten
Einklappzustand. SQL/R verwenden bei fehlender individueller Vorgabe die
eingeklappte Navigation.

## 12. Arbeitsflächen, Tabellen und Projektansichten

### 12.1 Desktop-Arbeitsflächenvertrag

Bei der normalen Desktopdarstellung gelten die bestehenden Zielgrössen:

| Bereich | Vorgabe |
| --- | --- |
| Header | 56 px im Standard |
| Navigation eingeklappt | 52 px |
| Navigation ausgeklappt | 212 px |
| Zusätzliche Analysenbedienung | Höchstens 88 px in der Standardansicht |
| SQL-/R-Arbeitsflächen | Mindestens 75 % der Viewporthöhe in der Standardarbeitsansicht bei geschlossenen Zusatzpanels |
| Breite der Arbeitsflächen | Mindestens 90 % der Breite rechts der eingeklappten Iconleiste in dieser Standardarbeitsansicht |
| SQL-Editor bei 900 px Viewporthöhe | Mindestens 180 px |
| Ergebnis bei 900 px Viewporthöhe | Mindestens 220 px |

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

### 12.3 Tabellen

Tabellen bleiben semantische Tabellen. Tabellenköpfe verwenden
`surface-subtle`, Zeilen werden durch feine neutrale Linien gegliedert.
Vertikale Gitterlinien und eine zusätzliche Kartengestaltung jeder Zeile sind
nicht der Standard.

Zahlen sind nach ihrem logischen Typ rechtsbündig; Text ist linksbündig.
`NULL` bleibt explizit erkennbar und wird nicht mit einem leeren String oder
einer Null gleichgesetzt. Sortierung ist auch durch eine sichtbare
Richtungsanzeige und passende zugängliche Semantik erkennbar.

Die Darstellung darf Datentypen, Werte, Präzision oder Exportinhalte nicht
unbemerkt verändern. Eine lesefreundliche Anzeige ist von der fachlich
unveränderten Datenverarbeitung zu unterscheiden.

Ausgewählte Tabellenzeilen verwenden bei vorhandener Auswahlfunktion eine
helle Auswahlfläche und einen zusätzlichen Indikator, etwa die vorhandene
Auswahlcheckbox. Die Gestaltung führt keine neue Zeilenauswahlfunktion ein.

### 12.4 Projektbegriff und Zuständigkeit der Ansichten

Benutzerseitig heisst die gespeicherte Einheit **Projekt**. `Workspace*`
bleibt gegebenenfalls ein technischer Name. Kanonische Projektrouten liegen
unter `/projects`. Die bestehende Vorgabe, bisherige `/workspaces`-Routen
entfallen zu lassen, bleibt verbindlich; parallele Routen werden nicht wieder
eingeführt.

Die Übersicht zeigt Projektangaben, gespeicherte Analysen und eine kompakte
lesende Datenliste mit „Daten verwalten“. Vollständige Datenaktionen gehören
auf die Datenseite. Projektdatei- und Speicheraktionen folgen unten;
Diagnose bleibt eingeklappt.

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

  --dw-font-ui: "Source Sans 3", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  --dw-font-code: "JetBrains Mono", ui-monospace, SFMono-Regular,
    Menlo, Consolas, monospace;
  --dw-weight-regular: 400;
  --dw-weight-medium: 500;
  --dw-weight-semibold: 600;
  --dw-weight-strong: 700;

  --dw-surface: #FFFFFF;
  --dw-surface-subtle: #F3F5F7;
  --dw-surface-neutral: #EEF1F4;
  --dw-surface-hover: #F3F5F7;
  --dw-surface-pressed: #E7EBEF;
  --dw-text: #25313C;
  --dw-text-secondary: #5B6673;
  --dw-border-subtle: #D9DFE5;
  --dw-border-control: #7C8793;
  --dw-border-control-hover: #5B6673;
  --dw-disabled-bg: #ECEFF2;
  --dw-disabled-text: #626D79;

  --dw-action-bg: #2B5C8A;
  --dw-action-bg-hover: #234E75;
  --dw-action-bg-pressed: #1D4162;
  --dw-action-fg: #FFFFFF;
  --dw-link: #2B5C8A;
  --dw-link-hover: #234E75;
  --dw-selection-bg: #EAF1F8;
  --dw-selection-fg: #2B5C8A;
  --dw-selection-border: #2B5C8A;
  --dw-focus-ring: #0B5FFF;

  --dw-info-fg: #245C83;
  --dw-info-bg: #ECF3F9;
  --dw-success-fg: #276749;
  --dw-success-bg: #EBF5EF;
  --dw-warning-fg: #8A5700;
  --dw-warning-bg: #FFF4DB;
  --dw-error-fg: #B42318;
  --dw-error-bg: #FEF3F2;
  --dw-danger-bg: #B42318;
  --dw-danger-bg-hover: #912018;
  --dw-danger-bg-pressed: #751A14;
  --dw-danger-fg: #FFFFFF;
  --dw-danger-text: #B42318;
  --dw-danger-subtle-hover: #FEF3F2;
  --dw-danger-subtle-pressed: #FEE4E2;

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
  font-family: "Source Sans 3";
  src: url("./fonts/source-sans-3/SourceSans3VF-Upright.ttf.woff2")
    format("woff2");
  font-style: normal;
  font-weight: 200 900;
  font-display: swap;
}

@font-face {
  font-family: "Source Sans 3";
  src: url("./fonts/source-sans-3/SourceSans3VF-Italic.ttf.woff2")
    format("woff2");
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
Formulare, Checkboxen, Radios, Statusmeldungen, Badges, Navigation, leere
Zustände, Tabellen, Dialoge, Menüs und Tooltips. Lange Beschriftungen und
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
  Pflichtfeldkennzeichnung und Fehlerzuordnung funktionieren.
- [ ] Menüs und Dialoge sind mit Tastatur bedienbar; Fokusbegrenzung und
  Fokusrückgabe funktionieren. Tooltips erfüllen den beschriebenen Lebenszyklus.
- [ ] Busy verhindert doppelte Ausführung; fachlich verfügbares Abbrechen
  bleibt erreichbar. Bestehende Sperren und Bestätigungen wirken weiter.
- [ ] Bei 1440 × 900, 1280 × 800, geringer Höhe und 200 % Zoom überlagern sich
  keine Bedienelemente; Labels dürfen umbrechen und Inhalte bleiben erreichbar.
- [ ] Aktionsgruppen besitzen auch beim Umbruch mindestens 8 px Abstand.
- [ ] Bei 1280 × 800 und 100 % Zoom entsteht kein horizontaler Seiten-Overflow;
  Code- und Tabellenscrollen funktionieren innerhalb ihrer Bereiche.
- [ ] Die SQL-/R-Arbeitsflächen erfüllen die Masse der Standardarbeitsansicht;
  Editorgrösse und vorhandene Grösseneinstellungen bleiben verwendbar.
- [ ] Lokale Font- und SVG-Pfade funktionieren unter `/lab/`; der
  Systemfont-Fallback ist bedienbar und es gibt keine externen Font-/Iconabrufe.
- [ ] Projektbegriffe, kanonische Routen, Navigationszustände, Datenzuständigkeit
  der Ansichten, Laufdetails und Diagnoseanordnung bleiben fachlich korrekt.

### 15.2 Bestehende Projekt-Gates

Die im Ausgangsdokument vorgeschriebenen Prüfungen bleiben Teil der
Implementierungsabnahme: `npm run verify`, E2E zusätzlich mit Firefox/WebKit,
betroffene statische Deploymentchecks, Dokumentlinks sowie ein nativer
Safari-UI-Smoke. Neue Screenshots und Messungen werden getrennt von
historischen P7/P8-Belegen dokumentiert.

Diese Gate-Namen stammen aus dem bestehenden Designsystem. Die vorliegende
Dokumenterstellung bestätigt weder deren Verfügbarkeit im Repository noch
eine erfolgreiche Ausführung. Bei der Implementierung werden die vorhandenen
Projektkommandos geprüft und tatsächlich verwendete Prüfwege festgehalten.
Nicht ausgeführte Prüfungen werden ausdrücklich benannt.

## 16. Anhang: rechnerische Farbprüfung

Die folgenden Werte wurden aus den angegebenen sRGB-Hexwerten mit der
WCAG-Relativluminanzformel berechnet. Für die Beurteilung wurden ungerundete
Werte verwendet; die Tabelle zeigt zur Vermeidung einer Aufrundung über einen
Grenzwert auf zwei Nachkommastellen **abgerundete** Werte. [1]

| Vordergrund / Hintergrund | Verhältnis mindestens | Beurteilte Rolle |
| --- | --- | --- |
| `#FFFFFF` / `#2B5C8A` | 6.99:1 | Text auf Primary |
| `#FFFFFF` / `#234E75` | 8.68:1 | Text auf Primary-Hover |
| `#FFFFFF` / `#1D4162` | 10.58:1 | Text auf Primary-Pressed |
| `#25313C` / `#FFFFFF` | 13.26:1 | Haupttext auf Arbeitsfläche |
| `#5B6673` / `#F3F5F7` | 5.34:1 | Sekundärtext auf Funktionsfläche |
| `#2B5C8A` / `#EAF1F8` | 6.14:1 | Auswahltext und Auswahlkontur |
| `#7C8793` / `#FFFFFF` | 3.65:1 | Controlkontur auf Weiss |
| `#7C8793` / `#F3F5F7` | 3.34:1 | Controlkontur auf Funktionsfläche |
| `#0B5FFF` / `#FFFFFF` | 5.12:1 | Fokusring auf Weiss |
| `#626D79` / `#ECEFF2` | 4.56:1 | Text deaktivierter Controls |
| `#245C83` / `#ECF3F9` | 6.39:1 | Information |
| `#276749` / `#EBF5EF` | 6.03:1 | Erfolg |
| `#8A5700` / `#FFF4DB` | 5.57:1 | Warnung |
| `#B42318` / `#FEF3F2` | 6.04:1 | Fehler |
| `#FFFFFF` / `#B42318` | 6.57:1 | Text auf gefülltem Danger-Button |

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

Die W3C-Understanding-Dokumente erläutern die normativen Kriterien. Die
normative WCAG-2.2-Spezifikation steht unter <https://www.w3.org/TR/WCAG22/>.
