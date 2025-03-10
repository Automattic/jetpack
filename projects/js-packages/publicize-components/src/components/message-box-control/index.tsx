import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useRef } from 'react';

export const getPlaceholderText = () =>
	__(
		'Write a custom message for your social audience here. This message will override your social post content.',
		'jetpack-publicize-components'
	);

export const getDefaultLabel = () => __( 'Message', 'jetpack-publicize-components' );

export type MessageBoxControlProps = {
	/** The label for the message box */
	label: string;

	/** The placeholder text for the message box */
	placeholder?: string;

	/** The message to display */
	message: string;

	/** Callback to invoke as the message changes */
	onChange: ( message: string ) => void;

	/** Whether the control is disabled */
	disabled?: boolean;

	/** The maximum character length of the message */
	maxLength: number;

	/** Data for tracking analytics */
	analyticsData?: {
		/** The location of the analytics event */
		location: string;
	};
};

/**
 * Wrapper around a textbox to restrict the number of characters and
 * display how many are remaining.
 *
 * @param {MessageBoxControlProps} props - The component's props.
 * @return {object} The message box component.
 */
export default function MessageBoxControl( {
	label = getDefaultLabel(),
	placeholder = getPlaceholderText(),
	message = '',
	onChange,
	disabled,
	maxLength,
	analyticsData = null,
}: MessageBoxControlProps ) {
	const { recordEvent } = useAnalytics();
	const isFirstChange = useRef( true );

	const charactersRemaining = maxLength - message.length;

	const handleChange = useCallback(
		newMessage => {
			onChange( newMessage );
			if ( isFirstChange.current ) {
				recordEvent( 'jetpack_social_custom_message_changed', analyticsData );
				isFirstChange.current = false;
			}
		},
		[ analyticsData, isFirstChange, onChange, recordEvent ]
	);

	return (
		<TextareaControl
			value={ message }
			label={ label }
			onChange={ handleChange }
			disabled={ disabled }
			maxLength={ maxLength }
			placeholder={ placeholder }
			rows={ 4 }
			help={ sprintf(
				/* translators: placeholder is a number. */
				_n(
					'%d character remaining',
					'%d characters remaining',
					charactersRemaining,
					'jetpack-publicize-components'
				),
				charactersRemaining
			) }
			__nextHasNoMarginBottom={ true }
		/>
	);
}
