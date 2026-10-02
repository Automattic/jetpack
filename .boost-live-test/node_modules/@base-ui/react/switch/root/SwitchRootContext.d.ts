import * as React from 'react';
import type { SwitchRootState } from "./SwitchRoot.js";
export type SwitchRootContext = SwitchRootState;
export declare const SwitchRootContext: React.Context<SwitchRootState | undefined>;
export declare function useSwitchRootContext(): SwitchRootState;