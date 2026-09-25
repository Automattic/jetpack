/**
 * Resolves a facade's poster in the browser when the server rendered none.
 *
 * PHP only knows the block's poster, the local attachment and the anonymous video
 * lookup, so private videos and videos unknown to anonymous callers reach the page
 * without one. This asks the API the way the player does: anonymously first, then
 * with the playback token the token bridge hands out.
 */

import getMediaToken from '../get-media-token';

export const VIDEO_INFO_URL = 'https://public-api.wordpress.com/rest/v1.1/videos/';

type VideoInfo = { poster?: string | null; is_private?: boolean; error?: string };

const resolving = new Map< string, Promise< string | null > >();

const withToken = ( url: string, token: string ) =>
	url + ( url.includes( '?' ) ? '&' : '?' ) + 'metadata_token=' + encodeURIComponent( token );

/**
 * Fetch a video's info; any transport, HTTP or API error yields null.
 *
 * @param guid  - The video GUID.
 * @param token - A playback token, for private videos.
 * @return The info, or null.
 */
async function fetchInfo( guid: string, token?: string ): Promise< VideoInfo | null > {
	const url = VIDEO_INFO_URL + encodeURIComponent( guid );
	try {
		const response = await fetch( token ? withToken( url, token ) : url, {
			credentials: 'omit',
		} );
		if ( ! response.ok ) {
			return null;
		}
		const info = ( await response.json() ) as VideoInfo;
		return info && typeof info === 'object' && ! info.error ? info : null;
	} catch {
		return null;
	}
}

/**
 * Ask for the playback token the player itself would use for this video.
 *
 * @param guid - The video GUID.
 * @return The token, or null when the site does not hand one out.
 */
async function getPlaybackToken( guid: string ): Promise< string | null > {
	try {
		const { token } = await getMediaToken( 'playback', {
			guid,
			id: Number( window.videopressAjax?.post_id ) || 0,
		} );
		return token || null;
	} catch {
		return null;
	}
}

/**
 * Resolve the poster URL, anonymously first, then with a playback token.
 *
 * @param guid - The video GUID.
 * @return A poster URL the browser can load, or null.
 */
async function lookUpPoster( guid: string ): Promise< string | null > {
	const open = await fetchInfo( guid );
	if ( open?.poster && ! open.is_private ) {
		return open.poster;
	}

	const token = await getPlaybackToken( guid );
	if ( token ) {
		const info = await fetchInfo( guid, token );
		if ( info?.poster ) {
			return withToken( info.poster, token );
		}
	}

	return open?.poster || null;
}

/**
 * Resolve a video's poster, sharing one lookup between every facade of the same video.
 *
 * @param guid - The video GUID.
 * @return A poster URL, or null when none can be had.
 */
export function resolvePoster( guid: string ): Promise< string | null > {
	let pending = resolving.get( guid );
	if ( ! pending ) {
		pending = lookUpPoster( guid ).then( poster => {
			// A miss is not worth remembering: a later facade may try again.
			if ( ! poster ) {
				resolving.delete( guid );
			}
			return poster;
		} );
		resolving.set( guid, pending );
	}
	return pending;
}
