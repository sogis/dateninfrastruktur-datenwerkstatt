import {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  ActionGroup,
  Button,
  EmptyState,
  FileInput,
  FormField,
  IconButton,
  Input,
  Notice,
  PanelHeader,
  Select,
  StatusBadge,
  Textarea,
  Toolbar,
} from '../../src/ui/Controls';
import {ActionMenu, MenuButton, SplitButton} from '../../src/ui/ActionMenu';
import {Modal} from '../../src/ui/Modal';
import {NavigationItem} from '../../src/ui/NavigationItem';
import '../../src/styles/app.css';
import './reference.css';
function FontStatus({
  font,
  weight = 400,
  italic = false,
}: {
  font: string;
  weight?: number;
  italic?: boolean;
}) {
  const [fontStatus, setFontStatus] = useState('wird geladen');
  useEffect(() => {
    void document.fonts.load(`${italic ? 'italic ' : ''}${weight} 16px "${font}"`).then(
      (faces) =>
        setFontStatus(
          faces.some((face) => face.status === 'loaded') ? 'geladen' : 'Systemfont-Fallback',
        ),
      () => setFontStatus('Systemfont-Fallback'),
    );
  }, [font, weight, italic]);
  return (
    <output aria-label={`Fontstatus ${font} ${weight}${italic ? ' italic' : ''}`}>
      {font} {weight}
      {italic ? ' italic' : ''}: {fontStatus}
    </output>
  );
}
function Reference() {
  const [modal, setModal] = useState(false),
    [submitted, setSubmitted] = useState(0),
    [action, setAction] = useState('Keine Aktion'),
    [tooltipControl, setTooltipControl] = useState(true);
  return (
    <>
      <header className="app-header">
        <a className="brand" href="#reference">
          <span className="brand-placeholder" aria-hidden="true">
            DW
          </span>
          Datenwerkstatt
        </a>
      </header>
      <main className="reference" id="reference">
        <h1>Komponentenreferenz</h1>
        <p>Entwicklungsansicht ohne Workspace, DuckDB oder webR.</p>
        <section>
          <PanelHeader title="Aktionen" />
          <ActionGroup data-testid="variants">
            {(['default', 'danger'] as const).flatMap((tone) =>
              (['primary', 'secondary', 'tertiary'] as const).map((variant) => (
                <Button key={`${variant}-${tone}`} variant={variant} tone={tone}>
                  {variant} {tone}
                </Button>
              )),
            )}
            <Button disabled>Deaktiviert</Button>
            <Button busy busyLabel="Wird gespeichert">
              Speichern
            </Button>
            {tooltipControl && (
              <IconButton icon="gear" label="Optionen" tooltip="Optionen der Arbeitsfläche" />
            )}
            <Button onClick={() => setTimeout(() => setTooltipControl((shown) => !shown), 100)}>
              Tooltip-Auslöser umschalten (100 ms)
            </Button>
          </ActionGroup>
          <Toolbar>
            <Button variant="primary" icon="play-fill">
              Kompakt ausführen
            </Button>
            <Button>Speichern</Button>
            <SplitButton
              label="Kompakt exportieren"
              menuLabel="Kompakte Exportformate"
              onClick={() => setAction('CSV')}
              actions={[{label: 'Kompaktes Parquet', onSelect: () => setAction('Parquet')}]}
            />
            <Button variant="tertiary">Weitere Aktionen Referenz</Button>
            <Button variant="tertiary" disabled>
              Deaktiviert Referenz
            </Button>
            <Button variant="tertiary" aria-pressed="true">
              Ausgewählt Referenz
            </Button>
          </Toolbar>
          <ActionGroup data-testid="wrapped-actions" className="reference-wrap">
            <Button>Grafik Vollbild</Button>
            <Button>PNG herunterladen</Button>
            <Button>Grafik aufbewahren</Button>
          </ActionGroup>
        </section>
        <section>
          <PanelHeader title="Formulare" />
          <form
            className="reference-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted((n) => n + 1);
            }}
          >
            <FormField label="Projektname" hint="Ein eindeutiger Name für das Projekt.">
              <Input required name="project" />
            </FormField>
            <FormField
              label="Ein langes Label, das bei schmalen Ansichten auf mehrere Zeilen umbrechen darf"
              error="Der angegebene Name ist ungültig. Bitte einen anderen Namen verwenden."
            >
              <Input defaultValue="Fehler" />
            </FormField>
            <FormField label="Beschreibung" optional>
              <Textarea />
            </FormField>
            <FormField label="Schreibgeschützter Name">
              <Input readOnly value="Fest vorgegeben" />
            </FormField>
            <FormField label="Deaktivierte Eingabe">
              <Input disabled value="Nicht verfügbar" />
            </FormField>
            <FormField label="Modus">
              <Select>
                <option>Lokal</option>
                <option>Sitzung</option>
              </Select>
            </FormField>
            <FormField label="Originaldatei behalten">
              <Input type="checkbox" />
            </FormField>
            <FormField label="Erste Auswahl">
              <Input type="radio" name="selection" defaultChecked />
            </FormField>
            <FormField label="Zweite Auswahl">
              <Input type="radio" name="selection" />
            </FormField>
            <FormField label="Datei">
              <FileInput />
            </FormField>
            <ActionGroup>
              <Button onClick={() => setAction('Vorschau')}>Vorschau</Button>
              <Button variant="primary" type="submit">
                Formular senden
              </Button>
            </ActionGroup>
            <output aria-label="Formularstatus">{submitted} gesendet</output>
          </form>
        </section>
        <section>
          <PanelHeader title="Status und Meldungen" />
          <ActionGroup>
            {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((tone) => (
              <StatusBadge tone={tone} key={tone}>
                {tone}
              </StatusBadge>
            ))}
          </ActionGroup>
          <Notice>Information: Die Vorschau zeigt die ersten 200 Zeilen.</Notice>
          <Notice tone="success">Erfolg: Lokal gespeichert.</Notice>
          <Notice tone="warning">Warnung: Nur in dieser Sitzung verfügbar.</Notice>
          <Notice tone="danger">
            Fehler: Die Datei konnte nicht gelesen werden. Diese lange Meldung muss umbrechen und
            darf keine Aktionen verdecken.
          </Notice>
          <EmptyState>Noch keine Daten.</EmptyState>
          <pre>SELECT 'JetBrains Mono' AS schrift;</pre>
          <ActionGroup>
            <FontStatus font="Source Sans 3" />
            <FontStatus font="Source Sans 3" weight={500} />
            <FontStatus font="Source Sans 3" weight={600} />
            <FontStatus font="Source Sans 3" italic />
            <FontStatus font="JetBrains Mono" />
          </ActionGroup>
        </section>
        <section>
          <PanelHeader title="Tabellen" />
          <table className="dw-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className="numeric">
                  Anzahl
                </th>
                <th scope="col">Kennung</th>
                <th scope="col">Zeitpunkt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Beispiel</td>
                <td className="numeric">0</td>
                <td>00123</td>
                <td>
                  <time dateTime="2026-10-21T12:34:56Z">21.10.2026, 14:34</time>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section aria-label="Menü- und Split-Buttons">
          <PanelHeader title="Menü- und Split-Buttons" />
          <ActionGroup>
            <MenuButton
              label="Daten hinzufügen"
              actions={[
                {label: 'Datei hinzufügen', onSelect: () => setAction('Datei')},
                {label: 'Aus Portal hinzufügen', onSelect: () => setAction('Portal')},
                {label: 'Dialog aus Menü', onSelect: () => setModal(true)},
                {label: 'Zur Referenz', link: <a href="#reference" />},
              ]}
            />
            <SplitButton
              label="CSV exportieren"
              menuLabel="Weitere Exportformate"
              onClick={() => setAction('CSV')}
              actions={[
                {label: 'Parquet exportieren', onSelect: () => setAction('Parquet')},
                {
                  label: 'Deaktiviertes Format',
                  disabled: true,
                  onSelect: () => setAction('FEHLER'),
                },
              ]}
            />
            <SplitButton
              label="Laufender Export"
              busy
              busyLabel="Export läuft"
              menuLabel="Verfügbare Alternativen"
              onClick={() => setAction('FEHLER')}
              actions={[
                {label: 'Andere verfügbare Variante', onSelect: () => setAction('Alternative')},
              ]}
            />
            <SplitButton
              label="Ohne Alternativen"
              menuLabel="Nicht anzeigen"
              actions={[]}
              onClick={() => setAction('Einzelaktion')}
            />
            <MenuButton
              label="Gesperrtes Menü"
              actions={[{label: 'Gesperrt', disabled: true, onSelect: () => setAction('FEHLER')}]}
            />
            <ActionMenu
              iconOnly
              label="Aktionen für Beispiel"
              actions={[{label: 'Beispiel duplizieren', onSelect: () => setAction('Duplikat')}]}
            />
          </ActionGroup>
          <ActionGroup>
            {(['default', 'danger'] as const).flatMap((tone) =>
              (['primary', 'secondary', 'tertiary'] as const).map((variant) => (
                <SplitButton
                  key={`${tone}-${variant}`}
                  label={`Split ${variant} ${tone}`}
                  menuLabel={`Varianten ${variant} ${tone}`}
                  variant={variant}
                  tone={tone}
                  size="compact"
                  onClick={() => setAction('Variante')}
                  actions={[{label: 'Alternative', tone, onSelect: () => setAction('Variante')}]}
                />
              )),
            )}
            <MenuButton
              label="Ein lang beschrifteter Menü-Button mit mehreren verständlichen Wörtern"
              actions={[
                {
                  label:
                    'Ein langer Menüeintrag, der auch an der Viewportkante vollständig lesbar bleibt',
                  onSelect: () => setAction('Lang'),
                },
              ]}
            />
          </ActionGroup>
        </section>
        <section>
          <PanelHeader title="Menü und Dialog" />
          <ActionGroup>
            <ActionMenu
              actions={[
                {label: 'Erste Aktion', onSelect: () => setAction('Erste Aktion')},
                {label: 'Nicht verfügbar', disabled: true, onSelect: () => {}},
                {label: 'Letzte Aktion', onSelect: () => setAction('Letzte Aktion')},
              ]}
            />
            <Button onClick={() => setModal(true)}>Dialog öffnen</Button>
          </ActionGroup>
          <output aria-label="Aktionsstatus">{action}</output>
          {modal && (
            <Modal
              title="Beispieldialog"
              onClose={() => setModal(false)}
              footer={
                <Button variant="primary" onClick={() => setModal(false)}>
                  Übernehmen
                </Button>
              }
            >
              <FormField label="Dialogname">
                <Input />
              </FormField>
              <Notice tone="warning">
                Lange Beschriftungen und Hinweise bleiben vollständig lesbar.
              </Notice>
            </Modal>
          )}
        </section>
        <section>
          <PanelHeader title="Navigation" />
          <div className="reference-navigation">
            <nav className="sidebar" aria-label="Referenznavigation">
              <NavigationItem
                icon="database"
                label="SQL"
                tooltip="SQL mit DuckDB"
                expanded={false}
                current
              >
                <Button />
              </NavigationItem>
              <NavigationItem icon="bar-chart-line" label="R" tooltip="R mit webR" expanded={false}>
                <Button />
              </NavigationItem>
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Reference />);
