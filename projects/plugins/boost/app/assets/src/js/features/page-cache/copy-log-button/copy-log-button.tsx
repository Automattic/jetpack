import { Button } from '@wordpress/components';
import { check, copy } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

type CopyLogButtonProps = {
	text?: string;
	className?: string;
	variant?: ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Copies the log to the clipboard and reads "Copied!" for three seconds.
 *
 * @param props           - Component props.
 * @param props.text      - What to copy; nothing yet while the log is loading.
 * @param props.className - Class for the button.
 * @param props.variant   - Button variant.
 */
const CopyLogButton = ( { text = '', className, variant = 'link' }: CopyLogButtonProps ) => {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >();

	useEffect( () => {
		// Clear the "Copied!" reset timer on unmount.
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );

	const handleCopy = () => {
		navigator.clipboard.writeText( text );
		setHasCopied( true );
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		copyTimer.current = setTimeout( () => setHasCopied( false ), 3000 );
	};

	// Kept as a variable (and reused as the aria-label) so the minifier can't
	// collapse the two `__()` calls into `__( cond ? a : b, … )`, which breaks
	// the i18n string extraction in production builds.
	const copyLabel = __( 'Copy to clipboard', 'jetpack-boost' );

	return (
		<Button
			variant={ variant }
			className={ className }
			icon={ hasCopied ? check : copy }
			onClick={ handleCopy }
			aria-label={ copyLabel }
		>
			{ hasCopied ? __( 'Copied!', 'jetpack-boost' ) : copyLabel }
		</Button>
	);
};

export default CopyLogButton;
