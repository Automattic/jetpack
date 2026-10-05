import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosAuthUpgrade from './google-photos-auth-upgrade';
import GooglePhotosLoading from './google-photos-loading';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';
import useGooglePhotosPickerSession from './use-google-photos-picker-session';
import './style.scss';

/**
 * GooglePhotos component
 *
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
function GooglePhotos( props ) {
	const { isAuthenticated, setAuthenticated, noticeOperations } = props;

	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const [ isAuthUpgradeRequired, setIsAuthUpgradeRequired ] = useState( false );

	const isLoadingState = pickerFeatureEnabled === null;

	const {
		pickerSession,
		isSessionPending,
		isSessionFailed,
		requestPickerSession,
		deletePickerSession,
	} = useGooglePhotosPickerSession( {
		isAuthenticated,
		isReady: !! pickerFeatureEnabled && isAuthenticated && ! isAuthUpgradeRequired,
		noticeOperations,
	} );

	// Check if the picker feature is enabled and the connection status
	useEffect( () => {
		apiFetch( {
			path: '/wpcom/v2/external-media/connection/google_photos/picker_status',
		} ).then( picker => {
			setPickerFeatureEnabled( picker.enabled );

			switch ( picker.connection_status ) {
				case 'ok':
					setAuthenticated( true );
					setIsAuthUpgradeRequired( false );
					break;

				case 'invalid':
					setAuthenticated( true );
					setIsAuthUpgradeRequired( true );
					break;

				case 'not_connected':
					setAuthenticated( false );
					setIsAuthUpgradeRequired( false );
					break;
			}
		} );
	}, [ isAuthenticated, setAuthenticated ] );

	if ( isLoadingState ) {
		return <GooglePhotosLoading { ...props } />;
	}

	if ( ! isAuthenticated ) {
		return <GooglePhotosAuth { ...props } />;
	}

	if ( isAuthUpgradeRequired ) {
		return <GooglePhotosAuthUpgrade { ...props } />;
	}

	if ( pickerFeatureEnabled && ! pickerSession?.mediaItemsSet ) {
		return (
			<GooglePhotosPickerButton
				{ ...props }
				pickerSession={ pickerSession }
				isSessionPending={ isSessionPending }
				isSessionFailed={ isSessionFailed }
				onRetry={ requestPickerSession }
			/>
		);
	}

	return (
		<GooglePhotosMedia
			pickerFeatureEnabled={ pickerFeatureEnabled }
			{ ...props }
			pickerSession={ pickerSession }
			createPickerSession={ requestPickerSession }
			deletePickerSession={ deletePickerSession }
		/>
	);
}

export default withMedia( MediaSource.GooglePhotos, { modalSize: 'fill' } )( GooglePhotos );
