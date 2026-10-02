import { NOOP } from '@base-ui/utils/empty';
import type { FocusableElement } from "./tabbable.mjs";
interface Options {
  preventScroll?: boolean | undefined;
  sync?: boolean | undefined;
  shouldFocus?: (() => boolean) | undefined;
}
export declare function enqueueFocus(el: FocusableElement | null, options?: Options): typeof NOOP;
export {};