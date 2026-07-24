declare module 'sortablejs' {
  export interface SortableOptions {
    animation?: number;
    handle?: string;
    onEnd?: () => void | Promise<void>;
  }

  export default class Sortable {
    static create(element: HTMLElement, options?: SortableOptions): Sortable;
  }
}
