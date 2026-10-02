import * as React from 'react';
import type { RadioRootState } from "./RadioRoot.js";
export type RadioRootContext = RadioRootState;
export declare const RadioRootContext: React.Context<RadioRootState | undefined>;
export declare function useRadioRootContext(): RadioRootState;