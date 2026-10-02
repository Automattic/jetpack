type UseFocusOutsideReturn = {
    onFocus: React.FocusEventHandler;
    onMouseDown: React.MouseEventHandler;
    onMouseUp: React.MouseEventHandler;
    onTouchStart: React.TouchEventHandler;
    onTouchEnd: React.TouchEventHandler;
    onBlur: React.FocusEventHandler;
};
/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param onFocusOutside A callback triggered when focus moves outside
 *                       the element the event handlers are bound to.
 *
 * @return An object containing event handlers. Bind the event handlers to a
 * wrapping element element to capture when focus moves outside that element.
 */
export default function useFocusOutside(onFocusOutside: ((event: React.FocusEvent) => void) | undefined): UseFocusOutsideReturn;
export {};
//# sourceMappingURL=index.d.ts.map