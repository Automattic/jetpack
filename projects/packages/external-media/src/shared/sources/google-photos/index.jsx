import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { getGooglePhotosPickerCachedSessionId } from '../../media-service';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosAuthUpgrade from './google-photos-auth-upgrade';
import GooglePhotosLoading from './google-photos-loading';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';
import './style.scss';

/**
 * GooglePhotos component
 *
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
function GooglePhotos( props ) {
	const {
		isAuthenticated,
		pickerSession,
		createPickerSession,
		fetchPickerSession,
		getPickerStatus,
		setAuthenticated,
	} = props;

	const [ cachedSessionId ] = useState( getGooglePhotosPickerCachedSessionId() );
	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const [ isCachedSessionChecked, setIsCachedSessionChecked ] = useState( false );
	const [ isAuthUpgradeRequired, setIsAuthUpgradeRequired ] = useState( false );
	const [ sessionRequest, setSessionRequest ] = useState( 'idle' ); // 'idle' | 'pending' | 'failed'

	const isLoadingState = pickerFeatureEnabled === null;
	const isPickerSessionAccurate = pickerSession !== null && ! ( 'code' in pickerSession );
	const isSessionExpired =
		pickerSession?.expireTime && moment( pickerSession.expireTime ).isBefore( new Date() );

	const requestPickerSession = useCallback( () => {
		setSessionRequest( 'pending' );
		createPickerSession().then( session => setSessionRequest( session ? 'idle' : 'failed' ) );
	}, [ createPickerSession ] );

	// A failed request shouldn't block the new session after a disconnect and reconnect.
	useEffect( () => {
		if ( ! isAuthenticated ) {
			setSessionRequest( 'idle' );
		}
	}, [ isAuthenticated ] );

	// Check if the picker feature is enabled and the connection status
	useEffect( () => {
		getPickerStatus().then( picker => {
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
	}, [ isAuthenticated, getPickerStatus, setAuthenticated ] );

	// Check if the user has a cached session
	useEffect( () => {
		if ( pickerFeatureEnabled && isAuthenticated && ! isAuthUpgradeRequired ) {
			Promise.resolve( cachedSessionId )
				.then( id => ( id ? fetchPickerSession( id ) : id ) )
				.finally( () => setIsCachedSessionChecked( true ) );
		}
	}, [
		isAuthenticated,
		pickerFeatureEnabled,
		isAuthUpgradeRequired,
		cachedSessionId,
		fetchPickerSession,
	] );

	// Create a new picker session if the cached session is not accurate
	// or if the session has expired
	useEffect( () => {
		if (
			pickerFeatureEnabled &&
			isCachedSessionChecked &&
			isAuthenticated &&
			! isAuthUpgradeRequired &&
			sessionRequest === 'idle' &&
			( ! isPickerSessionAccurate || isSessionExpired )
		) {
			requestPickerSession();
		}
	}, [
		pickerFeatureEnabled,
		sessionRequest,
		isAuthUpgradeRequired,
		isCachedSessionChecked,
		isPickerSessionAccurate,
		isAuthenticated,
		isSessionExpired,
		requestPickerSession,
		pickerSession,
	] );

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
				isSessionPending={ sessionRequest === 'pending' }
				isSessionFailed={ sessionRequest === 'failed' }
				onRetry={ requestPickerSession }
			/>
		);
	}

	return <GooglePhotosMedia pickerFeatureEnabled={ pickerFeatureEnabled } { ...props } />;
}

export default withMedia( MediaSource.GooglePhotos, { modalSize: 'fill' } )( GooglePhotos );
