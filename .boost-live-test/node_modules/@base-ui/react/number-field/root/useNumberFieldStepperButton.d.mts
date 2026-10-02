import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import type { NumberFieldRootState } from "./NumberFieldRoot.mjs";
type StepperButtonProps = NativeButtonProps & BaseUIComponentProps<'button', NumberFieldRootState>;
/**
 * Shared implementation for the increment and decrement stepper buttons. They differ only in the
 * direction they step and the boundary (`max` vs `min`) at which they become disabled.
 */
export declare function useNumberFieldStepperButton(componentProps: StepperButtonProps, forwardedRef: React.ForwardedRef<HTMLButtonElement>, isIncrement: boolean): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
export {};