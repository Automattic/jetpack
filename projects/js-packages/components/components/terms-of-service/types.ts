import { TextProps } from '../text/types.ts';

type MultipleButtonsProps = {
	/**
	 * Indicates whether there are multiple buttons present that would imply agreement if clicked.
	 */
	multipleButtons: true;

	/**
	 * The text label of the button someone would click to agree to the terms.
	 */
	agreeButtonLabel?: undefined;

	isTextOnly?: false;
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

	isTextOnly?: false;
};

type OnlyTextProps = {
	/**
	 * If true, displays a simpler version of the terms without button references
	 */
	isTextOnly: true;
	multipleButtons?: undefined;
	agreeButtonLabel?: undefined;
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
	( MultipleButtonsProps | SingleButtonProps | OnlyTextProps );
