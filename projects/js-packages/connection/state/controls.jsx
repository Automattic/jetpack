import restApi from '@automattic/jetpack-api';
import { createRegistryControl } from '@wordpress/data';
import STORE_ID from './store-id';

const REGISTER_SITE = ( { registrationNonce, redirectUri } ) =>
	restApi.registerSite( registrationNonce, redirectUri );

const CONNECT_USER = createRegistryControl(
	( { resolveSelect } ) => ( { from, redirectFunc, redirectUri } = {} ) => {
		return new Promise( ( resolve, reject ) => {
			resolveSelect( STORE_ID )
				.getAuthorizationUrl( redirectUri )
				.then( authorizationUrl => {
					const redirect = redirectFunc || ( url => window.location.assign( url ) );

					const url = new URL( authorizationUrl );

					if ( from ) {
						url.searchParams.set( 'from', encodeURIComponent( from ) );
					}

					const finalUrl = url.toString();
					redirect( finalUrl );
					resolve( finalUrl );
				} )
				.catch( error => {
					reject( error );
				} );
		} );
	}
);

const FETCH_AUTHORIZATION_URL = ( { redirectUri } ) => restApi.fetchAuthorizationUrl( redirectUri );

export default {
	FETCH_AUTHORIZATION_URL,
	REGISTER_SITE,
	CONNECT_USER,
};
