export type ClipboardButtonInput = {
	/**
	 * The text to show in the input element.
	 * And the value be copied when clicking the copy button,
	 * in case the value property is not defined
	 */
	text: string;

	/*
	 * The value to be copied when clicking the copy button. Optional.
	 */
	value?: string;
	/**
	 * Callback to be invoked when the video is changed.
	 */
	onCopy: ( arg0: string ) => void;
};
