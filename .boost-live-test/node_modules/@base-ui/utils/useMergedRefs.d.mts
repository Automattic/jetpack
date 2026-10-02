import * as React from 'react';
type Empty = null | undefined;
type InputRef<I> = React.Ref<I> | Empty;
type Result<I> = React.RefCallback<I> | null;
/**
 * Merges refs into a single memoized callback ref or `null`.
 * This makes sure multiple refs are updated together and have the same value.
 *
 * This function accepts up to four refs. If you need to merge more, or have an unspecified number of refs to merge,
 * use `useMergedRefsN` instead.
 */
export declare function useMergedRefs<I>(a: InputRef<I>, b: InputRef<I>): Result<I>;
export declare function useMergedRefs<I>(a: InputRef<I>, b: InputRef<I>, c: InputRef<I>): Result<I>;
export declare function useMergedRefs<I>(a: InputRef<I>, b: InputRef<I>, c: InputRef<I>, d: InputRef<I>): Result<I>;
/**
 * Merges an array of refs into a single memoized callback ref or `null`.
 *
 * If you need to merge a fixed number (up to four) of refs, use `useMergedRefs` instead for better performance.
 */
export declare function useMergedRefsN<I>(refs: InputRef<I>[]): Result<I>;
export {};