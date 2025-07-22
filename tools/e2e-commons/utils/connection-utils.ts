import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import config from 'config';
import logger from '../logger';

/**
 * Get WordPress.com bearer token using client credentials flow.
 * @param requestUtils - RequestUtils instance
 * @return Promise<string> - Bearer token
 */
export async function getWpcomBearerToken( requestUtils: RequestUtils ): Promise< string > {
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );
	const response = await requestUtils.request.post(
		'https://public-api.wordpress.com/oauth2/token',
		{
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Host: 'public-api.wordpress.com',
			},
			form: {
				client_id: clientID,
				client_secret: clientSecret,
				grant_type: 'client_credentials',
				scope: 'jetpack-partner',
			},
		}
	);

	const tokenData = await response.json();
	logger.debug( `Bearer token response: ${ JSON.stringify( tokenData ) }` );
	return tokenData.access_token;
}

/**
 * Connect Jetpack site and user to WordPress.com.
 * @param requestUtils - RequestUtils instance.
 */
export async function connect( requestUtils: RequestUtils ) {
	// const creds = getDotComCredentials();
	// const siteCreds = getSiteCredentials();
	// await execWpCommand( `user update ${ siteCreds.username } --user_email=${ creds.email }` );

	// await provisionJetpackStartConnection( creds.userId, 'free', siteCreds.username );

	const authorizeUrl = await connectSite( requestUtils );
	const clientId = new URL( authorizeUrl ).searchParams.get( 'client_id' ) || '';

	await connectUser( requestUtils, clientId );
}

/**
 * Connect Jetpack site.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the connection is complete.
 */
export async function connectSite( requestUtils: RequestUtils ) {
	if ( await isSiteConnected( requestUtils ) ) {
		logger.debug( 'Site is already connected, no need to connect.' );
		return;
	}

	// Connect the site to Jetpack.
	// /jetpack/v4/connection/register
	const r = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection/register',
		data: { from: 'jetpack-app', plugin_slug: 'jetpack' },
	} );

	logger.debug( `Site connection response: ${ JSON.stringify( r ) }` );

	return r.authorizeUrl;
}

/**
 * Connect user.
 * @param  requestUtils - RequestUtils instance.
 * @param  clientId     - Client ID from the authorize URL.
 * @return {Promise<void>} Resolves when the connection is complete.
 */
export async function connectUser( requestUtils: RequestUtils, clientId: string ) {
	if ( await isUserConnected( requestUtils ) ) {
		logger.debug( 'User is already connected, no need to connect.' );
		return;
	}

	const provisionResponse = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/remote_provision',
		data: { from: 'jetpack-e2e', plugin_slug: 'jetpack' },
	} );

	logger.debug( `remote_provision response: ${ JSON.stringify( provisionResponse ) }` );

	const { scope, secret, redirect_uri, user_id } = provisionResponse;

	const bearerToken = await getWpcomBearerToken( requestUtils );

	const connectUserResponse = await requestUtils.request.post(
		`https://public-api.wordpress.com/wpcom/v2/sites/${ clientId }/jetpack-remote-connect-user`,
		{
			headers: {
				Authorization: `Bearer ${ bearerToken }`,
				'Content-Type': 'application/json',
				Host: 'public-api.wordpress.com',
			},
			data: {
				secret,
				external_user_id: user_id.toString(),
				redirect_uri,
				scope,
			},
		}
	);

	const connectUserResponseData = await connectUserResponse.json();

	logger.debug( `connect user response: ${ JSON.stringify( connectUserResponseData ) }` );
}

/**
 * Disconnect Jetpack.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnect( requestUtils: RequestUtils ) {
	// await execWpCommand( 'jetpack disconnect blog' );
	await disconnectUser( requestUtils );
	await disconnectSite( requestUtils );
}

/**
 * Disconnect user from WordPress.com.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectUser( requestUtils: RequestUtils ) {
	if ( ! ( await isUserConnected( requestUtils ) ) ) {
		logger.debug( 'User is not connected, no need to disconnect.' );
		return;
	}

	// Unlink current user from the related WordPress.com account.
	// `linked` as `false` will disconnect the site.
	const r = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection/user',
		data: {
			'disconnect-all-users': true,
			force: true,
			linked: false,
		},
	} );

	logger.debug( `User disconnection response: ${ JSON.stringify( r ) }` );
}

/**
 * Disconnect Jetpack installation from WordPress.com.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectSite( requestUtils: RequestUtils ) {
	if ( ! ( await isSiteConnected( requestUtils ) ) ) {
		logger.debug( 'Site is not connected, no need to disconnect.' );
		return;
	}

	const r = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection',
		data: {
			isActive: false,
		},
	} );

	logger.debug( `Site disconnection response: ${ JSON.stringify( r ) }` );
}

/**
 * Check if the site is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 * @param  requestUtils - RequestUtils instance.
 */
export async function isSiteConnected( requestUtils: RequestUtils ): Promise< boolean > {
	try {
		const r = await requestUtils.rest( { path: 'jetpack/v4/connection' } );
		logger.debug( `Site connection check response: ${ JSON.stringify( r ) }` );
		return r.isActive;
	} catch ( error ) {
		logger.error( `Error checking site connection: ${ error }` );
		return false;
	}
}

/**
 * Check if the user is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 * @param  requestUtils - RequestUtils instance.
 */
export async function isUserConnected( requestUtils: RequestUtils ): Promise< boolean > {
	try {
		const r = await requestUtils.rest( { path: 'jetpack/v4/connection/data' } );
		logger.debug( `User connection check response: ${ JSON.stringify( r ) }` );
		return r.currentUser.isConnected;
	} catch ( error ) {
		logger.error( `Error checking user connection: ${ error }` );
		return false;
	}
}
