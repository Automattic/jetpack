import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';

/**
 * Wrapper around a textbox to restrict the number of characters and
 * display how many are remaining.
 *
 * @param {object}   props           - The component's props.
 * @param {string}   props.message   - The message to display.
 * @param {Function} props.onChange  - Callback to invoke as the message changes.
 * @param {boolean}  [props.disabled]  - Whether the control is disabled.
 * @param {number}   props.maxLength - The maximum character length of the message.
 * @param {object}   props.analyticsData - Data for tracking analytics.
 * @returns {object} The message box component.
 */
export default function MessageBoxControl( {
	message = '',
	onChange,
	disabled,
	maxLength,
	analyticsData = null,
} ) {
	const { recordEvent } = useAnalytics();
	const [ isFirstChange, setIsFirstChange ] = useState( true );

	const charactersRemaining = maxLength - message.length;

	const handleChange = useCallback(
		newMessage => {
			if ( isFirstChange ) {
				recordEvent( 'jetpack_social_custom_message_changed', analyticsData );
				setIsFirstChange( false );
			}
			onChange( newMessage );
		},
		[ analyticsData, isFirstChange, onChange, recordEvent ]
	);

	return (
		<TextareaControl
			value={ message }
			label={ __( 'Message', 'jetpack' ) }
			onChange={ handleChange }
			disabled={ disabled }
			maxLength={ maxLength }
			placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
			rows={ 4 }
			help={ sprintf(
				/* translators: placeholder is a number. */
				_n( '%d character remaining', '%d characters remaining', charactersRemaining, 'jetpack' ),
				charactersRemaining
			) }
		/>
	);
}
