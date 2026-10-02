import type { RefObject } from 'react';
/**
 * Copies the text to the clipboard when the element is clicked.
 *
 * @deprecated
 * @param ref      Reference with the element.
 * @param text    The text to copy.
 * @param timeout Optional timeout to reset the returned
 *                state. 4 seconds by default.
 * @return   Whether or not the text has been copied. Resets after the
 *           timeout.
 */
export default function useCopyOnClick(ref: RefObject<string | Element | NodeListOf<Element>>, text: string | (() => string), timeout?: number): boolean;
//# sourceMappingURL=index.d.ts.map