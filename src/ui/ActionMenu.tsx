import {useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import {Button, type ButtonTone, type ButtonVariant} from './Controls';
import type {IconName} from './Icon';
export interface MenuAction {
  label: string;
  onSelect(): void;
  disabled?: boolean;
  icon?: IconName;
  variant?: ButtonVariant;
  tone?: ButtonTone;
}
export function ActionMenu({
  label = 'Weitere Aktionen',
  actions,
}: {
  label?: string;
  actions: MenuAction[];
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
    Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  const close = (restore: boolean) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const anchor = trigger.current;
    const panel = menu.current;
    const doc = anchor?.ownerDocument;
    const win = doc?.defaultView;
    if (!anchor || !panel || !doc || !win) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const width = panel.getBoundingClientRect().width;
      const naturalHeight = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
      const viewportHeight = Math.max(0, win.innerHeight - 16);
      const below = Math.max(0, Math.min(viewportHeight, win.innerHeight - rect.bottom - 16));
      const above = Math.max(0, Math.min(viewportHeight, rect.top - 16));
      const placement = naturalHeight <= below || below >= above ? 'bottom' : 'top';
      const maxHeight = placement === 'bottom' ? below : above;
      const height = Math.min(naturalHeight, maxHeight);
      const left = Math.max(8, Math.min(rect.right - width, win.innerWidth - width - 8));
      const preferredTop = placement === 'bottom' ? rect.bottom + 8 : rect.top - height - 8;
      const top = Math.max(8, Math.min(preferredTop, win.innerHeight - height - 8));
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
      if (frame !== null) return;
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
    const buttons = items();
    (last.current ? buttons.at(-1) : buttons[0])?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !host.current?.contains(event.target)) setOpen(false);
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
      className="dw-menu"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        icon="three-dots"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          last.current = false;
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            last.current = e.key === 'ArrowUp';
            setOpen(true);
          }
        }}
      >
        {label}
      </Button>
      {open && (
        <div
          id={id}
          ref={menu}
          role="menu"
          aria-label={label}
          className="dw-menu-panel"
          data-placement={position?.placement}
          style={menuStyle}
          onKeyDown={(e) => {
            const buttons = items(),
              current = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              close(true);
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
              e.preventDefault();
              const index =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? buttons.length - 1
                    : (current + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) %
                      buttons.length;
              buttons[index]?.focus();
            }
          }}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              role="menuitem"
              tabIndex={-1}
              disabled={action.disabled}
              icon={action.icon}
              variant={action.variant ?? 'tertiary'}
              tone={action.tone ?? 'default'}
              onClick={() => {
                close(true);
                action.onSelect();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
