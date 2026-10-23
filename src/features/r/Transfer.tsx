import {Button, Input, Select, FormField, Notice} from '../../ui/Controls';
import {useFormValidation} from '../../ui/useFormValidation';
import {bindingNameError, requiredValueError} from '../../domain/fieldValidation';
import {useRef, useState} from 'react';
import {useNavigate} from '@tanstack/react-router';
import type {EditingSession} from '../../application/workspaceService';
import type {ResultId, AnalysisId} from '../../domain/model';
import type {TransferPlan} from '../../application/ports';
import {Modal} from '../../ui/Modal';
export function approvalChecks(plan: TransferPlan | undefined, approved: string[]) {
  return Object.fromEntries(
    (plan?.issues ?? [])
      .filter((issue) => issue.requiresApproval)
      .map((issue) => [
        `approval-${issue.id}`,
        () =>
          approved.includes(issue.id)
            ? undefined
            : 'Bitte bestätige diese Umwandlung, um fortzufahren.',
      ]),
  );
}
export function PlanView({
  plan,
  approved,
  onChange,
  validation,
  purpose = 'transfer',
}: {
  plan: TransferPlan;
  purpose?: 'transfer' | 'export';
  approved: string[];
  onChange(ids: string[]): void;
  validation: ReturnType<typeof useFormValidation>;
}) {
  return (
    <>
      <p>
        {plan.rowCount} Zeilen · {plan.estimatedBytes.toLocaleString('de-CH')} Bytes
        {purpose === 'export' ? ' Tabellendaten.' : ' Transferpayload.'}{' '}
        {purpose === 'export'
          ? 'Es werden alle Tabellenzeilen exportiert.'
          : 'Es werden alle Resultatzeilen übernommen.'}
      </p>
      <ul>
        {plan.issues.map((i) => (
          <li key={i.id}>
            {i.requiresApproval ? (
              <FormField label={<>{i.message}</>} error={validation.errors[`approval-${i.id}`]}>
                <Input
                  {...validation.control(`approval-${i.id}`)}
                  required
                  type="checkbox"
                  checked={approved.includes(i.id)}
                  onChange={(e) => {
                    validation.change(
                      `approval-${i.id}`,
                      e.target.checked ? undefined : 'Bestätigung fehlt.',
                    );
                    onChange(
                      e.target.checked ? [...approved, i.id] : approved.filter((id) => id !== i.id),
                    );
                  }}
                />
              </FormField>
            ) : (
              i.message
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
export function TransferToR({
  session,
  resultId,
  onClose,
}: {
  session: EditingSession;
  resultId: ResultId;
  onClose(): void;
}) {
  const navigate = useNavigate();
  const analyses = Object.values(session.document.analyses).filter(
    (a) => a.kind === 'r' && !a.archivedAt,
  );
  const [analysisId, setAnalysisId] = useState<string>(analyses[0]?.id ?? 'new');
  const [variable, setVariable] = useState('daten');
  const [plan, setPlan] = useState<TransferPlan>();
  const [approved, setApproved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<'plan' | 'commit'>();
  const pending = useRef(false);
  const [error, setError] = useState('');
  const form = useFormValidation({
    analysis: () => requiredValueError(analysisId),
    variable: () => bindingNameError(variable),
    ...approvalChecks(plan, approved),
  });
  const act = async (action: 'plan' | 'commit', work: () => Promise<void>) => {
    if (pending.current || session.readOnly) return;
    pending.current = true;
    setBusyAction(action);
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      pending.current = false;
      setBusyAction(undefined);
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Resultat in R übernehmen"
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <>
          <Button
            disabled={busy}
            busy={busyAction === 'plan'}
            busyLabel="Transfer wird geprüft …"
            onClick={() => {
              if (!form.validate(['analysis', 'variable'])) return;
              void act('plan', async () => {
                const id =
                  analysisId === 'new' ? session.createAnalysis('r') : (analysisId as AnalysisId);
                setAnalysisId(id);
                setApproved([]);
                setPlan(
                  await session
                    .getR()
                    .planToR(resultId, id, variable, new AbortController().signal),
                );
              });
            }}
          >
            Transfer prüfen
          </Button>
          {plan && (
            <Button
              variant="primary"
              disabled={busy}
              busy={busyAction === 'commit'}
              busyLabel="Resultat wird übernommen …"
              onClick={() => {
                if (!form.validate()) return;
                void act('commit', async () => {
                  await session.getR().commitToR(plan.id, approved, new AbortController().signal);
                  onClose();
                  await navigate({
                    to: '/projects/$workspaceId/r/$analysisId',
                    params: {workspaceId: session.document.workspace.id, analysisId},
                  });
                });
              }}
            >
              In R übernehmen
            </Button>
          )}
        </>
      }
    >
      <FormField label={<>R-Analyse</>}>
        <Select
          {...form.control('analysis')}
          required
          value={analysisId}
          disabled={busy}
          onChange={(e) => {
            setAnalysisId(e.target.value);
            setPlan(undefined);
          }}
        >
          <option value="new">Neue R-Analyse</option>
          {analyses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={<>R-Variablenname</>} error={form.errors.variable}>
        <Input
          {...form.control('variable')}
          required
          value={variable}
          disabled={busy}
          onChange={(e) => {
            setVariable(e.target.value);
            form.change('variable', bindingNameError(e.target.value));
            setPlan(undefined);
          }}
        />
      </FormField>

      {plan && (
        <>
          <PlanView plan={plan} approved={approved} onChange={setApproved} validation={form} />
          <p>
            Das Resultat wird vor der dauerhaften Eingabebindung gesichert. Das R-Skript wird nicht
            gestartet.
          </p>
        </>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      {busy && <Notice tone="info">Transfer wird verarbeitet …</Notice>}
    </Modal>
  );
}
