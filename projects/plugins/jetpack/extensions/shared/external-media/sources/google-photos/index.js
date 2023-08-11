import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosMedia from './google-photos-media';

function GooglePhotos( props ) {
	if ( ! props.isAuthenticated ) {
		return <GooglePhotosAuth { ...props } />;
	}

	return <GooglePhotosMedia { ...props } />;
}

export default withMedia( MediaSource.GooglePhotos )( GooglePhotos );
