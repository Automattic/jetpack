/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from './store';

const FETCH_CONNECTION_STATUS = () => {
	return new Promise( ( resolve, reject ) => {
		restApi
			.fetchSiteConnectionStatus()
			.then( result => resolve( result ) )
			.catch( error => reject( error ) );
	} );
};

const REGISTER_SITE = ( { registrationNonce, redirectUri } ) =>
	restApi.registerSite( registrationNonce, redirectUri );

const CONNECT_USER = createRegistryControl( ( { select } ) => ( { from, redirectFunc } = {} ) => {
	const authorizationUrl = select( STORE_ID ).getAuthorizationUrl() || '';
	const redirect = redirectFunc || ( url => window.location.assign( url ) );

	redirect(
		authorizationUrl +
			( from
				? ( authorizationUrl.includes( '?' ) ? '&' : '?' ) + 'from=' + encodeURIComponent( from )
				: '' )
	);
} );

const FETCH_AUTHORIZATION_URL = ( { redirectUri } ) => restApi.fetchAuthorizationUrl( redirectUri );

export default {
	FETCH_CONNECTION_STATUS,
	FETCH_AUTHORIZATION_URL,
	REGISTER_SITE,
	CONNECT_USER,
};
