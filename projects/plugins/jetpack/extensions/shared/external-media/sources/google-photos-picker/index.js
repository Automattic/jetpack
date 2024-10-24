import { MediaSource } from '../../media-service/types';
import withMedia from '../with-media';
import GooglePhotosPickerAuth from './google-photos-picker-auth';

function GooglePhotosPicker( props ) {
	if ( ! props.isAuthenticated ) {
		return <GooglePhotosPickerAuth { ...props } />;
	}

	return <div>Render button</div>;
}

export default withMedia( MediaSource.GooglePhotosPicker )( GooglePhotosPicker );
