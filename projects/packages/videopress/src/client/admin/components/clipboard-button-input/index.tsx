/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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

	return (
		<div className={ styles.wrapper }>
			<input
				value={ inputValue }
				onClick={ onClickInputHandler }
				defaultValue={ inputValue }
				readOnly
			/>
			<Button weight="regular" variant="secondary" size="small">
				{ __( 'Copy', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
};

export default VideoDetailsCard;
