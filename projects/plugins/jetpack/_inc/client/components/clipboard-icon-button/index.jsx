import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, error } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import PropTypes from 'prop-types';

const FEEDBACK_TIMEOUT = 2000;

/**
 * Icon button that copies text and shows a check or error icon, announcing the result.
 *
 * @param {object} props       - Component props, the rest go to `IconButton`.
 * @param {string} props.text  - Text to copy.
 * @param {string} props.label - Accessible name and tooltip; it stays the same after copying.
 * @param {object} props.icon  - Icon shown before copying.
 * @return {object} Button element.
 */
export default function ClipboardIconButton( {
	text,
	label = __( 'Copy', 'jetpack' ),
	icon = copy,
	...buttonProps
} ) {
	// A fresh object per result restarts the timeout for repeated copies.
	const [ feedback, setFeedback ] = useState( { result: 'idle' } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout( () => setFeedback( { result: 'idle' } ), FEEDBACK_TIMEOUT );
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	const copyRef = useCopyToClipboard(
		text,
		() => {
			setFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard', 'jetpack' ) );
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( __( "Couldn't copy to clipboard.", 'jetpack' ) );
		}
	);

	const icons = { idle: icon, copied: check, error };

	return (
		<IconButton
			variant="minimal"
			tone="neutral"
			size="compact"
			{ ...buttonProps }
			ref={ copyRef }
			label={ label }
			icon={ icons[ feedback.result ] }
		/>
	);
}

ClipboardIconButton.propTypes = {
	text: PropTypes.string,
	label: PropTypes.string,
	icon: PropTypes.oneOfType( [ PropTypes.object, PropTypes.func, PropTypes.element ] ),
};
