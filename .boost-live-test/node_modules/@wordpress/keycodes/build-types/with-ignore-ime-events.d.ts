/**
 * A higher-order function that wraps a keyboard event handler to ensure it is not an IME event.
 *
 * In CJK languages, an IME (Input Method Editor) is used to input complex characters.
 * During an IME composition, keyboard events (e.g. Enter or Escape) can be fired
 * which are intended to control the IME and not the application.
 * These events should be ignored by any application logic.
 *
 * @param handler The keyboard event handler to execute after ensuring it was not an IME event.
 *
 * @return A wrapped version of the given event handler that ignores IME events.
 */
export declare function withIgnoreIMEEvents<E extends React.KeyboardEvent | KeyboardEvent>(handler: (event: E) => void): (event: E) => void;
//# sourceMappingURL=with-ignore-ime-events.d.ts.map