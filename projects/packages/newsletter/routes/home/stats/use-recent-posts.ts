import { getSiteData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { dateI18n } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';

/** How many posts the Dashboard previews before "View all". */
const RECENT_POSTS_SHOWN = 5;

/** A row of the Recent Posts table. */
export type RecentPost = {
	id: number;
	title: string;
	/** Already formatted for display; empty for a draft, which has no publish date. */
	date: string;
	status: 'publish' | 'draft';
	/** Undefined when the post has no featured image. */
	thumbnail?: string;
	/** Null where the post was never emailed, or the figures are unavailable. */
	recipients: number | null;
	openRate: number | null;
	clickRate: number | null;
};

/**
 * A post as `wp/v2/posts` returns it, narrowed to the fields the table reads.
 *
 * `_embed=wp:featuredmedia` is what carries the thumbnail; the narrow form is
 * used rather than a bare `_embed` so the response doesn't also drag in authors
 * and terms the table never shows.
 */
type WpPost = {
	id: number;
	date: string;
	status: string;
	title: { rendered: string };
	content?: { rendered?: string };
	_embedded?: {
		'wp:featuredmedia'?: Array< {
			source_url?: string;
			media_details?: { sizes?: Record< string, { source_url?: string } > };
		} >;
	};
};

/** One row of the Stats module's per-post email summary. */
type EmailStatsRow = {
	id: number;
	total_sends?: number;
	opens_rate?: number;
	clicks_rate?: number;
};

/**
 * The smallest usable size of the post's featured image.
 *
 * @param post - The post as returned by the REST API.
 * @return Image URL, or undefined when the post has no featured image.
 */
function getFeaturedImage( post: WpPost ): string | undefined {
	const media = post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
	const sizes = media?.media_details?.sizes;

	return sizes?.thumbnail?.source_url ?? sizes?.medium?.source_url ?? media?.source_url;
}

/**
 * The first image in the post body.
 *
 * Parsed rather than pattern-matched: `DOMParser` builds a detached document, so
 * nothing in the markup executes and no resources are fetched, which makes it
 * safe to run over post content — and it does not fall over on the attribute
 * ordering and stray markup a regex would.
 *
 * Deliberately `src` and not the smallest `srcset` candidate. That would be
 * lighter for a 40px box, but `srcset` is rewritten by plugins and CDNs and can
 * carry a different host from `src` — on a tunnelled dev site it points at
 * `http://localhost`, which an https page refuses as mixed content. `src` is the
 * one URL that is always the canonical one.
 *
 * @param post - The post as returned by the REST API.
 * @return Image URL, or undefined when the body has no image.
 */
function getFirstContentImage( post: WpPost ): string | undefined {
	const html = post.content?.rendered;

	if ( ! html ) {
		return undefined;
	}

	return (
		new DOMParser()
			.parseFromString( html, 'text/html' )
			.querySelector( 'img' )
			?.getAttribute( 'src' ) ?? undefined
	);
}

/**
 * A thumbnail for the post: its featured image, else the first image in the
 * body.
 *
 * Most newsletter posts carry an image without anyone having set a featured one,
 * so falling back to the body keeps the column from being mostly empty.
 *
 * @param post - The post as returned by the REST API.
 * @return Image URL, or undefined when the post has no image at all.
 */
function getThumbnail( post: WpPost ): string | undefined {
	return getFeaturedImage( post ) ?? getFirstContentImage( post );
}

/**
 * The most recent posts, published or draft.
 *
 * @return The posts, newest first.
 */
async function fetchRecentPosts(): Promise< WpPost[] > {
	return apiFetch< WpPost[] >( {
		path: `/wp/v2/posts?per_page=${ RECENT_POSTS_SHOWN }&status=publish,draft&orderby=date&order=desc&_embed=wp%3Afeaturedmedia`,
	} );
}

/**
 * Per-post email performance, keyed by post id.
 *
 * This comes from the Jetpack plugin's Stats module rather than from anything
 * this package owns, and it needs a WP.com connection — so it is treated as
 * optional throughout: any failure resolves to an empty map and the table shows
 * blanks rather than an error. A site with Stats switched off, no connection, or
 * simply no sends yet is a normal state here, not a fault.
 *
 * `quantity` is clamped to 1–30 server side, which is well above what the table
 * shows.
 *
 * @return Map of post id to its email figures; empty when unavailable.
 */
async function fetchEmailStats(): Promise< Record< number, EmailStatsRow > > {
	const blogId = getSiteData()?.wpcom?.blog_id;

	// Defaults to 0 on a disconnected site, where the route cannot answer.
	if ( ! blogId ) {
		return {};
	}

	try {
		const response = await apiFetch< { posts?: EmailStatsRow[] } >( {
			path:
				`/jetpack/v4/stats-app/sites/${ blogId }/stats/emails/summary` +
				`?period=alltime&quantity=${ RECENT_POSTS_SHOWN }&sort_field=post_date&sort_order=desc`,
		} );

		return Object.fromEntries( ( response?.posts ?? [] ).map( row => [ row.id, row ] ) );
	} catch {
		return {};
	}
}

type State = {
	posts: RecentPost[];
	isLoading: boolean;
};

/**
 * The Recent Posts table's data.
 *
 * Two independent requests joined on post id: the posts themselves from core,
 * which always works, and their email performance from the Stats module, which
 * may not. A post with no matching stats row — never emailed, or stats
 * unavailable — keeps nulls, which the table renders as em dashes exactly the
 * way it already does for a draft.
 *
 * @return The rows and whether the posts are still loading.
 */
export function useRecentPosts(): State {
	const postsQuery = useQuery< WpPost[], Error >( {
		queryKey: [ 'newsletter-recent-posts' ],
		queryFn: fetchRecentPosts,
	} );

	const statsQuery = useQuery< Record< number, EmailStatsRow >, Error >( {
		queryKey: [ 'newsletter-post-email-stats' ],
		queryFn: fetchEmailStats,
	} );

	const stats = statsQuery.data ?? {};

	// Guarded rather than trusted: anything but a list here — an error shape, a
	// filtered response — would otherwise take the whole Dashboard down.
	const rows = Array.isArray( postsQuery.data ) ? postsQuery.data : [];

	const posts: RecentPost[] = rows.map( post => {
		const row = stats[ post.id ];

		return {
			id: post.id,
			title: decodeEntities( post.title?.rendered ?? '' ),
			// Drafts have no meaningful publish date to show. Formatted here, in the
			// site's own date format, so the table stays presentational.
			date:
				post.status === 'draft'
					? ''
					: dateI18n( getSiteData()?.date_format ?? 'M j, Y', post.date ),
			status: post.status === 'draft' ? 'draft' : 'publish',
			thumbnail: getThumbnail( post ),
			recipients: row?.total_sends ?? null,
			openRate: row?.opens_rate ?? null,
			clickRate: row?.clicks_rate ?? null,
		};
	} );

	// Only the posts gate the table. The stats request is allowed to be slow or
	// to fail without holding the rows back.
	return { posts, isLoading: postsQuery.isLoading };
}
