import { useEffect, useState } from 'react';
import MediaLoadingPlaceholder from '../../media-browser/placeholder';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';

function GooglePhotos( props ) {
	const { isAuthenticated, pickerSession, createPickerSession, getPickerStatus } = props;
	const [ pickerFeatureEnabled, setPickerFeatureEnabled ] = useState( null );
	const isPickerSessionAccurate = pickerSession !== null && ! ( 'code' in pickerSession );

	useEffect( () => {
		getPickerStatus().then( feature => {
			feature && setPickerFeatureEnabled( feature.enabled );
		} );
	}, [ getPickerStatus ] );

	useEffect( () => {
		if ( pickerFeatureEnabled && isAuthenticated && ! isPickerSessionAccurate ) {
			createPickerSession();
		}
	}, [ pickerFeatureEnabled, isPickerSessionAccurate, isAuthenticated, createPickerSession ] );

	if ( pickerFeatureEnabled === null ) {
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
