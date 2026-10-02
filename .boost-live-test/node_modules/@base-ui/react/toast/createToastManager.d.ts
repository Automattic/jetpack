import type { ToastObject, ToastManagerAddOptions, ToastManagerPromiseOptions, ToastManagerUpdateOptions } from "./useToastManager.js";
/**
 * Creates a new toast manager.
 */
export declare function createToastManager<Data extends object = any>(): ToastManager<Data>;
export interface ToastManager<Data extends object = any> {
  ' subscribe': (listener: (data: ToastManagerEvent) => void) => () => void;
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  close: (id?: string) => void;
  update: <T extends Data = Data>(id: string, updates: ToastManagerUpdateOptions<T> | ((prevToast: ToastObject<T>) => ToastManagerUpdateOptions<T>)) => void;
  promise: <Value, T extends Data = Data>(promiseValue: Promise<Value>, options: ToastManagerPromiseOptions<Value, T>) => Promise<Value>;
}
export interface ToastManagerEvent {
  action: 'add' | 'close' | 'update' | 'promise';
  options: any;
}