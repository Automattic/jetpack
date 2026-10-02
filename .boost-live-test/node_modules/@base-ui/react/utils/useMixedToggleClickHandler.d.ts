/**
 * Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
 * For example, a button that opens a popup on mousedown and closes it on click.
 * This hook prevents the popup from closing immediately after the mouse button is released.
 */
export declare function useMixedToggleClickHandler(params: UseMixedToggleClickHandlerParameters): Readonly<{}>;
export interface UseMixedToggleClickHandlerParameters {
  /**
   * Whether the mixed toggle click handler is enabled.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Determines what action is performed on mousedown.
   */
  mouseDownAction: 'open' | 'close';
  /**
   * The current open state of the popup.
   */
  open: boolean;
}
export interface UseMixedToggleClickHandlerState {}