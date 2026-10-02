import * as React from 'react';
import type { CheckboxRootState } from "./CheckboxRoot.js";
export type CheckboxRootContext = CheckboxRootState;
export declare const CheckboxRootContext: React.Context<CheckboxRootState | undefined>;
export declare function useCheckboxRootContext(): CheckboxRootState;