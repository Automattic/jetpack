import { isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Jetpack AI JWT, minted from the site and cached in localStorage. Inlined from
 * `@automattic/jetpack-ai-client`'s `requestJwt`, which wp-build can't currently
 * bundle.
 */

interface TokenData {
	token: string;
	blogId: string;
	expire: number;
}

interface TokenEndpointResponse {
	token: string;
	blog_id: string;
}

const JWT_TOKEN_ID = 'jetpack-ai-jwt';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000;

/**
 * Mint (or return a cached) Jetpack AI JWT for the current site.
 *
 * @return The token, blog id, and expiry timestamp.
 */
export async function requestJwt(): Promise< TokenData > {
	const initialState = window.JP_CONNECTION_INITIAL_STATE;
	const apiNonce = initialState?.apiNonce;
	const siteId = initialState?.siteSuffix;

	const cached = localStorage.getItem( JWT_TOKEN_ID );
	if ( cached ) {
		try {
			const parsed: TokenData = JSON.parse( cached );
			if ( parsed?.expire > Date.now() ) {
				return parsed;
			}
		} catch {
			// Fall through and mint a fresh token.
		}
	}

	const isSimple = isSimpleSite();

	// Fail fast with a clear message rather than forming a bad request that only surfaces downstream.
	if ( isSimple && ! siteId ) {
		throw new Error(
			'[AI Launchpad] cannot mint a JWT: missing site id (JP_CONNECTION_INITIAL_STATE.siteSuffix).'
		);
	}
	if ( ! isSimple && ! apiNonce ) {
		throw new Error(
			'[AI Launchpad] cannot mint a JWT: missing API nonce (JP_CONNECTION_INITIAL_STATE.apiNonce).'
		);
	}

	const data = ( await apiFetch( {
		path: isSimple
			? '/wpcom/v2/sites/' + siteId + '/jetpack-openai-query/jwt'
			: '/jetpack/v4/jetpack-ai-jwt?_cacheBuster=' + Date.now(),
		method: 'POST',
		credentials: 'same-origin',
		// The guard above already threw if a non-Simple site had no nonce, but that fact can't be
		// carried across the `isSimple` conjunction, so the nonce is re-tested rather than asserted
		// away. The extra test is unreachable, and the request is unchanged either way.
		headers: isSimple || ! apiNonce ? undefined : { 'X-WP-Nonce': apiNonce },
	} ) ) as TokenEndpointResponse;

	const tokenData: TokenData = {
		token: data.token,
		blogId: isSimple ? String( siteId ) : data.blog_id,
		expire: Date.now() + JWT_TOKEN_EXPIRATION_TIME,
	};

	localStorage.setItem( JWT_TOKEN_ID, JSON.stringify( tokenData ) );

	return tokenData;
}
