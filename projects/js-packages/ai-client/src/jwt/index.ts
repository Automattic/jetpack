/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import apiFetch from '../api-fetch/index.ts';
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

type JetpackEditorInitialState = {
	wpcomBlogId?: string;
};

const debug = debugFactory( 'jetpack-ai-client:jwt' );

const JWT_TOKEN_ID = 'jetpack-ai-jwt';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * Request a token from the Jetpack site.
 *
 * @param {RequestTokenOptions} options - Options
 * @return {Promise<TokenDataProps>}     The token and the blogId
 */
export default async function requestJwt( {
	apiNonce,
	siteId,
	expirationTime,
}: RequestTokenOptions = {} ): Promise< TokenDataProps > {
	const wpcomBlogId = (
		window as Window & {
			Jetpack_Editor_Initial_State?: JetpackEditorInitialState;
		}
	 ).Jetpack_Editor_Initial_State?.wpcomBlogId;

	// Default values
	apiNonce = apiNonce || window.JP_CONNECTION_INITIAL_STATE.apiNonce;
	siteId = siteId || window.JP_CONNECTION_INITIAL_STATE.siteSuffix;
	expirationTime = expirationTime || JWT_TOKEN_EXPIRATION_TIME;

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

	const isSimple = isSimpleSite();
	const cachedTokenHasExpectedBlogId =
		! isSimple || ! wpcomBlogId || tokenData?.blogId === wpcomBlogId;

	if ( tokenData && tokenData?.expire > Date.now() && cachedTokenHasExpectedBlogId ) {
		debug( 'Using cached token' );
		return tokenData;
	}

	let data: TokenDataEndpointResponseProps;

	if ( ! isSimple ) {
		data = ( await apiFetch( {
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
		} ) ) as TokenDataEndpointResponseProps;
	} else {
		data = ( await apiFetch( {
			path: '/wpcom/v2/sites/' + siteId + '/jetpack-openai-query/jwt',
			method: 'POST',
		} ) ) as TokenDataEndpointResponseProps;
	}

	const newTokenData = {
		token: data.token,
		blogId: ! isSimple ? data.blog_id : wpcomBlogId || data.blog_id || siteId,

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
