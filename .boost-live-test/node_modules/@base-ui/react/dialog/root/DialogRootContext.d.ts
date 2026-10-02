import * as React from 'react';
import { DialogStore } from "../store/DialogStore.js";
export declare const DialogRootContext: React.Context<DialogStore<unknown> | undefined>;
export declare function useDialogRootContext(optional?: false): DialogStore<unknown>;
export declare function useDialogRootContext(optional: true): DialogStore<unknown> | undefined;