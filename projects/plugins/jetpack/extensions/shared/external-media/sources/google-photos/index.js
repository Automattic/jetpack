import moment from 'moment';
import { useEffect, useState } from 'react';
import MediaLoadingPlaceholder from '../../media-browser/placeholder';
import { getGooglePhotosPickerCachedSessionId } from '../../media-service';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';

function GooglePhotos( props ) {
	const {
		isAuthenticated,
		pickerSession,
		createPickerSession,
		featchPickerSession,
		getPickerStatus,
	} = props;
	const [ cachedSessionId ] = useState( getGooglePhotosPickerCachedSessionId() );
	const [ isCashedSessionChecked, setIsCashedSessionChecked ] = useState( false );
	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const isPickerSessionAccurate = pickerSession !== null && ! ( 'code' in pickerSession );
	const isSessionExpired =
		pickerSession?.expireTime && moment( pickerSession.expireTime ).isBefore( new Date() );

	useEffect( () => {
		getPickerStatus().then( feature => {
			feature && setPickerFeatureEnabled( feature.enabled );
		} );
		cachedSessionId &&
			featchPickerSession( cachedSessionId ).then( () => setIsCashedSessionChecked( true ) );
	}, [ getPickerStatus, featchPickerSession, cachedSessionId ] );

	useEffect( () => {
		if (
			pickerFeatureEnabled &&
			isCashedSessionChecked &&
			isAuthenticated &&
			( ! isPickerSessionAccurate || isSessionExpired )
		) {
			createPickerSession();
		}
	}, [
		pickerFeatureEnabled,
		isCashedSessionChecked,
		isPickerSessionAccurate,
		isAuthenticated,
		isSessionExpired,
		createPickerSession,
		pickerSession,
	] );

	if ( pickerFeatureEnabled === null || ! isCashedSessionChecked ) {
		return <MediaLoadingPlaceholder />;
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
