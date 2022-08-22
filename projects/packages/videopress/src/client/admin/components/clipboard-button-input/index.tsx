/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { useCopyToClipboard } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { ClipboardButtonInputProps } from './types';
import type React from 'react';

/**
 * ClipboardButtionInput component
 *
 * @param {ClipboardButtonInput} props - Component props.
 * @returns {React.ReactNode} - ClipboardButtonInput react component.
 */
const ClipboardButtonInput: React.FC< ClipboardButtonInputProps > = ( {
	text,
	value,
	onCopy,
	resetTime = 3000,
} ) => {
	const onClickInputHandler = ( event: React.MouseEvent< HTMLInputElement > ) => {
		event.currentTarget.select();
	};

	const [ hasCopied, setHasCopied ] = useState( false );

	const textToCopy = value || text;
	const ref = useCopyToClipboard( textToCopy, () => {
		const timer = setTimeout( () => {
			setHasCopied( false );
			clearTimeout( timer );
		}, resetTime );

		setHasCopied( true );
		onCopy?.();
	} );

	return (
		<div className={ styles.wrapper }>
			<input type="text" value={ text || value } onClick={ onClickInputHandler } readOnly />
			<Button weight="regular" variant="secondary" size="small" ref={ ref }>
				{ hasCopied
					? __( 'Copied', 'jetpack-videopress-pkg' )
					: __( 'Copy', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
};

export default ClipboardButtonInput;
