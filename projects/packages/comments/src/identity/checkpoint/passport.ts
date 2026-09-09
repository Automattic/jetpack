/**
 * The display half of the passport: provider, name and avatar, in a cookie the
 * page can read. The page HTML is cached and shared, so this is the only place
 * a returning commenter's identity can come from.
 */

import type { Passport, Provider } from '../../shared/types';

const PROVIDERS: Provider[] = [ 'wordpress', 'google', 'facebook' ];

/**
 * Who the display cookie says is back, if anyone.
 *
 * @return The passport, or null.
 */
export const readPassport = (): Passport | null => {
	const name = JetpackComments.identity?.displayCookie;

	if ( ! name ) {
		return null;
	}

	const raw = document.cookie
		.split( '; ' )
		.find( row => row.startsWith( `${ name }=` ) )
		?.slice( name.length + 1 );

	if ( ! raw ) {
		return null;
	}

	try {
		const data = JSON.parse( decodeURIComponent( raw ) ) as Record< string, unknown >;

		if (
			! data ||
			typeof data.name !== 'string' ||
			typeof data.provider !== 'string' ||
			! PROVIDERS.includes( data.provider as Provider )
		) {
			return null;
		}

		return {
			provider: data.provider as Provider,
			name: data.name,
			avatar: typeof data.avatar === 'string' ? data.avatar : '',
		};
	} catch {
		return null;
	}
};

/**
 * Forget the display cookie now, without waiting on the server's response.
 */
export const clearPassport = (): void => {
	const { displayCookie, cookiePath, cookieDomain } = JetpackComments.identity;
	// Path and domain have to match what the server set, or this names a different cookie.
	document.cookie = `${ displayCookie }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${
		cookiePath || '/'
	}${ cookieDomain ? `; domain=${ cookieDomain }` : '' }; SameSite=Lax`;
};
