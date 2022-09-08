import type React from 'react';

type InputBaseProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Input size.
	 */
	size?: 'small' | 'large';

	/**
	 * Input label.
	 */
	label?: React.ReactNode;

	/**
	 * Callback to be invoked when the input value changes.
	 */
	onChange: ( value: string ) => unknown;

	/**
	 * Callback to be invoked when the user presses the Enter key.
	 */
	onEnter: ( value: string ) => unknown;
};

type Input = Omit< React.InputHTMLAttributes< HTMLInputElement >, 'size' > & {
	/**
	 * Optional icon.
	 */
	icon?: React.ReactNode;
	/**
	 * Input types.
	 */
	type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
} & InputBaseProps;

type TextArea = React.TextareaHTMLAttributes< HTMLTextAreaElement > & {
	/**
	 * No support for icon when using textarea.
	 */
	icon?: undefined;
	/**
	 * Only use these types if is textarea.
	 */
	type: 'textarea';
} & InputBaseProps;

export type InputProps = Input | TextArea;

export type SearchInputProps = InputBaseProps & Omit< Input, 'icon' | 'type' >;
