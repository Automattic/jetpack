/**
 * External dependencies
 */
const { get, merge } = require( 'lodash' );
const fetch = require( 'node-fetch' );

const envVars = get( global, 'process.env', {} );

const {
	AUTH_COOKIE_NAME,
	SUBSCRIBER_USER_ID,
	SUBSCRIBER_RESTAPI_NONCE,
	SUBSCRIBER_AUTH_COOKIE,
} = envVars;

const subscriberCookies = `${ AUTH_COOKIE_NAME }=${ SUBSCRIBER_AUTH_COOKIE }`;
const siteBaseUrl = 'http://nginx:8989';

const fetchPath = ( path = '', options = {} ) => fetch( `${ siteBaseUrl }${ path }`, options );

const fetchPathLoggedIn = ( path = '', options = {} ) => {
	return fetchPath(
		path,
		merge(
			{
				credentials: 'include',
				headers: {
					Cookie: subscriberCookies,
				},
			},
			options
		)
	);
};

const apiNonceHeader = { 'X-WP-Nonce': SUBSCRIBER_RESTAPI_NONCE };
const fetchPathLoggedInWithRestApiNonce = ( path = '', options = {} ) =>
	fetchPathLoggedIn( path, merge( options, { headers: apiNonceHeader } ) );
const fetchPathLoggedOutWithRestApiNonce = ( path = '', options = {} ) =>
	fetchPath( path, merge( options, { headers: apiNonceHeader } ) );

module.exports = {
	AUTH_COOKIE_NAME,
	SUBSCRIBER_USER_ID,
	SUBSCRIBER_RESTAPI_NONCE,
	SUBSCRIBER_AUTH_COOKIE,
	fetchPath,
	fetchPathLoggedIn,
	fetchPathLoggedInWithRestApiNonce,
	fetchPathLoggedOutWithRestApiNonce,
};
