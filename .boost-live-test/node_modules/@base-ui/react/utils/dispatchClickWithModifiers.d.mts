interface ModifierState {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}
/**
 * Dispatches a constructed click on the target so it carries the source event's
 * modifier state, which `click()` always reports as unpressed. Like `click()`,
 * the untrusted click still runs native activation behavior (form submission,
 * link navigation).
 * `detail` defaults to 0 (the native convention for keyboard-generated clicks);
 * pass `detail: 1` when the click represents a mouse gesture so consumers keying
 * off `detail === 0` don't classify it as a keyboard activation.
 */
export declare function dispatchClickWithModifiers(target: Element, sourceEvent: ModifierState, {
  detail
}?: {
  detail?: number | undefined;
}): void;
export {};