import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useRef } from 'react';

/**
 * Wrapper around a textbox to restrict the number of characters and
 * display how many are remaining.
 *
 * @param {object}   props               - The component's props.
 * @param {string}   props.message       - The message to display.
 * @param {Function} props.onChange      - Callback to invoke as the message changes.
 * @param {boolean}  [props.disabled]    - Whether the control is disabled.
 * @param {number}   props.maxLength     - The maximum character length of the message.
 * @param {object}   props.analyticsData - Data for tracking analytics.
 * @return {object} The message box component.
 */
export default function MessageBoxControl( {
	message = '',
	onChange,
	disabled,
	maxLength,
	analyticsData = null,
} ) {
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
			label={ __( 'Message', 'jetpack-publicize-components' ) }
			onChange={ handleChange }
			disabled={ disabled }
			maxLength={ maxLength }
			placeholder={ __(
				'Write a custom message for your social audience here. This message will override your social post content.',
				'jetpack-publicize-components'
			) }
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
