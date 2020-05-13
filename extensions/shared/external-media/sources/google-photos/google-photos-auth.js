/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SOURCE_GOOGLE_PHOTOS } from '../../constants';
// TODO: import requestExternalAccess from '@automattic/request-external-access';
// Remove following line, once package is ready.
const requestExternalAccess = () => {};
import { getApiUrl } from '../api';
import AuthInstructions from './auth-instructions';
import AuthProgress from './auth-progress';

function GooglePhotosAuth( props ) {
	const { getNextPage } = props;

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
					getNextPage( true );
				} );
			} )
			.catch( () => {
				// Not much we can tell the user at this point so let them try and auth again
				setIsAuthing( false );
			} );
	}, [] );

	return (
		<div className="jetpack-external-media-auth">
			{ isAuthing ? <AuthProgress /> : <AuthInstructions /> }

			<Button isPrimary disabled={ isAuthing } onClick={ onAuthorize }>
				{ __( 'Authorize', 'jetpack' ) }
			</Button>
		</div>
	);
}

export default GooglePhotosAuth;
