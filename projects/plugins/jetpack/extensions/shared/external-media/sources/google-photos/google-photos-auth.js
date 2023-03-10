import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SOURCE_GOOGLE_PHOTOS } from '../../constants';
import { getApiUrl } from '../api';
import AuthInstructions from './auth-instructions';
import AuthProgress from './auth-progress';

function GooglePhotosAuth( props ) {
	const { setAuthenticated } = props;
	const [ isAuthing, setIsAuthing ] = useState( false );

	const onAuthorize = useCallback( () => {
		setIsAuthing( true );

		// Get connection details
		apiFetch( {
			path: getApiUrl( 'connection', SOURCE_GOOGLE_PHOTOS ),
		} )
			.then( service => {
				if ( service.error ) {
					throw service.message;
				}

				// Open authorize URL in a window and let it play out
				requestExternalAccess( service.connect_URL, () => {
					setIsAuthing( false );
					setAuthenticated( true );
				} );
			} )
			.catch( () => {
				// Not much we can tell the user at this point so let them try and auth again
				setIsAuthing( false );
			} );
	}, [ setAuthenticated ] );

	return (
		<div className="jetpack-external-media-auth">
			{ isAuthing ? <AuthProgress /> : <AuthInstructions /> }

			<Button variant="primary" disabled={ isAuthing } onClick={ onAuthorize }>
				{ __( 'Connect to Google Photos', 'jetpack' ) }
			</Button>
		</div>
	);
}

export default GooglePhotosAuth;
