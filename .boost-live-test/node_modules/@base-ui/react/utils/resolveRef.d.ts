/**
 * If the provided argument is a ref object, returns its `current` value.
 * Otherwise, returns the argument itself.
 */
export declare function resolveRef<T extends HTMLElement | null | undefined>(maybeRef: T | React.RefObject<T>): T;