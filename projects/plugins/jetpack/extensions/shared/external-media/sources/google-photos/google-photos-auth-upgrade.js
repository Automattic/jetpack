import { __ } from '@wordpress/i18n';
import { GooglePhotosLogo } from '../../../icons';
import GooglePhotosDisconnect from './google-photos-disconnect';

export default function GooglePhotosAuthUpgrade( props ) {
	const { setAuthenticated } = props;

	return (
		<div className="jetpack-external-media-auth">
			<GooglePhotosLogo />

			<p>
				{ __(
					"We've updated our Google Photos service. You will need to disconnect and reconnect to continue accessing your photos.",
					'jetpack'
				) }
			</p>

			<GooglePhotosDisconnect setAuthenticated={ setAuthenticated } />
		</div>
	);
}
