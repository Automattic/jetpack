import * as React from 'react';
import type { ToastObject } from "../useToastManager.mjs";
export interface ToastRootContext {
  toast: ToastObject<any>;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  visibleIndex: number;
  expanded: boolean;
  recalculateHeight: (flushSync?: boolean) => void;
}
export declare const ToastRootContext: React.Context<ToastRootContext | undefined>;
export declare function useToastRootContext(): ToastRootContext;