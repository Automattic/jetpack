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
import { ClipboardButtonInput } from './types';
import type React from 'react';

/**
 * Video Details Card component
 *
 * @param {ClipboardButtonInput} props - Component props.
 * @returns {React.ReactNode} - VideoDetailsCard react component.
 */
const VideoDetailsCard: React.FC< ClipboardButtonInput > = ( { text, value } ) => {
	const inputValue = value || text;
	const onClickInputHandler = ( event: React.MouseEvent< HTMLInputElement > ) => {
		event.currentTarget.select();
	};

	const [ hasCopied, setHasCopied ] = useState( false );

	const ref = useCopyToClipboard( inputValue, () => {
		const timer = setTimeout( () => {
			setHasCopied( false );
			clearTimeout( timer );
		}, 3000 );

		setHasCopied( true );
	} );

	return (
		<div className={ styles.wrapper }>
			<input
				value={ inputValue }
				onClick={ onClickInputHandler }
				defaultValue={ inputValue }
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

export default VideoDetailsCard;
