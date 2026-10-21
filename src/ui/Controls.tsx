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
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonTone = 'default' | 'danger';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ControlSize;
  busy?: boolean;
  busyLabel?: string;
  icon?: IconName | undefined;
}
export function Button({
  variant = 'secondary',
  tone = 'default',
  size,
  busy = false,
  busyLabel = 'Wird verarbeitet …',
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
      className={`dw-button dw-button--${variant} dw-button--tone-${tone} ${size ? `dw-size-${size}` : ''} ${className}`}
    >
      {busy ? (
        <Icon name="arrow-repeat" className="dw-spin" size={16} />
      ) : icon ? (
        <Icon name={icon} size={16} />
      ) : null}
      {busy ? busyLabel : children}
    </button>
  );
}
type TooltipState =
  | {phase: 'closed' | 'waiting' | 'measuring'}
  | {phase: 'open'; left: number; top: number; placement: 'right' | 'left'};
type TooltipTrigger = Pick<
  HTMLAttributes<HTMLElement>,
  'aria-describedby' | 'onPointerEnter' | 'onPointerLeave' | 'onFocus' | 'onBlur'
>;
// UI-only ownership, scoped to each document; also owns pending hover timers.
const activeTooltips = new WeakMap<Document, () => void>();
export function Tooltip({text, children}: {text: string; children: ReactElement<TooltipTrigger>}) {
  const id = useId();
  const host = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const ownerDocument = useRef<Document | null>(null);
  const showTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const generation = useRef(0);
  const showing = useRef(false);
  const dismissed = useRef(false);
  const conditions = useRef({triggerHover: false, tooltipHover: false, keyboardFocus: false});
  const [state, setState] = useState<TooltipState>({phase: 'closed'});
  const cancelPending = useCallback(() => {
    generation.current++;
    const win = ownerDocument.current?.defaultView;
    if (showTimer.current !== null) {
      win?.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (closeTimer.current !== null) {
      win?.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  const close = useCallback(() => {
    cancelPending();
    showing.current = false;
    dismissed.current = true;
    conditions.current.tooltipHover = false;
    const doc = ownerDocument.current;
    if (doc && activeTooltips.get(doc) === close) activeTooltips.delete(doc);
    setState({phase: 'closed'});
  }, [cancelPending]);
  const reveal = useCallback(
    (delay: number) => {
      if (dismissed.current) return;
      const doc = host.current?.ownerDocument;
      const win = doc?.defaultView;
      if (!doc || !win) return;
      if (activeTooltips.get(doc) !== close) {
        activeTooltips.get(doc)?.();
        activeTooltips.set(doc, close);
      }
      ownerDocument.current = doc;
      if (closeTimer.current !== null) {
        win.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      if (showing.current && showTimer.current === null) return;
      if (showTimer.current !== null) {
        if (delay > 0) return;
        win.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      showing.current = true;
      const ticket = ++generation.current;
      if (delay === 0) {
        setState({phase: 'measuring'});
      } else {
        setState({phase: 'waiting'});
        showTimer.current = win.setTimeout(() => {
          showTimer.current = null;
          if (ticket === generation.current && activeTooltips.get(doc) === close)
            setState({phase: 'measuring'});
        }, delay);
      }
    },
    [close],
  );
  const settle = useCallback(() => {
    const win = ownerDocument.current?.defaultView;
    if (closeTimer.current !== null) {
      win?.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (Object.values(conditions.current).some(Boolean) || !showing.current) return;
    if (showTimer.current !== null) {
      close();
      return;
    }
    // The transparent hit area bridges the 8px gap; grace also allows diagonal movement.
    if (win)
      closeTimer.current = win.setTimeout(() => {
        closeTimer.current = null;
        if (!Object.values(conditions.current).some(Boolean)) close();
      }, 120);
  }, [close]);
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
      const placement = right + width <= win.innerWidth - 8 ? 'right' : 'left';
      const preferredLeft = placement === 'right' ? right : rect.left - width - 8;
      const left = Math.max(8, Math.min(preferredLeft, win.innerWidth - width - 8));
      const top = Math.max(
        8,
        Math.min(rect.top + (rect.height - height) / 2, win.innerHeight - height - 8),
      );
      setState((current) =>
        current.phase === 'open' &&
        current.left === left &&
        current.top === top &&
        current.placement === placement
          ? current
          : {phase: 'open', left, top, placement},
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
    <span ref={host} className="dw-tooltip-host" onPointerDown={close} onClick={close}>
      {cloneElement(children, {
        'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' '),
        onPointerEnter: (event) => {
          children.props.onPointerEnter?.(event);
          if (event.pointerType === 'touch') return;
          conditions.current.triggerHover = true;
          dismissed.current = false;
          reveal(conditions.current.keyboardFocus ? 0 : 250);
        },
        onPointerLeave: (event) => {
          children.props.onPointerLeave?.(event);
          if (event.pointerType === 'touch') return;
          conditions.current.triggerHover = false;
          settle();
        },
        onFocus: (event) => {
          children.props.onFocus?.(event);
          if (!event.currentTarget.matches(':focus-visible')) return;
          conditions.current.keyboardFocus = true;
          dismissed.current = false;
          reveal(0);
        },
        onBlur: (event) => {
          children.props.onBlur?.(event);
          conditions.current.keyboardFocus = false;
          settle();
        },
      })}
      <span
        ref={tooltip}
        id={id}
        role="tooltip"
        className="dw-tooltip"
        data-placement={state.phase === 'open' ? state.placement : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === 'touch') return;
          conditions.current.tooltipHover = true;
          settle();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'touch') return;
          conditions.current.tooltipHover = false;
          settle();
        }}
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
  optional = false,
  children,
  className = '',
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelHidden?: boolean;
  optional?: boolean;
  children: ReactElement<FieldControl>;
  className?: string;
}) {
  const generated = useId();
  const id = children.props.id ?? generated;
  const check = ['checkbox', 'radio'].includes(children.props.type ?? '');
  const describedBy =
    [
      children.props['aria-describedby'],
      optional ? `${id}-optional` : '',
      hint ? `${id}-hint` : '',
      error ? `${id}-error` : '',
    ]
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
  const optionalNode = optional ? (
    <span id={`${id}-optional`} className="dw-field-optional">
      (optional)
    </span>
  ) : null;
  const labelNode = (
    <label
      id={`${id}-label`}
      htmlFor={id}
      className={`dw-label ${labelHidden ? 'visually-hidden' : ''}`}
    >
      <span id={`${id}-label-text`}>{label}</span>
      {!labelHidden && optional && <> {optionalNode}</>}
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
          {input}
          {labelHidden && optionalNode}
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
          [props.id ? `${props.id}-label` : '', props['aria-describedby']]
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
    </span>
  );
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
