/**
 * AiAssistantControls component.
 *
 * TODO: Needs to be implemented in the native version.
 *
 * @param {object} props - component props.
 * @param {string} [props.key] - Can be used to externally control the value of the control.
 * @param {string} [props.label] - The label to use for the dropdown.
 * @param {string[]} [props.exclude] - A list of quick edits to exclude from the dropdown.
 * @param {string} [props.requestingState] - Whether the dropdown is requesting suggestions from AI.
 * @param {boolean} [props.disabled] - Whether the dropdown is disabled.
 * @param {Function} [props.onChange] - Listen to change events.
 * @param {Function} [props.onReplace] - Listen to replace events.
 * @returns {import('react').ReactElement} - React component.
 */
export default function AiAssistantControls( {
	key,
	label,
	exclude = [],
	requestingState,
	disabled,
	onChange,
	onReplace,
} ) {
	return null;
}
