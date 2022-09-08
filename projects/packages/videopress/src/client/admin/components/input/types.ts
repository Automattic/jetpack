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
	 * Fixed as textarea to enforce TS use related props.
	 */
	type: 'textarea';
} & InputBaseProps;

export type InputProps = Input | TextArea;

export type SearchInputProps = InputBaseProps &
	Omit< Input, 'icon' | 'type' > & {
		/**
		 * Callback to be invoked when the seacrhing
		 */
		onSearch: ( value: string ) => unknown;

		/**
		 * The debounce time in milliseconds to wait
		 * before to invoke the `onSearch` callback.
		 *
		 * @default 500
		 */
		wait?: number;
	};
