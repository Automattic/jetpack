import type React from 'react';

export type InputProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * The input value.
	 */
	value?: string;

	/**
	 * The input placeholder.
	 */
	placeholder?: string;

	/**
	 * Optional icon.
	 */
	icon?: React.ReactNode;

	/**
	 * Callback to be invoked when the input value changes.
	 */
	onChange: ( value: string ) => unknown;

	/**
	 * Callback to be invoked when the user presses the Enter key.
	 */
	onEnter: ( value: string ) => unknown;
};

export type SearchInputProps = Omit< InputProps, 'icon' >;
