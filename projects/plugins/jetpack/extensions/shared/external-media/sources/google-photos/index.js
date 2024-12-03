import moment from 'moment';
import { useEffect, useState, useCallback } from 'react';
import MediaLoadingPlaceholder from '../../media-browser/placeholder';
import { getGooglePhotosPickerCachedSessionId } from '../../media-service';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosAuthUpgrade from './google-photos-auth-upgrade';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';

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
	const [ isCachedSessionChecked, setIsCachedSessionChecked ] = useState( false );
	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const [ authUpgradeRequired, setAuthUpgradeRequired ] = useState( false );
	const isPickerSessionAccurate = pickerSession !== null && ! ( 'code' in pickerSession );
	const isSessionExpired =
		pickerSession?.expireTime && moment( pickerSession.expireTime ).isBefore( new Date() );

	const catchAuthErrors = useCallback(
		error => {
			if ( error.code === 'authorization_required' ) {
				setAuthenticated( false );
			}

			// Invalid JSON error means the user is not authenticated
			// transition between old and new auth flow
			if ( error.code === 'invalid_json' ) {
				setAuthUpgradeRequired( true );
			}
		},
		[ setAuthenticated, setAuthUpgradeRequired ]
	);

	useEffect( () => {
		! isAuthenticated && setAuthUpgradeRequired( false );
	}, [ isAuthenticated ] );

	useEffect( () => {
		getPickerStatus().then( feature => {
			feature && setPickerFeatureEnabled( feature.enabled );
		} );

		cachedSessionId === null && setIsCachedSessionChecked( true );
		cachedSessionId &&
			fetchPickerSession( cachedSessionId ).then( () => setIsCachedSessionChecked( true ) );
	}, [ getPickerStatus, fetchPickerSession, cachedSessionId ] );

	useEffect( () => {
		if (
			pickerFeatureEnabled &&
			isCachedSessionChecked &&
			isAuthenticated &&
			( ! isPickerSessionAccurate || isSessionExpired )
		) {
			createPickerSession().catch( catchAuthErrors );
		}
	}, [
		pickerFeatureEnabled,
		isCachedSessionChecked,
		isPickerSessionAccurate,
		isAuthenticated,
		isSessionExpired,
		createPickerSession,
		pickerSession,
		catchAuthErrors,
	] );

	if ( pickerFeatureEnabled === null || ! isCachedSessionChecked ) {
		return <MediaLoadingPlaceholder />;
	}

	if ( authUpgradeRequired ) {
		return <GooglePhotosAuthUpgrade { ...props } />;
	}

	if ( ! isAuthenticated ) {
		return <GooglePhotosAuth { ...props } />;
	}

	if ( pickerFeatureEnabled && ! pickerSession?.mediaItemsSet ) {
		return <GooglePhotosPickerButton { ...props } />;
	}

	return <GooglePhotosMedia pickerFeatureEnabled={ pickerFeatureEnabled } { ...props } />;
}

export default withMedia( MediaSource.GooglePhotos )( GooglePhotos );
