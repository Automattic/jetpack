import { lruMemoize } from 'reselect';
import type { CreateSelectorOptions, UnknownMemoizer, weakMapMemoize } from 'reselect';
import type { CreateSelectorMemoizedFunction } from "./createSelector.js";
/**
 * Creates a `createSelectorMemoized` variant with custom reselect options.
 *
 * Object-form `memoizeOptions` merge over the module defaults (`maxSize: 1`,
 * `equalityCheck: Object.is`); a bare equality function replaces them. Overriding
 * `memoize` drops the defaults entirely, since they describe `lruMemoize`.
 */
export declare const createSelectorMemoizedWithOptions: <OverrideMemoizeFunction extends UnknownMemoizer = never, OverrideArgsMemoizeFunction extends UnknownMemoizer = never>(options?: CreateSelectorOptions<typeof lruMemoize, typeof weakMapMemoize, OverrideMemoizeFunction, OverrideArgsMemoizeFunction>) => CreateSelectorMemoizedFunction;
/**
 * Creates a memoized selector that caches its most recent result per state object.
 *
 * The single-function form is keyed on the state's identity: every state replacement
 * re-runs the combiner and produces a new reference. Use separate input selectors (or a
 * `resultEqualityCheck` via `createSelectorMemoizedWithOptions`) when a stable result
 * reference is needed.
 *
 * The combiner can take up to three arguments beyond the input selector results, and
 * cannot have optional, default, or rest parameters, because the argument wiring relies
 * on `Function.length`.
 */
export declare const createSelectorMemoized: CreateSelectorMemoizedFunction;