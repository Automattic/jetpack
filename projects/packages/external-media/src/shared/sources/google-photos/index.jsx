import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
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

	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const [ isCachedSessionChecked, setIsCachedSessionChecked ] = useState( false );
	const [ isAuthUpgradeRequired, setIsAuthUpgradeRequired ] = useState( false );
	const [ sessionRequest, setSessionRequest ] = useState( 'idle' ); // 'idle' | 'pending' | 'failed'
	const sessionRequestId = useRef( 0 );

	const isLoadingState = pickerFeatureEnabled === null;
	const isPickerSessionAccurate = pickerSession !== null && ! ( 'code' in pickerSession );
	const isSessionExpired =
		pickerSession?.expireTime && moment( pickerSession.expireTime ).isBefore( new Date() );

	const requestPickerSession = useCallback( () => {
		const requestId = ++sessionRequestId.current;
		setSessionRequest( 'pending' );
		return createPickerSession().then( session => {
			if ( requestId === sessionRequestId.current ) {
				setSessionRequest( session ? 'idle' : 'failed' );
			}
			return session;
		} );
	}, [ createPickerSession ] );

	// A failed request shouldn't block the new session after a disconnect and reconnect.
	useEffect( () => {
		if ( ! isAuthenticated ) {
			sessionRequestId.current++; // Drop the result of any request still in flight.
			setSessionRequest( 'idle' );
			setIsCachedSessionChecked( false );
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
		if ( ! pickerFeatureEnabled || ! isAuthenticated || isAuthUpgradeRequired ) {
			return;
		}

		// Read the cookie now: a disconnect since mount clears it.
		const cachedSessionId = getGooglePhotosPickerCachedSessionId();
		if ( ! cachedSessionId ) {
			setIsCachedSessionChecked( true );
			return;
		}

		let isCurrent = true;
		fetchPickerSession( cachedSessionId )
			.catch( () => null )
			.then( () => isCurrent && setIsCachedSessionChecked( true ) );

		return () => {
			isCurrent = false;
		};
	}, [ isAuthenticated, pickerFeatureEnabled, isAuthUpgradeRequired, fetchPickerSession ] );

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

	return (
		<GooglePhotosMedia
			pickerFeatureEnabled={ pickerFeatureEnabled }
			{ ...props }
			createPickerSession={ requestPickerSession }
		/>
	);
}

export default withMedia( MediaSource.GooglePhotos, { modalSize: 'fill' } )( GooglePhotos );
