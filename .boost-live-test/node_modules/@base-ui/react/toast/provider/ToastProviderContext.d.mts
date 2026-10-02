import * as React from 'react';
import { ToastStore } from "../store.mjs";
export type ToastContext = ToastStore;
export declare const ToastContext: React.Context<ToastStore | undefined>;
export declare function useToastProviderContext(): ToastStore;