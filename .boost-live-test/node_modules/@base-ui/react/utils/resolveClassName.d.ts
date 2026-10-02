/**
 * If the provided className is a string, it will be returned as is.
 * Otherwise, the function will call the className function with the state as the first argument.
 *
 * @param className
 * @param state
 */
export declare function resolveClassName<State>(className: string | ((state: State) => string | undefined) | undefined, state: State): string | undefined;