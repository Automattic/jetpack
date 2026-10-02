/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {Node} node The HTML element.
 * @return {node is HTMLElement} True if the element is an text field, false if not.
 */
export default function isTextField(node: Node): node is HTMLElement;
//# sourceMappingURL=is-text-field.d.ts.map