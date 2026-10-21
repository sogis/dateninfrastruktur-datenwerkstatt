import {
  cloneElement,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
  type Ref,
} from 'react';
import {Icon, type IconName} from './Icon';
export type ControlSize = 'default' | 'compact';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ControlSize;
  busy?: boolean;
  icon?: IconName | undefined;
}
export function Button({
  variant = 'secondary',
  size,
  busy = false,
  icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`dw-button dw-button--${variant} ${size ? `dw-size-${size}` : ''} ${className}`}
    >
      {busy ? (
        <Icon name="arrow-repeat" className="dw-spin" size={16} />
      ) : icon ? (
        <Icon name={icon} size={16} />
      ) : null}
      {children}
    </button>
  );
}
type TooltipState =
  | {phase: 'closed' | 'waiting' | 'measuring'}
  | {phase: 'open'; left: number; top: number};
// UI-only ownership, scoped to each document; also owns pending hover timers.
const activeTooltips = new WeakMap<Document, () => void>();
export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactElement<{'aria-describedby'?: string | undefined}>;
}) {
  const id = useId();
  const host = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const ownerDocument = useRef<Document | null>(null);
  const timer = useRef<number | null>(null);
  const generation = useRef(0);
  const source = useRef<'hover' | 'keyboard' | null>(null);
  const [state, setState] = useState<TooltipState>({phase: 'closed'});
  const cancelPending = useCallback(() => {
    generation.current++;
    if (timer.current !== null) {
      ownerDocument.current?.defaultView?.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  const close = useCallback(() => {
    cancelPending();
    source.current = null;
    const doc = ownerDocument.current;
    if (doc && activeTooltips.get(doc) === close) activeTooltips.delete(doc);
    setState({phase: 'closed'});
  }, [cancelPending]);
  const reveal = useCallback(
    (delay: number) => {
      close();
      const doc = host.current?.ownerDocument;
      const win = doc?.defaultView;
      if (!doc || !win) return;
      activeTooltips.get(doc)?.();
      activeTooltips.set(doc, close);
      ownerDocument.current = doc;
      source.current = delay === 0 ? 'keyboard' : 'hover';
      const ticket = generation.current;
      if (delay === 0) {
        setState({phase: 'measuring'});
      } else {
        setState({phase: 'waiting'});
        timer.current = win.setTimeout(() => {
          timer.current = null;
          if (ticket === generation.current && activeTooltips.get(doc) === close)
            setState({phase: 'measuring'});
        }, delay);
      }
    },
    [close],
  );
  useLayoutEffect(() => {
    if (state.phase !== 'measuring' && state.phase !== 'open') return;
    const wrapper = host.current;
    const trigger = wrapper?.firstElementChild;
    const tip = tooltip.current;
    const doc = host.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!wrapper || !trigger || !tip || !doc || !win) return;
    const measure = () => {
      if (activeTooltips.get(doc) !== close) return;
      const rect = trigger.getBoundingClientRect();
      if (
        !trigger.isConnected ||
        rect.width === 0 ||
        rect.height === 0 ||
        rect.right <= 0 ||
        rect.left >= win.innerWidth ||
        rect.bottom <= 0 ||
        rect.top >= win.innerHeight
      ) {
        close();
        return;
      }
      const {width, height} = tip.getBoundingClientRect();
      const right = rect.right + 8;
      const preferredLeft = right + width <= win.innerWidth - 8 ? right : rect.left - width - 8;
      const left = Math.max(8, Math.min(preferredLeft, win.innerWidth - width - 8));
      const top = Math.max(
        8,
        Math.min(rect.top + (rect.height - height) / 2, win.innerHeight - height - 8),
      );
      setState((current) =>
        current.phase === 'open' && current.left === left && current.top === top
          ? current
          : {phase: 'open', left, top},
      );
    };
    measure();
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = win.requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(wrapper);
    observer.observe(trigger);
    observer.observe(tip);
    doc.addEventListener('scroll', schedule, true);
    win.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      doc.removeEventListener('scroll', schedule, true);
      win.removeEventListener('resize', schedule);
      if (frame !== null) win.cancelAnimationFrame(frame);
    };
  }, [close, state.phase, text]);
  useLayoutEffect(() => {
    if (state.phase === 'closed') return;
    const doc = ownerDocument.current;
    if (!doc) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    doc.addEventListener('pointerdown', close, true);
    doc.addEventListener('keydown', escape, true);
    return () => {
      doc.removeEventListener('pointerdown', close, true);
      doc.removeEventListener('keydown', escape, true);
    };
  }, [close, state.phase]);
  useLayoutEffect(
    () => () => {
      cancelPending();
      const doc = ownerDocument.current;
      if (doc && activeTooltips.get(doc) === close) activeTooltips.delete(doc);
    },
    [cancelPending, close],
  );
  return (
    <span
      ref={host}
      className="dw-tooltip-host"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch' && source.current !== 'keyboard') reveal(250);
      }}
      onPointerLeave={() => {
        if (source.current !== 'keyboard') close();
      }}
      onPointerDown={close}
      onClick={close}
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) {
          reveal(0);
        }
      }}
      onBlur={() => {
        close();
      }}
    >
      {cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' '),
      })}
      <span
        ref={tooltip}
        id={id}
        role="tooltip"
        className="dw-tooltip"
        hidden={state.phase === 'closed' || state.phase === 'waiting'}
        style={{
          left: state.phase === 'open' ? state.left : 0,
          top: state.phase === 'open' ? state.top : 0,
          visibility: state.phase === 'open' ? 'visible' : 'hidden',
        }}
      >
        {text}
      </span>
    </span>
  );
}
export function IconButton({
  label,
  tooltip = label,
  icon,
  ...props
}: Omit<ButtonProps, 'children'> & {label: string; tooltip?: string; icon: IconName}) {
  return (
    <Tooltip text={tooltip}>
      <Button {...props} aria-label={label} className={`dw-icon-button ${props.className ?? ''}`}>
        <Icon name={icon} />
      </Button>
    </Tooltip>
  );
}
export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {ref?: Ref<HTMLInputElement>}) {
  return <input {...props} className={`dw-input ${className}`} />;
}
export function Select({className = '', ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`dw-select ${className}`} />;
}
export function Textarea({className = '', ...props}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`dw-textarea ${className}`} />;
}
type FieldControl = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | 'id'
  | 'type'
  | 'required'
  | 'aria-describedby'
  | 'aria-invalid'
  | 'aria-label'
  | 'aria-labelledby'
>;
export function FormField({
  label,
  hint,
  error,
  labelHidden = false,
  children,
  className = '',
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelHidden?: boolean;
  children: ReactElement<FieldControl>;
  className?: string;
}) {
  const generated = useId();
  const id = children.props.id ?? generated;
  const check = ['checkbox', 'radio'].includes(children.props.type ?? '');
  const describedBy =
    [children.props['aria-describedby'], hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  const input = cloneElement(children, {
    id,
    'aria-labelledby':
      children.props['aria-labelledby'] ??
      (children.props['aria-label'] ? undefined : `${id}-label-text`),
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : children.props['aria-invalid'],
  });
  const labelNode = (
    <label
      id={`${id}-label`}
      htmlFor={id}
      className={`dw-label ${labelHidden ? 'visually-hidden' : ''}`}
    >
      <span id={`${id}-label-text`}>{label}</span>
      {children.props.required && <span aria-hidden="true"> *</span>}
    </label>
  );
  return (
    <div
      className={`dw-field ${check ? 'dw-field--check' : ''} ${labelHidden ? 'dw-field--hidden' : ''} ${className}`}
    >
      {check ? (
        <div className="dw-check-line">
          {input}
          {labelNode}
        </div>
      ) : (
        <>
          {labelNode}
          {labelHidden && children.props.required && (
            <span className="dw-field-required-inline" aria-hidden="true">
              *
            </span>
          )}
          {input}
        </>
      )}
      {hint && (
        <p id={`${id}-hint`} className="dw-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="dw-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function FileInput({
  buttonLabel = 'Datei auswählen',
  selectedFile,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {buttonLabel?: string; selectedFile?: File | null}) {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const generated = useId();
  const requiredId = `${props.id ?? generated}-required`;
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input || selectedFile === undefined) return;
    if (!selectedFile) input.value = '';
    else if (input.files?.[0] !== selectedFile) {
      const transfer = new DataTransfer();
      transfer.items.add(selectedFile);
      input.files = transfer.files;
    }
  });
  const shownName = selectedFile === undefined ? fileName : selectedFile?.name;
  return (
    <span className="dw-file-input">
      <Input
        {...props}
        ref={ref}
        type="file"
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          setFileName(e.target.files?.[0]?.name ?? '');
          props.onChange?.(e);
        }}
      />
      <Button
        icon="upload"
        aria-describedby={
          [
            props.id ? `${props.id}-label` : '',
            props['aria-describedby'],
            props.required ? requiredId : '',
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={props['aria-invalid']}
        disabled={props.disabled}
        onBlur={(event) => {
          const input = ref.current;
          if (input) props.onBlur?.({...event, target: input, currentTarget: input});
        }}
        onClick={() => ref.current?.click()}
      >
        {buttonLabel}
      </Button>
      {shownName && <span className="dw-file-name">{shownName}</span>}
      {props.required && (
        <span id={requiredId} className="visually-hidden">
          Pflichtfeld
        </span>
      )}
    </span>
  );
}
export function RequiredFieldsNote() {
  return <p className="dw-required-note">* Pflichtfeld</p>;
}
export function ActionGroup({className = '', ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`dw-actions ${className}`} />;
}
export function Toolbar({className = '', ...props}: HTMLAttributes<HTMLDivElement>) {
  return <ActionGroup {...props} className={`dw-toolbar dw-compact ${className}`} />;
}
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}) {
  return <span className={`dw-badge dw-tone-${tone}`}>{children}</span>;
}
export function Notice({
  tone = 'info',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & {tone?: 'info' | 'success' | 'warning' | 'danger'}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      {...props}
      className={`dw-notice dw-tone-${tone} ${className}`}
    />
  );
}
export function PanelHeader({title, children}: {title: string; children?: ReactNode}) {
  return (
    <div className="dw-panel-header">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function EmptyState({children}: {children: ReactNode}) {
  return <div className="dw-empty">{children}</div>;
}
