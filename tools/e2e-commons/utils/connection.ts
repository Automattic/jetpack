import logger from '../logger';
import { getDotComCredentials } from './environment.ts';
import { TestUtils } from '.';

/**
 * Connect Jetpack site and user to WordPress.com.
 */
export async function connect( this: TestUtils ) {
	const authorizeUrl = await connectSite.call( this );
	const clientId = new URL( authorizeUrl ).searchParams.get( 'client_id' ) || '';

	// await partnerProvisionConnection( creds.userId, 'free', siteCreds.username );
	await connectUser.call( this, clientId );
}

/**
 * Connect Jetpack site.
 * @return {Promise<void>} Resolves when the connection is complete.
 */
export async function connectSite( this: TestUtils ): Promise< void > {
	if ( await isSiteConnected.call( this ) ) {
		logger.debug( 'Site is already connected, no need to connect.' );
		return;
	}

	// Connect the site.
	const r = await this.requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection/register',
		data: { from: 'jetpack-app', plugin_slug: 'jetpack' },
	} );

	logger.debug( `Site connection response: ${ JSON.stringify( r ) }` );

	return r.authorizeUrl;
}

/**
 * Connect user.
 * @param  clientId - Client ID from the authorize URL.
 * @return {Promise<void>} Resolves when the connection is complete.
 */
export async function connectUser( this: TestUtils, clientId: string ): Promise< void > {
	if ( await isUserConnected.call( this ) ) {
		logger.debug( 'User is already connected, no need to connect.' );
		return;
	}

	const provisionResponse = await this.requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/remote_provision',
		data: { from: 'jetpack-e2e', plugin_slug: 'jetpack' },
	} );

	logger.debug( `remote_provision response: ${ JSON.stringify( provisionResponse ) }` );

	const { scope, secret, redirect_uri, user_id } = provisionResponse;

	const bearerToken = getDotComCredentials().bearerToken;

	const connectUserResponse = await this.requestUtils.request.post(
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
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnect(): Promise< void > {
	await disconnectUser.call( this );
	await disconnectSite.call( this );
}

/**
 * Disconnect user from WordPress.com.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectUser( this: TestUtils ): Promise< void > {
	if ( ! ( await isUserConnected.call( this ) ) ) {
		logger.debug( 'User is not connected, no need to disconnect.' );
		return;
	}

	// Unlink current user from the related WordPress.com account.
	// `linked` as `false` will disconnect the site.
	const r = await this.requestUtils.rest( {
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
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectSite(): Promise< void > {
	if ( ! ( await isSiteConnected.call( this ) ) ) {
		logger.debug( 'Site is not connected, no need to disconnect.' );
		return;
	}

	const r = await this.requestUtils.rest( {
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
 */
export async function isSiteConnected( this: TestUtils ): Promise< boolean > {
	try {
		const r = await this.requestUtils.rest( { path: 'jetpack/v4/connection' } );
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
 */
export async function isUserConnected( this: TestUtils ): Promise< boolean > {
	try {
		const r = await this.requestUtils.rest( { path: 'jetpack/v4/connection/data' } );
		logger.debug( `User connection check response: ${ JSON.stringify( r ) }` );
		return r.currentUser.isConnected;
	} catch ( error ) {
		logger.error( `Error checking user connection: ${ error }` );
		return false;
	}
}
