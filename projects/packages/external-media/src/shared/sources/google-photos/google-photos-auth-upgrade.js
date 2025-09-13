import { GooglePhotosLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { __ } from '@wordpress/i18n';
import GooglePhotosDisconnect from './google-photos-disconnect';

/**
 * GooglePhotosAuthUpgrade component
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
export default function GooglePhotosAuthUpgrade( props ) {
	const { setAuthenticated } = props;

	return (
		<div className="jetpack-external-media-auth">
			<GooglePhotosLogo />

			<p>
				{ __(
					"We've updated our Google Photos service. You will need to disconnect and reconnect to continue accessing your photos.",
					'jetpack-external-media'
				) }
			</p>

			<GooglePhotosDisconnect setAuthenticated={ setAuthenticated } />
		</div>
	);
}
