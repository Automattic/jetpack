import * as React from 'react';
import type { BaseUIEvent, WithBaseUIEvent } from "../internals/types.js";
type ElementType = React.ElementType;
type PropsOf<T extends React.ElementType> = WithBaseUIEvent<React.ComponentPropsWithRef<T>>;
type InputProps<T extends React.ElementType> = PropsOf<T> | ((otherProps: PropsOf<T>) => PropsOf<T>) | undefined;
/**
 * Merges multiple sets of React props. It follows the Object.assign pattern where the rightmost object's fields overwrite
 * the conflicting ones from others. This doesn't apply to event handlers, `className` and `style` props.
 *
 * Event handlers are merged and called in right-to-left order (rightmost handler executes first, leftmost last).
 * For React synthetic events, the rightmost handler can prevent prior (left-positioned) handlers from executing
 * by calling `event.preventBaseUIHandler()`. For non-synthetic events (custom events with primitive/object values),
 * all handlers always execute without prevention capability.
 *
 * The `className` prop is merged by concatenating classes in right-to-left order (rightmost class appears first in the string).
 * The `style` prop is merged with rightmost styles overwriting the prior ones.
 *
 * Props can either be provided as objects or as functions that take the previous props as an argument.
 * The function will receive the merged props up to that point (going from left to right):
 * so in the case of `(obj1, obj2, fn, obj3)`, `fn` will receive the merged props of `obj1` and `obj2`.
 * The function is responsible for chaining event handlers if needed (that is, we don't run the merge logic).
 *
 * Event handlers returned by the functions are not automatically prevented when `preventBaseUIHandler` is called.
 * They must check `event.baseUIHandlerPrevented` themselves and bail out if it's true.
 *
 * @important **`ref` is not merged.**
 * @param a Props object to merge.
 * @param b Props object to merge. The function will overwrite conflicting props from `a`.
 * @param c Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @param d Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @param e Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @returns The merged props.
 * @public
 */
export declare function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>, c: InputProps<T>, d: InputProps<T>, e: InputProps<T>): PropsOf<T>;
export declare function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>, c: InputProps<T>, d: InputProps<T>): PropsOf<T>;
export declare function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>, c: InputProps<T>): PropsOf<T>;
export declare function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>): PropsOf<T>;
/**
 * Merges an arbitrary number of React props using the same logic as {@link mergeProps}.
 * This function accepts an array of props instead of individual arguments.
 *
 * This has slightly lower performance than {@link mergeProps} due to accepting an array
 * instead of a fixed number of arguments. Prefer {@link mergeProps} when merging 5 or
 * fewer prop sets for better performance.
 *
 * @param props Array of props to merge.
 * @returns The merged props.
 * @see mergeProps
 * @public
 */
export declare function mergePropsN<T extends ElementType>(props: InputProps<T>[]): PropsOf<T>;
export declare function makeEventPreventable<T extends React.SyntheticEvent>(event: BaseUIEvent<T>): BaseUIEvent<T>;
export declare function mergeClassNames(ourClassName: string | undefined, theirClassName: string | undefined): string | undefined;
export {};