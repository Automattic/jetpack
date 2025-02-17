import { TextProps } from '../text/types.js';

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

export type TermsOfServiceProps = Pick<
	TextProps,
	| 'variant'
	| 'm'
	| 'mt'
	| 'mr'
	| 'mb'
	| 'ml'
	| 'mx'
	| 'my'
	| 'p'
	| 'pt'
	| 'pr'
	| 'pb'
	| 'pl'
	| 'px'
	| 'py'
	| 'className'
	| 'component'
> &
	( MultipleButtonsProps | SingleButtonProps );
