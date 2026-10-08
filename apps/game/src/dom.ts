import { createActionButton } from '@aegis/browser/ui';

type Child = Node | string | null | undefined | false;
type Attrs = {
  [key: string]: string | number | boolean | null | undefined | Record<string, string>;
};

/** Minimal element builder: no framework, plain DOM. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = String(value);
      else if (key === 'dataset')
        Object.assign(node.dataset, value as unknown as Record<string, string>);
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

export function append(node: Element, ...children: Child[]): void {
  for (const child of children)
    if (child !== null && child !== undefined && child !== false) node.append(child);
}

export interface ButtonOptions {
  label: string;
  /** Visible content; defaults to the label text. */
  content?: Node | string;
  icon?: string;
  key?: string;
  class?: string;
  disabled?: boolean;
  pressed?: boolean;
  describedBy?: string;
  onError?: (error: unknown) => void;
}

let errorSink: (error: unknown) => void = () => {};
export function setErrorSink(sink: (error: unknown) => void): void {
  errorSink = sink;
}

/** Native button: activation via click only (pointer, Enter, Space), overlapping runs suppressed. */
export function button(
  options: ButtonOptions,
  command: () => void | Promise<unknown>,
): HTMLButtonElement {
  const node = createActionButton({
    document,
    label: options.label,
    command: async () => {
      await command();
    },
    onError: options.onError ?? errorSink,
  });
  node.replaceChildren();
  if (options.icon) node.append(h('span', { class: 'icon', 'aria-hidden': 'true' }, options.icon));
  const content = options.content ?? options.label;
  node.append(typeof content === 'string' ? h('span', { class: 'label' }, content) : content);
  node.setAttribute('aria-label', options.label);
  if (options.class) node.className = options.class;
  if (options.key) node.dataset.key = options.key;
  if (options.disabled) node.disabled = true;
  if (options.pressed !== undefined) node.setAttribute('aria-pressed', String(options.pressed));
  if (options.describedBy) node.setAttribute('aria-describedby', options.describedBy);
  return node;
}

/** Re-render helper that keeps keyboard focus on the element with the same data-key. */
export function replaceKeepingFocus(container: Element, ...nodes: Node[]): void {
  const active = document.activeElement;
  const key =
    active instanceof HTMLElement && container.contains(active) ? active.dataset.key : undefined;
  container.replaceChildren(...nodes);
  if (key) container.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus();
}

export function focusFirst(container: ParentNode, selector = '[data-primary]'): void {
  const target =
    container.querySelector<HTMLElement>(selector) ??
    container.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]');
  target?.focus({ preventScroll: true });
}
