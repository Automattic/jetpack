export type ClipboardButtonInputProps = {
	/**
	 * The text to show in the input element.
	 * And, in case the value property is not defined,
	 * it represents the value be copied when clicking the copy button,
	 */
	text?: string;

	/*
	 * The value to be copied when clicking the copy button. Optional.
	 */
	value?: string;

	/**
	 * Callback to be invoked when the text is successfully copied.
	 */
	onCopy?: () => void;

	/**
	 * Timer in miliseconds to reset the copy button to its initial state.
	 */
	resetTime?: number;
};
