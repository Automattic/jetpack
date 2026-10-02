import { ReactStore } from '@base-ui/utils/store';
import { ToastManagerAddOptions, ToastManagerPromiseOptions, ToastManagerUpdateOptions, ToastObject } from "./useToastManager.mjs";
type ToastInternalUpdateOptions<Data extends object> = Partial<Omit<ToastObject<Data>, 'id' | 'updateKey'>>;
/**
 * A toast once it lives in the store. `addToast` is the only way in and it always
 * assigns `updateKey`, so unlike the public `ToastObject` it is never missing.
 */
export type StoredToast<Data extends object = any> = ToastObject<Data> & {
  updateKey: number;
};
export type State = {
  toasts: StoredToast[];
  toastMetadata: Map<string, ToastMetadata>;
  hovering: boolean;
  focused: boolean;
  timeout: number;
  limit: number;
  isWindowFocused: boolean;
  viewport: HTMLElement | null;
  prevFocusElement: HTMLElement | null;
};
type ToastMetadata = {
  value: StoredToast;
  domIndex: number;
  visibleIndex: number;
  offsetY: number;
};
type InitialState = Omit<State, 'toastMetadata'>;
export declare const selectors: {
  toasts: (state: State) => StoredToast<any>[];
  isEmpty: (state: State) => boolean;
  toast: (state: State, id: string) => StoredToast<any> | undefined;
  toastIndex: (state: State, id: string) => number;
  toastOffsetY: (state: State, id: string) => number;
  toastVisibleIndex: (state: State, id: string) => number;
  focused: (state: State) => boolean;
  expanded: (state: State) => boolean;
  expandedOrOutOfFocus: (state: State) => boolean;
  prevFocusElement: (state: State) => HTMLElement | null;
};
export declare class ToastStore extends ReactStore<State, {}, typeof selectors> {
  private timers;
  private areTimersPaused;
  constructor(initialState: InitialState);
  setViewport: (viewport: HTMLElement | null) => void;
  syncProviderProps(timeout: number, limit: number): void;
  disposeEffect: () => () => void;
  removeToast(toastId: string, skipOnRemove?: boolean): void;
  addToast: <Data extends object>(toast: ToastManagerAddOptions<Data>) => string;
  updateToast: <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data> | ((prevToast: ToastObject<Data>) => ToastManagerUpdateOptions<Data>)) => void;
  updateToastInternal: <Data extends object>(id: string, updates: ToastInternalUpdateOptions<Data>, resetTimer?: boolean, markUpdated?: boolean) => void;
  closeToast: (toastId?: string) => void;
  promiseToast: <Value, Data extends object>(promiseValue: Promise<Value>, options: ToastManagerPromiseOptions<Value, Data>) => Promise<Value>;
  pauseTimers(): void;
  resumeTimers(): void;
  restoreFocusToPrevElement(): void;
  handleDocumentPointerDown: (event: PointerEvent) => void;
  private scheduleTimer;
  private clearTimers;
  private clearTimer;
  private handleTimerFired;
  private resetPausedStateIfNoTimersRemain;
  private setToasts;
  private handleFocusManagement;
}
export {};