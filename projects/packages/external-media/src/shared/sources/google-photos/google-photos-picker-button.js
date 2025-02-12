import { GooglePhotosMediaIcon } from '@automattic/jetpack-shared-extension-utils/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import clsx from 'clsx';
import React, { useEffect } from 'react';
import GooglePhotosAccount from './google-photos-account';

/**
 * GooglePhotosPickerButton component
 *
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX Element
 */
export default function GooglePhotosPickerButton( props ) {
	const { className, pickerSession, fetchPickerSession, setAuthenticated, account } = props;
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
		<div className={ clsx( className, 'jetpack-external-media__google-photos-picker' ) }>
			<GooglePhotosMediaIcon width="150" />
			<h1>{ __( 'Google Photos', 'jetpack-external-media' ) }</h1>
			<p>
				{ __(
					'Select photos directly from your Google Photos library.',
					'jetpack-external-media'
				) }
			</p>

			<Button
				variant="primary"
				isBusy={ isButtonBusy }
				disabled={ isButtonBusy }
				className="jetpack-external-media__google-photos-picker-button"
				onClick={ openPicker }
			>
				{ __( 'Open Google Photos Picker', 'jetpack-external-media' ) }
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
