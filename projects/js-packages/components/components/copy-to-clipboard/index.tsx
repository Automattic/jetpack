import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Button from '../button';
import { ClipboardIcon, CheckmarkIcon } from '../icons';
import { CopyToClipboardProps } from './types';
import type React from 'react';

export const CopyToClipboard: React.FC< CopyToClipboardProps > = ( {
	buttonStyle = 'icon',
	textToCopy,
	onCopy,
	...buttonProps
} ) => {
	const [ hasCopied, setHasCopied ] = useState( false );

	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >();

	const copyRef = useCopyToClipboard( textToCopy, () => {
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}

		setHasCopied( true );

		onCopy?.();

		copyTimer.current = setTimeout( () => {
			setHasCopied( false );
			copyTimer.current = undefined;
		}, 3000 );
	} );

	useEffect( () => {
		// Clear copyTimer on component unmount.
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );

	let icon: React.ReactNode = null;
	let label: React.ReactNode = null;

	if ( 'text' !== buttonStyle ) {
		icon = hasCopied ? <CheckmarkIcon /> : <ClipboardIcon />;
	}

	const defaultLabel = __( 'Copy to clipboard', 'jetpack' );

	if ( 'icon' !== buttonStyle ) {
		label = hasCopied ? __( 'Copied!', 'jetpack' ) : defaultLabel;
	}

	return (
		<Button
			aria-label={ defaultLabel }
			icon={ icon }
			children={ label }
			ref={ copyRef }
			{ ...buttonProps }
		/>
	);
};

export default CopyToClipboard;
