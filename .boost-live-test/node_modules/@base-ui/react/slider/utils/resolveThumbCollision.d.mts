import { SliderRootContext } from "../root/SliderRootContext.mjs";
export interface ResolveThumbCollisionResult {
  value: number | number[];
  thumbIndex: number;
  didSwap: boolean;
}
/**
 * Positional arguments are deliberate: property names of an options object don't
 * minify, so passing them positionally keeps this internal helper smaller in the bundle.
 */
export declare function resolveThumbCollision(behavior: SliderRootContext['thumbCollisionBehavior'], values: readonly number[], currentValues: readonly number[] | null | undefined, initialValues: readonly number[] | null | undefined, pressedIndex: number, nextValue: number, min: number, max: number, step: number, minStepsBetweenValues: number): ResolveThumbCollisionResult;