/**
 * Check whether the given input field or textarea contains a (uncollapsed)
 * selection of text.
 *
 * CAVEAT: Only specific text-based HTML inputs support the selection APIs
 * needed to determine whether they have a collapsed or uncollapsed selection.
 * This function defaults to returning `true` when the selection cannot be
 * inspected, such as with `<input type="time">`. The rationale is that this
 * should cause the block editor to defer to the browser's native selection
 * handling (e.g. copying and pasting), thereby reducing friction for the user.
 *
 * See: https://html.spec.whatwg.org/multipage/input.html#do-not-apply
 *
 * @param {Element} element The HTML element.
 *
 * @return {boolean} Whether the input/textarea element has some "selection".
 */
export default function inputFieldHasUncollapsedSelection(element: Element): boolean;
//# sourceMappingURL=input-field-has-uncollapsed-selection.d.ts.map