import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BaseControl, Button, Spinner, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useRef } from 'react';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';

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

	const shareTitleOnly = useSelect( select => select( socialStore ).isShareTitleOnlyEnabled(), [] );
	const isUpdatingShareTitleOnly = useSelect(
		select => select( socialStore ).isUpdatingShareTitleOnly(),
		[]
	);

	const { updateShareTitleOnly } = useDispatch( socialStore );

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

	const handleShareTitleOnlyToggle = useCallback( () => {
		updateShareTitleOnly( false );
	}, [ updateShareTitleOnly ] );

	if ( shareTitleOnly ) {
		return (
			<BaseControl __nextHasNoMarginBottom={ true } label={ __( 'Message', 'jetpack' ) }>
				<Notice type={ 'highlight' }>
					{ __(
						'Custom message is disabled when you have title-only sharing enabled.',
						'jetpack'
					) }
					<br />
					{ isUpdatingShareTitleOnly ? (
						<Spinner />
					) : (
						<Button variant="link" onClick={ handleShareTitleOnlyToggle }>
							{ __( 'Turn off', 'jetpack' ) }
						</Button>
					) }
				</Notice>
			</BaseControl>
		);
	}

	return (
		<TextareaControl
			value={ message }
			label={ __( 'Message', 'jetpack' ) }
			onChange={ handleChange }
			disabled={ disabled }
			maxLength={ maxLength }
			placeholder={ __(
				'Write a custom message for your social audience here. This message will override your social post content.',
				'jetpack'
			) }
			rows={ 4 }
			help={ sprintf(
				/* translators: placeholder is a number. */
				_n( '%d character remaining', '%d characters remaining', charactersRemaining, 'jetpack' ),
				charactersRemaining
			) }
		/>
	);
}
