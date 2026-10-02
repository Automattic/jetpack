import type * as React from 'react';
import type { ComboboxStore } from "../store.js";
export declare function handleInputPress(event: React.MouseEvent<HTMLElement> & {
  baseUIHandlerPrevented?: boolean | undefined;
}, store: ComboboxStore, disabled: boolean, shouldIgnoreTarget?: ((target: Element | null) => boolean) | undefined): void;