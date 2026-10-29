import type { Text } from '@wordpress/ui';
import type { ComponentProps } from 'react';

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

export type TermsOfServiceProps = {
	/**
	 * HTML class.
	 */
	className?: string;

	/**
	 * The `@wordpress/ui` Text variant. Defaults to `body-lg`.
	 */
	variant?: ComponentProps< typeof Text >[ 'variant' ];
} & ( MultipleButtonsProps | SingleButtonProps | OnlyTextProps );
