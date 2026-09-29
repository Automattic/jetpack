/**
 * The display half of the passport: name and avatar, in a cookie the page can
 * read. The HTML is cached and shared, so this is the only place a returning
 * commenter's identity can come from.
 */

import type { Passport } from '../../shared/types';

/**
 * Who the display cookie says is back, if anyone.
 *
 * @return The passport, or null.
 */
export const readPassport = (): Passport | null => {
	const { displayCookie: name, blogId } = JetpackComments.identity;

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

		// A network shares one cookie domain, so another site's sign-in can land here.
		if ( ! data || data.blog_id !== blogId || typeof data.name !== 'string' ) {
			return null;
		}

		return {
			name: data.name,
			avatar:
				( typeof data.avatar === 'string' && data.avatar ) ||
				JetpackComments.identity.defaultAvatar,
		};
	} catch {
		return null;
	}
};

/**
 * Forget the display cookie now, without waiting on the server.
 */
export const clearPassport = (): void => {
	const { displayCookie, cookiePath, cookieDomain } = JetpackComments.identity;
	// Path and domain have to match what the server set, or this names a different cookie.
	document.cookie = `${ displayCookie }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${
		cookiePath || '/'
	}${ cookieDomain ? `; domain=${ cookieDomain }` : '' }; SameSite=Lax`;
};
