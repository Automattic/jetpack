/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { MEDIA_TOKEN_SCOPES } from './types';
/**
 * Types
 */
import type { MediaTokenScopeProps, MediaTokenProps, GetMediaTokenArgsProps } from './types';

type Response = {
	metadata_token: string;
	blog_id: string;
};

/**
 * Request media token data hiting WPCOM API.
 *
 * @param {MediaTokenScopeProps} scope  - The scope of the token to request.
 * @param {GetMediaTokenArgsProps} args - function arguments.
 * @returns {MediaTokenProps}             Media token data.
 */
const requestMediaToken = function (
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const { guid } = args;
	return new Promise( function ( resolve, reject ) {
		if ( ! MEDIA_TOKEN_SCOPES.includes( scope ) ) {
			return reject( 'Invalid scope' );
		}

		const fetchParams: { path: string; body: object } = { path: '', body: {} };

		switch ( scope ) {
			case 'upload':
				return reject( '"upload" scope is not supported.' );

			case 'upload-jwt':
				return reject( '"upload-jwt" scope is not supported.' );

			case 'playback':
				fetchParams.path = `/wpcom/v2/media/videopress-playback-jwt/${ guid }`;
				fetchParams.body = {};
				break;
		}

		apiFetch< Response >( {
			path: fetchParams.path,
			method: 'POST',
			body: fetchParams.body,
		} ).then( response => {
			const { metadata_token } = response;
			if ( ! metadata_token ) {
				console.warn( 'Token is not achievable' ); // eslint-disable-line no-console
				resolve( { token: null } );
				return;
			}
			resolve( { token: metadata_token } );
		} );
	} );
};

/**
 * Return media token data from fetch request.
 *
 * NOTE: In the native version, the token is not persisted.
 *
 * @param {MediaTokenScopeProps} scope  - The scope of the token to request.
 * @param {GetMediaTokenArgsProps} args - function arguments.
 * @returns {MediaTokenProps}             Media token data.
 */
async function getMediaToken(
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const { flushToken } = args;

	if ( flushToken ) {
		// eslint-disable-next-line no-console
		console.warn( 'Token is not persisted in the native version.' );
	}

	return await requestMediaToken( scope, args );
}

export default getMediaToken;
