import { decodeEntities } from '@wordpress/html-entities';
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from '../stats/utils';
import type { StatsRecord } from '../stats/types';

type LatestPostRawTitle = {
	rendered?: string;
};

type LatestPostRawMedia = {
	source_url?: string;
	alt_text?: string;
	media_details?: {
		sizes?: Record< string, { source_url?: string } >;
	};
};

export type LatestPostRawItem = {
	id?: number | string;
	title?: LatestPostRawTitle;
	link?: string;
	date?: string;
	featured_media?: number;
	_embedded?: {
		'wp:featuredmedia'?: LatestPostRawMedia[];
	};
};

export type LatestPost = {
	id: number;
	title: string;
	url: string;
	date: string;
	imageUrl: string;
	imageAlt: string;
};

export type LatestPostResponse = LatestPost | null;

// Prefer a display-sized variant, falling back to the full-size source.
const PREFERRED_IMAGE_SIZES = [ 'medium_large', 'large', 'full' ];

function pickFeaturedImageUrl( media: StatsRecord ): string {
	const sizes = coerceStatsRecord( coerceStatsRecord( media.media_details ).sizes );

	for ( const size of PREFERRED_IMAGE_SIZES ) {
		const url = coerceStatsRecord( sizes[ size ] ).source_url;
		if ( typeof url === 'string' && url ) {
			return url;
		}
	}

	return typeof media.source_url === 'string' ? media.source_url : '';
}

/**
 * Reduce a core `/wp/v2/posts` response (an array of posts) to the first post's
 * headline fields and its embedded featured image. Content is read locally so it
 * resolves regardless of site privacy; the post's views, likes, and comments
 * come from the Stats post endpoint. Returns null when the site has no published
 * post.
 *
 * @param response - Raw payload from the core posts endpoint (with `_embed`).
 * @return The normalized latest post, or null when none is present.
 */
export function sanitizeLatestPostResponse( response: unknown ): LatestPostResponse {
	const [ first ] = coerceStatsArray( response );
	if ( ! isStatsRecord( first ) ) {
		return null;
	}

	const post = coerceStatsRecord( first );
	const id = safeParseFloat( post.id );
	if ( id <= 0 ) {
		return null;
	}

	const title = coerceStatsRecord( post.title );
	const media = coerceStatsRecord(
		coerceStatsArray( coerceStatsRecord( post._embedded )[ 'wp:featuredmedia' ] )[ 0 ]
	);

	return {
		id,
		// `title.rendered` from core is HTML (encoded entities); decode for display.
		title: typeof title.rendered === 'string' ? decodeEntities( title.rendered ) : '',
		url: typeof post.link === 'string' ? post.link : '',
		date: typeof post.date === 'string' ? post.date : '',
		imageUrl: pickFeaturedImageUrl( media ),
		imageAlt: typeof media.alt_text === 'string' ? media.alt_text : '',
	};
}
