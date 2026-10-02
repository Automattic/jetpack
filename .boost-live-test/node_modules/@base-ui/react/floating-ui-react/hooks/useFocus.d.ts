import type { ElementProps, FloatingContext, FloatingRootContext } from "../types.js";
export interface UseFocusProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Waits for the specified time before opening.
   * @default undefined
   */
  delay?: number | (() => number | undefined) | undefined;
}
/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export declare function useFocus(context: FloatingRootContext | FloatingContext, props?: UseFocusProps): ElementProps;