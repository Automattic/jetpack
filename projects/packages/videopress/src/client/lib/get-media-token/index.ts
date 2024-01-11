/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { VideoGUID } from '../../block-editor/blocks/video/types';
import { MEDIA_TOKEN_SCOPES } from './types';
/**
 * Types
 */
import type {
	MediaTokenScopeProps,
	MediaTokenScopeAdminAjaxResponseBodyProps,
	MediaTokenProps,
	AdminAjaxTokenProps,
	GetMediaTokenArgsProps,
} from './types';

const debug = debugFactory( 'videopress:get-media-token' );

// Lifetime of the token in milliseconds.
const TOKEN_LIFETIME = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Request media token data hiting the admin-ajax endpoint.
 *
 * @param {MediaTokenScopeProps} scope  - The scope of the token to request.
 * @param {GetMediaTokenArgsProps} args - function arguments.
 * @returns {MediaTokenProps}             Media token data.
 */
const requestMediaToken = function (
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const {
		id = 0,
		guid,
		subscriptionPlanId = 0,
		adminAjaxAPI: adminAjaxAPIArgument,
		filename,
	} = args;
	return new Promise( function ( resolve, reject ) {
		const adminAjaxAPI =
			adminAjaxAPIArgument ||
			window.videopressAjax?.ajaxUrl ||
			window?.ajaxurl ||
			'/wp-admin/admin-ajax.php';

		if ( ! MEDIA_TOKEN_SCOPES.includes( scope ) ) {
			return reject( 'Invalid scope' );
		}

		const fetchData: {
			action: AdminAjaxTokenProps;
			guid?: VideoGUID;
			subscription_plan_id?: number;
			post_id?: string;
			filename?: string;
		} = { action: 'videopress-get-playback-jwt' };

		switch ( scope ) {
			case 'upload':
				fetchData.action = 'videopress-get-upload-token';
				if ( filename ) {
					fetchData.filename = filename;
				}
				break;

			case 'upload-jwt':
				fetchData.action = 'videopress-get-upload-jwt';
				break;

			case 'playback':
				fetchData.action = 'videopress-get-playback-jwt';
				fetchData.guid = guid;
				fetchData.post_id = String( id );
				fetchData.subscription_plan_id = subscriptionPlanId;
				break;
		}

		fetch( adminAjaxAPI, {
			method: 'POST',
			credentials: 'same-origin',
			body: new URLSearchParams( fetchData ),
		} )
			.then( response => {
				if ( ! response.ok ) {
					throw new Error( 'Network response was not ok' );
				}
				return response.json();
			} )
			.then( ( response: MediaTokenScopeAdminAjaxResponseBodyProps ) => {
				if ( ! response.success ) {
					throw new Error( 'Token is not achievable' );
				}

				switch ( scope ) {
					case 'upload':
					case 'upload-jwt':
						resolve( {
							token: response.data.upload_token,
							blogId: response.data.upload_blog_id,
							url: response.data.upload_action_url,
						} );
						break;

					case 'playback':
						resolve( { token: response.data.jwt } );
						break;
				}
			} )
			.catch( () => {
				console.warn( 'Token is not achievable' ); // eslint-disable-line no-console
				resolve( { token: null } );
			} );
	} );
};

/**
 * Return media token data
 * from the localStore in case it is still valid,
 * otherwise request it from the admin-ajax endpoint.
 *
 * @param {MediaTokenScopeProps} scope  - The scope of the token to request.
 * @param {GetMediaTokenArgsProps} args - function arguments.
 * @returns {MediaTokenProps}             Media token data.
 */
async function getMediaToken(
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const { id = 0, guid = 0, flushToken } = args;
	const key = `vpc-${ scope }-${ id }-${ guid }`;

	const context = window?.videopressAjax?.context || 'main';

	let storedToken: {
		data: MediaTokenProps;
		expire: number;
	};

	const storedRawTokenData = localStorage.getItem( key );
	if ( flushToken ) {
		debug( '(%s) Flushing %o token', context, key );
		localStorage.removeItem( key );
	} else {
		try {
			if ( storedRawTokenData ) {
				storedToken = await JSON.parse( storedRawTokenData );
				if ( storedToken && storedToken.expire > Date.now() ) {
					debug( '(%s) Providing %o token from the store', context, key );
					return storedToken.data;
				}

				// Remove expired token.
				debug( '(%s) Token %o expired. Clean.', context, key );
				localStorage.removeItem( key );
			}
		} catch ( e ) {
			debug( 'Invalid token in the localStore' );
		}
	}

	const tokenData = await requestMediaToken( scope, args );

	// Only store valid playback tokens.
	if ( 'playback' === scope && tokenData?.token ) {
		debug( '(%s) Storing %o token', context, key );
		localStorage.setItem(
			key,
			JSON.stringify( {
				data: tokenData,
				expire: Date.now() + TOKEN_LIFETIME,
			} )
		);
	}

	debug( '(%s) Providing %o token from request/response', context, key );
	return tokenData;
}

export default getMediaToken;
