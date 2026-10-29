/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import { toDetailId } from '../../helpers/detail-id';
import { toPostDetailId } from '../post-title-link';

/** What a row's detail page shows, which decides who may open it. */
export type ViewLiveContent = 'post' | 'video';

/**
 * The URL a row's "View" action opens, when the row gets one.
 *
 * Only a row whose title opens a detail page inside the dashboard needs a second
 * link out to the live content; a title that links out already is the one link.
 * The URL comes straight from report data, so its scheme is checked here, and a
 * wp-admin page is never the live content.
 *
 * @param content - Whether the row's detail page is a post or a video one.
 * @param id      - The row's post, page or video ID.
 * @param link    - The row's public URL, as the report returned it.
 * @return The public URL, or undefined when the row offers no "View" action.
 */
export function toViewLiveUrl(
	content: ViewLiveContent,
	id?: number | string | null,
	link?: string | null
): string | undefined {
	const detailId = content === 'video' ? toDetailId( id ) : toPostDetailId( id );

	if ( detailId === undefined ) {
		return undefined;
	}

	const url = safeHttpUrl( link );

	// `stats/video-plays` sends the media editor as a video's URL (STATS-567).
	if ( url === null || new URL( url ).pathname.includes( '/wp-admin/' ) ) {
		return undefined;
	}

	return url;
}
