import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Button,
  IconButton,
  type ButtonProps,
  type ButtonTone,
  type ButtonVariant,
  type ControlSize,
} from './Controls';
import {Icon, type IconName} from './Icon';

type MenuLink = ReactElement<AnchorHTMLAttributes<HTMLAnchorElement>>;
export type MenuAction = {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  icon?: IconName;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  separatorBefore?: boolean;
} & ({onSelect(): void; link?: never} | {link: MenuLink; onSelect?: never});
interface MenuProps {
  label: string;
  actions: MenuAction[];
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ControlSize;
  disabled?: boolean;
  contextKey?: string;
}
type TriggerProps = Pick<
  ButtonProps,
  'ref' | 'onClick' | 'onKeyDown' | 'disabled' | 'aria-haspopup' | 'aria-expanded' | 'aria-controls'
>;

/** Shared command menu: the caller supplies only the trigger, never focus logic. */
function CommandMenu({
  label,
  actions,
  disabled,
  contextKey,
  trigger: renderTrigger,
  children,
  className = '',
}: MenuProps & {
  trigger(props: TriggerProps): ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    maxHeight: number;
    placement: 'bottom' | 'top';
  } | null>(null);
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const last = useRef(false);
  const items = () =>
    Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const unavailable =
    disabled || actions.length === 0 || actions.every((a) => a.disabled || a.busy);
  const close = (restore: boolean) => {
    setOpen(false);
    if (restore && trigger.current?.isConnected) trigger.current.focus();
  };
  useEffect(() => {
    setOpen(false);
  }, [contextKey]);
  useEffect(() => {
    if (unavailable) setOpen(false);
  }, [unavailable]);
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const anchor = trigger.current,
      panel = menu.current,
      doc = anchor?.ownerDocument,
      win = doc?.defaultView;
    if (!anchor || !panel || !doc || !win) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      if (
        !anchor.isConnected ||
        rect.bottom <= 0 ||
        rect.top >= win.innerHeight ||
        rect.right <= 0 ||
        rect.left >= win.innerWidth
      ) {
        setOpen(false);
        return;
      }
      const width = panel.getBoundingClientRect().width;
      const naturalHeight = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
      const below = Math.max(0, win.innerHeight - rect.bottom - 16),
        above = Math.max(0, rect.top - 16);
      const placement = naturalHeight <= below || below >= above ? 'bottom' : 'top';
      const maxHeight = placement === 'bottom' ? below : above;
      const height = Math.min(naturalHeight, maxHeight);
      const left = Math.max(8, Math.min(rect.right - width, win.innerWidth - width - 8));
      const top = Math.max(
        8,
        Math.min(
          placement === 'bottom' ? rect.bottom + 8 : rect.top - height - 8,
          win.innerHeight - height - 8,
        ),
      );
      setPosition((current) =>
        current?.left === left &&
        current.top === top &&
        current.maxHeight === maxHeight &&
        current.placement === placement
          ? current
          : {left, top, maxHeight, placement},
      );
    };
    measure();
    let frame: number | null = null;
    const schedule = () => {
      if (frame === null)
        frame = win.requestAnimationFrame(() => {
          frame = null;
          measure();
        });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    observer.observe(panel);
    doc.addEventListener('scroll', schedule, true);
    win.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      doc.removeEventListener('scroll', schedule, true);
      win.removeEventListener('resize', schedule);
      if (frame !== null) win.cancelAnimationFrame(frame);
    };
  }, [open]);
  const positioned = position !== null;
  useEffect(() => {
    if (!open || !positioned) return;
    const available = items().filter((item) => item.getAttribute('aria-disabled') !== 'true');
    (last.current ? available.at(-1) : available[0])?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !host.current?.contains(event.target)) close(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, positioned]);
  const menuStyle: CSSProperties & {'--dw-menu-max-height': string} = {
    left: position?.left ?? 0,
    top: position?.top ?? 0,
    visibility: positioned ? 'visible' : 'hidden',
    '--dw-menu-max-height': `${position?.maxHeight ?? 0}px`,
  };
  return (
    <div
      ref={host}
      className={`dw-menu ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close(false);
      }}
    >
      {children}
      {renderTrigger({
        ref: trigger,
        disabled: !!unavailable,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => {
          last.current = false;
          setOpen((value) => !value);
        },
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            last.current = event.key === 'ArrowUp';
            setOpen(true);
          }
        },
      })}
      {open && (
        <div
          id={id}
          ref={menu}
          role="menu"
          aria-label={label}
          className="dw-menu-panel"
          data-placement={position?.placement}
          style={menuStyle}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            }
            if (event.key === 'Tab') {
              // Resume native tab order from the trigger; Shift+Tab returns to it.
              if (event.shiftKey) event.preventDefault();
              close(true);
            }
            if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
              event.preventDefault();
              event.target.click();
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const buttons = items(),
                current = buttons.indexOf(document.activeElement as HTMLElement);
              const index =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? buttons.length - 1
                    : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) %
                      buttons.length;
              buttons[index]?.focus();
            }
          }}
        >
          {actions.map((action, index) => {
            const blocked = !!(action.disabled || action.busy);
            const common = {
              role: 'menuitem',
              tabIndex: -1,
              'aria-disabled': blocked || undefined,
              'aria-busy': action.busy || undefined,
            };
            const content = (
              <>
                {action.icon && <Icon name={action.icon} size={16} />}{' '}
                {action.busy ? (action.busyLabel ?? 'Wird verarbeitet …') : action.label}
              </>
            );
            return (
              <div role="none" key={`${index}-${action.label}`}>
                {action.separatorBefore && <div role="separator" className="dw-menu-separator" />}
                {action.link ? (
                  cloneElement(action.link, {
                    ...common,
                    className: `dw-button dw-button--tertiary dw-button--tone-${action.tone ?? 'default'}`,
                    onClick: (event) => {
                      if (blocked) {
                        event.preventDefault();
                        return;
                      }
                      close(true);
                      action.link.props.onClick?.(event);
                    },
                    children: content,
                  })
                ) : (
                  <Button
                    {...common}
                    icon={action.icon}
                    variant={action.variant ?? 'tertiary'}
                    tone={action.tone ?? 'default'}
                    onClick={() => {
                      if (blocked) return;
                      close(true);
                      action.onSelect();
                    }}
                  >
                    {action.busy ? (action.busyLabel ?? 'Wird verarbeitet …') : action.label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function MenuButton({variant = 'secondary', tone = 'default', size, ...props}: MenuProps) {
  return (
    <CommandMenu
      {...props}
      trigger={(trigger) => (
        <Button {...trigger} variant={variant} tone={tone} {...(size ? {size} : {})}>
          {props.label}
          <Icon name="chevron-down" size={16} />
        </Button>
      )}
    />
  );
}
export function ActionMenu({
  label = 'Weitere Aktionen',
  iconOnly = false,
  variant = 'tertiary',
  tone = 'default',
  size,
  ...props
}: Omit<MenuProps, 'label'> & {label?: string; iconOnly?: boolean}) {
  return (
    <CommandMenu
      {...props}
      label={label}
      trigger={(trigger) =>
        iconOnly ? (
          <IconButton
            {...trigger}
            label={label}
            icon="three-dots"
            variant={variant}
            tone={tone}
            {...(size ? {size} : {})}
          />
        ) : (
          <Button
            {...trigger}
            icon="three-dots"
            variant={variant}
            tone={tone}
            {...(size ? {size} : {})}
          >
            {label}
          </Button>
        )
      }
    />
  );
}
export function SplitButton({
  label,
  actions,
  menuLabel,
  variant = 'secondary',
  tone = 'default',
  size,
  disabled,
  busy,
  busyLabel,
  onClick,
  contextKey,
}: {
  label: string;
  menuLabel: string;
  actions: MenuAction[];
  onClick(): void;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ControlSize;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  contextKey?: string;
}) {
  const main = (
    <Button
      variant={variant}
      tone={tone}
      {...(size ? {size} : {})}
      disabled={!!disabled}
      busy={!!busy}
      busyLabel={busyLabel ?? 'Wird verarbeitet …'}
      onClick={() => {
        if (!disabled && !busy) onClick();
      }}
    >
      {label}
    </Button>
  );
  if (!actions.length) return main;
  return (
    <CommandMenu
      label={menuLabel}
      actions={actions}
      {...(contextKey ? {contextKey} : {})}
      className={`dw-split ${size ? `dw-size-${size}` : ''}`}
      trigger={(trigger) => (
        <IconButton
          {...trigger}
          className="dw-split-arrow"
          label={menuLabel}
          icon="chevron-down"
          variant={variant}
          tone={tone}
          {...(size ? {size} : {})}
        />
      )}
    >
      {main}
    </CommandMenu>
  );
}
