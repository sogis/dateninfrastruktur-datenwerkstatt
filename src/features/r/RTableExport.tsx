import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import type {EditingSession} from '../../application/workspaceService';
import type {RObjectRef, TransferPlan} from '../../application/ports';
import type {TableExportFormat} from '../../application/rPorts';
import {report} from '../../app/router';
import {downloadStream} from '../../app/download';
import {SplitButton} from '../../ui/ActionMenu';
import {Button} from '../../ui/Controls';
import {Modal} from '../../ui/Modal';
import {useFormValidation} from '../../ui/useFormValidation';
import {approvalChecks, PlanView} from './Transfer';

export function RTableExport({session, object}: {session: EditingSession; object: RObjectRef}) {
  const service = session.getR();
  const scheduler = useSyncExternalStore(
    session.scheduler.subscribe,
    session.scheduler.getSnapshot,
  );
  const [plan, setPlan] = useState<TransferPlan>();
  const [format, setFormat] = useState<TableExportFormat>('csv');
  const [approved, setApproved] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const pending = useRef(false);
  const live = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const planId = useRef<string | null>(null);
  const form = useFormValidation(approvalChecks(plan, approved));
  const discard = () => {
    if (planId.current) service.discardExport(planId.current);
    planId.current = null;
  };
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
      if (planId.current) service.discardExport(planId.current);
    };
  }, [service]);
  const work = async (selected: TableExportFormat, existing?: TransferPlan) => {
    if (pending.current || session.readOnly || session.scheduler.getSnapshot()) return;
    pending.current = true;
    setWorking(true);
    setFormat(selected);
    const control = new AbortController();
    controller.current = control;
    try {
      const checked = existing ?? (await service.planExport(object, selected, control.signal));
      planId.current = checked.id;
      if (!live.current) {
        discard();
        return;
      }
      if (!existing && checked.requiresApproval) {
        setApproved([]);
        setPlan(checked);
        return;
      }
      const stream = await service.exportTable(
        checked.id,
        existing ? approved : [],
        control.signal,
      );
      control.signal.throwIfAborted();
      if (!live.current) {
        await stream.cancel();
        return;
      }
      await downloadStream(
        stream,
        `${object.name}.${selected}`,
        selected === 'csv' ? 'text/csv' : 'application/vnd.apache.parquet',
      );
      discard();
      setPlan(undefined);
    } catch (cause) {
      discard();
      if (live.current) {
        setPlan(undefined);
        report(cause);
      }
    } finally {
      pending.current = false;
      controller.current = null;
      if (live.current) setWorking(false);
    }
  };
  const blocked = session.readOnly || !!scheduler || working;
  return (
    <div className="r-table-export">
      <SplitButton
        label="CSV exportieren"
        menuLabel="Weitere Exportformate"
        disabled={blocked}
        busy={working && format === 'csv'}
        busyLabel="CSV wird exportiert …"
        onClick={() => void work('csv')}
        actions={[
          {label: 'Parquet exportieren', disabled: blocked, onSelect: () => void work('parquet')},
        ]}
      />
      <p className="export-note">
        CSV enthält keine Typinformationen. Exportiert wird der vollständige aktuelle Dataframe „
        {object.name}“.
      </p>
      {working && <Button onClick={() => controller.current?.abort()}>Export abbrechen</Button>}
      {working && <p role="status">{format.toUpperCase()} wird vorbereitet und exportiert …</p>}
      {plan && (
        <Modal
          title="R-Tabelle exportieren"
          onClose={() => {
            if (!pending.current) {
              discard();
              setPlan(undefined);
            }
          }}
          footer={
            <>
              <Button
                variant="primary"
                busy={working}
                busyLabel="Wird exportiert …"
                disabled={blocked}
                onClick={() => {
                  if (form.validate()) void work(format, plan);
                }}
              >
                {format.toUpperCase()} exportieren
              </Button>
              {working && (
                <Button onClick={() => controller.current?.abort()}>Export abbrechen</Button>
              )}
            </>
          }
        >
          <PlanView
            plan={plan}
            approved={approved}
            onChange={setApproved}
            validation={form}
            purpose="export"
          />
          <p>Es wird nur die Datei erzeugt. Das Projekt erhält keinen neuen Datensatz.</p>
        </Modal>
      )}
    </div>
  );
}
