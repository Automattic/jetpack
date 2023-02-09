type MultipleButtonsProps = {
	/**
	 * Indicates whether there are multiple buttons present that would imply agreement if clicked.
	 */
	multipleButtons: true;

	/**
	 * The text label of the button someone would click to agree to the terms.
	 */
	agreeButtonLabel?: undefined;
};

type SingleButtonProps = {
	/**
	 * Indicates whether there are multiple buttons present that would imply agreement if clicked.
	 */
	multipleButtons?: false;

	/**
	 * The text label of the button someone would click to agree to the terms.
	 */
	agreeButtonLabel: string;
};

export type TermsOfServiceProps = MultipleButtonsProps | SingleButtonProps;
