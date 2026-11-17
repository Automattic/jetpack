import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, error } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import type { ClipboardIconButtonProps } from './types.ts';
import type { FC } from 'react';

const FEEDBACK_TIMEOUT = 2000;

/**
 * An `IconButton` that copies text and shows a check or error icon for two seconds.
 *
 * The accessible name stays the same and `speak()` announces the outcome, following the
 * Gutenberg Copy to Clipboard pattern.
 *
 * @param props        - Component props. Props not listed in the type go to `IconButton`.
 * @param props.text
 * @param props.label
 * @param props.icon
 * @param props.onCopy
 * @return The button.
 */
export const ClipboardIconButton: FC< ClipboardIconButtonProps > = ( {
	text,
	label = __( 'Copy', 'jetpack-components' ),
	icon = copy,
	onCopy,
	...buttonProps
} ) => {
	// A fresh object per result restarts the timeout for repeated copies.
	const [ feedback, setFeedback ] = useState< { result: 'idle' | 'copied' | 'error' } >( {
		result: 'idle',
	} );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout( () => setFeedback( { result: 'idle' } ), FEEDBACK_TIMEOUT );
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >(
		text,
		() => {
			setFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard', 'jetpack-components' ) );
			onCopy?.();
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( __( "Couldn't copy to clipboard.", 'jetpack-components' ) );
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
};

export default ClipboardIconButton;
