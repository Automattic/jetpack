import { Spinner } from '@wordpress/components';
import { useEffect, useState } from 'react';
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
		if ( ! pickerSession || ! isPickerSessionAccurate ) {
			createPickerSession();
		}
	}, [ pickerSession, createPickerSession, isPickerSessionAccurate ] );

	if ( pickerFeatureEnabled === null ) {
		return (
			<div className="jetpack-external-media__spinner-container">
				<Spinner />
			</div>
		);
	}

	if ( ! isAuthenticated || ( pickerFeatureEnabled && ! isPickerSessionAccurate ) ) {
		return <GooglePhotosAuth { ...props } />;
	}

	if ( pickerFeatureEnabled && ! pickerSession?.mediaItemsSet ) {
		return <GooglePhotosPickerButton { ...props } />;
	}

	return <GooglePhotosMedia pickerFeatureEnabled { ...props } />;
}

export default withMedia( MediaSource.GooglePhotos )( GooglePhotos );
