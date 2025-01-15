import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import React, { useEffect } from 'react';
import mediaImage from '../../../../../images/media.svg';
import GooglePhotosAccount from './google-photos-account';

/**
 * GooglePhotosPickerButton component
 *
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX Element
 */
export default function GooglePhotosPickerButton( props ) {
	const { pickerSession, fetchPickerSession, setAuthenticated, account } = props;
	const isButtonBusy = ! pickerSession;

	const openPicker = () => {
		pickerSession?.pickerUri && window.open( pickerSession.pickerUri );
	};

	useEffect( () => {
		const interval = setInterval( () => {
			pickerSession?.id && fetchPickerSession( pickerSession.id );
		}, 3000 );
		return () => clearInterval( interval );
	}, [ fetchPickerSession, pickerSession?.id ] );

	return (
		<div className="jetpack-external-media__google-photos-picker">
			<img
				src={ mediaImage }
				width="150"
				alt={ __( 'Google Photos', 'jetpack-shared-extension-utils' ) }
			/>

			<h1>{ __( 'Google Photos', 'jetpack-shared-extension-utils' ) }</h1>
			<p>
				{ __(
					'Select photos directly from your Google Photos library.',
					'jetpack-shared-extension-utils'
				) }
			</p>

			<Button
				variant="primary"
				isBusy={ isButtonBusy }
				disabled={ isButtonBusy }
				className="jetpack-external-media__google-photos-picker-button"
				onClick={ openPicker } // eslint-disable-line react/jsx-no-bind
			>
				{ __( 'Open Google Photos Picker', 'jetpack-shared-extension-utils' ) }
				&nbsp;
				<Icon icon={ external } size={ 18 } />
			</Button>
			<GooglePhotosAccount
				account={ account }
				setAuthenticated={ setAuthenticated }
				disconnectBtnVariant={ 'link' }
				showAccountInfo={ false }
			/>
		</div>
	);
}
