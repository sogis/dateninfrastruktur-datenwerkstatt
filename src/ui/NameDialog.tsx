import {useEffect, useId, useRef, useState} from 'react';
import {displayNameError} from '../domain/fieldValidation';
import {failureMessage} from '../application/errors';
import {Button, FormField, Input, Notice} from './Controls';
import {Modal} from './Modal';
import {useFormValidation} from './useFormValidation';

export function NameDialog({
  title,
  label,
  initialName,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  label: string;
  initialName: string;
  submitLabel: string;
  onSubmit(name: string): Promise<unknown>;
  onClose(): void;
}) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const noun = label === 'Analysename' ? 'Analysenamen' : 'Versionsnamen';
  const form = useFormValidation({name: () => displayNameError(name, noun)});
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
      showClose={false}
      footer={
        <>
          <Button disabled={busy} onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={id}
            busy={busy}
            busyLabel="Wird gespeichert …"
            disabled={busy}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={id}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (submitting.current || !form.validate()) return;
          submitting.current = true;
          setBusy(true);
          setError('');
          void onSubmit(name.trim())
            .then(onClose)
            .catch((failure: unknown) => {
              setError(failureMessage(failure));
            })
            .finally(() => {
              submitting.current = false;
              setBusy(false);
            });
        }}
      >
        <FormField label={label} error={form.errors.name}>
          <Input
            {...form.control('name')}
            ref={input}
            required
            maxLength={120}
            disabled={busy}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              form.change('name', displayNameError(event.target.value, noun));
            }}
          />
        </FormField>
      </form>
      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}
