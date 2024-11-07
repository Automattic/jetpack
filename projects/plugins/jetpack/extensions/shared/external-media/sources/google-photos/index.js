import { useEffect } from 'react';
import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosMedia from './google-photos-media';
import GooglePhotosPickerButton from './google-photos-picker-button';

function GooglePhotos( props ) {
	const { pickerSession, createPickerSession } = props;

	useEffect( () => {
		if ( ! pickerSession ) {
			createPickerSession();
		}
	}, [ pickerSession, createPickerSession ] );

	if ( ! props.isAuthenticated ) {
		return <GooglePhotosAuth { ...props } />;
	}

	if ( ! props.pickerSession?.mediaItemsSet ) {
		return <GooglePhotosPickerButton { ...props } />;
	}

	return <GooglePhotosMedia { ...props } />;
}

export default withMedia( MediaSource.GooglePhotos )( GooglePhotos );
