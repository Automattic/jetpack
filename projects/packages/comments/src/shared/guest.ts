import type { Details } from './types';

/**
 * Core's saved guest details, written the way core writes them after a comment, or
 * cleared. Path and domain match core's, or these would name different cookies.
 *
 * @param details - What to save, or null to forget them.
 */
export const saveGuest = ( details: Details | null ): void => {
	const { cookieHash, cookiePath, cookieDomain } = JetpackComments.identity;
	const expires = new Date( details ? Date.now() + 365 * 24 * 60 * 60 * 1000 : 0 ).toUTCString();
	const suffix = `; expires=${ expires }; path=${ cookiePath || '/' }${
		cookieDomain ? `; domain=${ cookieDomain }` : ''
	}; SameSite=Lax${ window.location.protocol === 'https:' ? '; Secure' : '' }`;

	document.cookie = `comment_author_${ cookieHash }=${ encodeURIComponent( details?.author ?? '' ) }${ suffix }`;
	document.cookie = `comment_author_email_${ cookieHash }=${ encodeURIComponent( details?.email ?? '' ) }${ suffix }`;
	document.cookie = `comment_author_url_${ cookieHash }=${ encodeURIComponent( details?.url ?? '' ) }${ suffix }`;
};
