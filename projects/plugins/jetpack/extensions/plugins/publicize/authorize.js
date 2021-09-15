/**
 * External dependencies
 */
import requestExternalAccess from '@automattic/request-external-access';

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

// Copied from projects/plugins/jetpack/extensions/shared/external-media/sources/google-photos/google-photos-auth.js
function Authorize() {
	const [ isAuthing, setIsAuthing ] = useState( false );

	const onAuthorize = useCallback( () => {
		setIsAuthing( true );
		// Get connection details
		apiFetch( {
			url: '/wp-json/wpcom/v2/external-services',
		} )
			.then( data => {
				console.log( 'here' );
				console.log( data );
				if ( data.error ) {
					throw data.message;
				}
				// Open authorize URL in a window and let it play out
				requestExternalAccess( data.services.tumblr.connect_URL, () => {} );
			} )
			.catch( () => {
				console.log( 'failed' );
				setIsAuthing( false );
			} );
	} );

	return (
		<div className="jetpack-external-media-auth">
			<Button isPrimary disabled={ isAuthing } onClick={ onAuthorize }>
				{ __( 'Connect to Tumblr', 'jetpack' ) }
			</Button>
		</div>
	);
}

export default Authorize;
