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
	isCopiedTimeout = 3000,
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
		}, isCopiedTimeout );

		setHasCopied( true );
		onCopy?.();
	} );

	return (
		<div className={ styles.wrapper }>
			<input
				value={ text || value }
				onClick={ onClickInputHandler }
				defaultValue={ text || value }
				readOnly
			/>
			<span className={ styles[ 'button-wrapper' ] } ref={ ref }>
				<Button weight="regular" variant="secondary" size="small">
					{ hasCopied
						? __( 'Copied', 'jetpack-videopress-pkg' )
						: __( 'Copy', 'jetpack-videopress-pkg' ) }
				</Button>
			</span>
		</div>
	);
};

export default ClipboardButtonInput;
