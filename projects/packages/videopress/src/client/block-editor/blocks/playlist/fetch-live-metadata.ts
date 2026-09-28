/**
 * Internal dependencies
 */
import getMediaToken from '../../../lib/get-media-token';
import { withMetadataToken } from './utils';

export type LiveVideoMetadata = {
	title?: string;
	poster?: string;
};

/**
 * Fetch a video's live display metadata from the public videos API.
 *
 * The first lookup is anonymous. When it is denied — a private video — and the
 * page carries the token bridge configuration (enqueued whenever the block
 * renders), the lookup is retried with a playback token so authorized viewers
 * still get live metadata. 'locked' means the video is private and could not be
 * authorized for this viewer; null means the data is unreachable (network
 * failure, deleted video) and the entry just keeps its server-rendered
 * fallback.
 *
 * @param guid - The video GUID.
 * @return The metadata, 'locked', or null.
 */
export async function fetchLiveMetadata(
	guid: string
): Promise< LiveVideoMetadata | 'locked' | null > {
	const endpoint = `https://public-api.wordpress.com/rest/v1.1/videos/${ encodeURIComponent(
		guid
	) }`;

	try {
		const response = await fetch( endpoint );
		if ( response.ok ) {
			return ( await response.json() ) as LiveVideoMetadata;
		}
		if ( response.status !== 401 && response.status !== 403 ) {
			return null;
		}
	} catch {
		// Network failure: a token retry would not fare better.
		return null;
	}

	if ( ! window.videopressAjax ) {
		return 'locked';
	}

	try {
		const postId = Number( window.videopressAjax.post_id ) || 0;
		const { token } = await getMediaToken( 'playback', { guid, id: postId } );
		if ( ! token ) {
			return 'locked';
		}

		const response = await fetch( `${ endpoint }?metadata_token=${ encodeURIComponent( token ) }` );
		if ( ! response.ok ) {
			return 'locked';
		}
		const metadata = ( await response.json() ) as LiveVideoMetadata;

		// The API returns the private poster's bare file URL, which the file host
		// refuses without a token — sign it with the same one.
		if ( typeof metadata.poster === 'string' && metadata.poster ) {
			return { ...metadata, poster: withMetadataToken( metadata.poster, token ) };
		}
		return metadata;
	} catch {
		return null;
	}
}
