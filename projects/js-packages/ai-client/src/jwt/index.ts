/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import apiFetchMod from '@wordpress/api-fetch';
import debugFactory from 'debug';
/*
 * Types & constants
 */
type RequestTokenOptions = {
	apiNonce?: string;
	siteId?: string;
	isJetpackSite?: boolean;
	expirationTime?: number;
};

type TokenDataProps = {
	token: string;
	blogId: string;
	expire: number;
};

type TokenDataEndpointResponseProps = {
	token: string;
	blog_id: string;
};

const debug = debugFactory( 'jetpack-ai-client:jwt' );

// @wordpress/api-fetch (as of 6.47.0) declares itself in such a way that tsc and node see the function at apiFetchMod.default
// while some other environments (including code running inside WordPress itself) see it at apiFetch.
// See https://arethetypeswrong.github.io/?p=@wordpress/api-fetch@6.47.0
type ApiFetchType = typeof apiFetchMod.default;
const apiFetch: ApiFetchType = ( apiFetchMod.default ?? apiFetchMod ) as ApiFetchType;

const JWT_TOKEN_ID = 'jetpack-ai-jwt';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * Request a token from the Jetpack site.
 *
 * @param {RequestTokenOptions} options - Options
 * @returns {Promise<TokenDataProps>}     The token and the blogId
 */
export default async function requestJwt( {
	apiNonce,
	siteId,
	expirationTime,
}: RequestTokenOptions = {} ): Promise< TokenDataProps > {
	// Default values
	apiNonce = apiNonce || window.JP_CONNECTION_INITIAL_STATE.apiNonce;
	siteId = siteId || window.JP_CONNECTION_INITIAL_STATE.siteSuffix;
	expirationTime = expirationTime || JWT_TOKEN_EXPIRATION_TIME;

	const isSimple = isSimpleSite();

	// Trying to pick the token from localStorage
	const token = localStorage.getItem( JWT_TOKEN_ID );
	let tokenData: TokenDataProps | null = null;

	if ( token ) {
		try {
			tokenData = JSON.parse( token );
		} catch ( err ) {
			debug( 'Error parsing token', err );
		}
	}

	if ( tokenData && tokenData?.expire > Date.now() ) {
		debug( 'Using cached token' );
		return tokenData;
	}

	let data: TokenDataEndpointResponseProps;

	if ( ! isSimple ) {
		data = await apiFetch( {
			/*
			 * This endpoint is registered in the Jetpack plugin.
			 * Provably we should move it to another package, but for now it's here.
			 * issue: https://github.com/Automattic/jetpack/issues/31938
			 */
			path: '/jetpack/v4/jetpack-ai-jwt?_cacheBuster=' + Date.now(),
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
			},
			method: 'POST',
		} );
	} else {
		data = await apiFetch( {
			path: '/wpcom/v2/sites/' + siteId + '/jetpack-openai-query/jwt',
			method: 'POST',
		} );
	}

	const newTokenData = {
		token: data.token,
		/**
		 * TODO: make sure we return id from the .com token acquisition endpoint too
		 */
		blogId: ! isSimple ? data.blog_id : siteId,

		/**
		 * Let's expire the token in 2 minutes
		 */
		expire: Date.now() + expirationTime,
	};

	// Store the token in localStorage
	debug( 'Storing new token' );
	localStorage.setItem( JWT_TOKEN_ID, JSON.stringify( newTokenData ) );

	return newTokenData;
}
