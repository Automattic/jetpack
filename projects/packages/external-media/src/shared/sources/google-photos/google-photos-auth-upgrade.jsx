import { GooglePhotosLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import GooglePhotosDisconnect from './google-photos-disconnect';

/**
 * GooglePhotosAuthUpgrade component
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
export default function GooglePhotosAuthUpgrade( props ) {
	const { setAuthenticated, onRetry } = props;

	return (
		<div className="jetpack-external-media-auth">
			<GooglePhotosLogo />

			<p>
				{ __(
					'Reconnect your Google account to keep using Google Photos.',
					'jetpack-external-media'
				) }
			</p>

			{ onRetry && (
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack-external-media' ) }
				</Button>
			) }
			<GooglePhotosDisconnect setAuthenticated={ setAuthenticated } />
		</div>
	);
}
