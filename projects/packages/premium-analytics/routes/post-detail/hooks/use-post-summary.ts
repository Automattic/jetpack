/**
 * External dependencies
 */
import { useStatsPost, useSiteHomeUrl } from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { POST_URL_SEARCH_PARAM } from '@jetpack-premium-analytics/widgets-toolkit';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useSearch } from '@wordpress/route';

type MediaEntity = {
	source_url?: string;
	media_details?: { sizes?: { thumbnail?: { source_url?: string } } };
};

export type PostSummary = {
	/** Post title for display. */
	title?: string;
	/** Post type slug (e.g. `post`, `page`). */
	type?: string;
	/** Published date as a datetime string, when available. */
	publishedDate?: string;
	/** Featured image URL, when available. */
	imageUrl?: string;
	/** Public URL of the post/page, when available. */
	url?: string;
	/** Whether the underlying stats request is still resolving. */
	isLoading: boolean;
};

/**
 * Resolve the public URL a list surface carried into this route. Kept
 * detailed: this is a security-relevant origin check, not a plain lookup.
 *
 * A `show_in_rest: false` post type has no core-data entity, so list surfaces
 * pass the Stats-report URL through as a search param instead — honoured only
 * for an http(s) URL matching the site's own origin (falling back to the
 * dashboard's own origin when the site URL is unreadable), so a crafted link
 * can't point the header out at another host.
 *
 * @return The carried URL when it is safe to use, otherwise `undefined`.
 */
function useCarriedPostUrl(): string | undefined {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const siteUrl = useSiteHomeUrl();
	const carried = search?.[ POST_URL_SEARCH_PARAM ];

	return useMemo( () => {
		const candidate = safeHttpUrl( carried );
		if ( ! candidate ) {
			return undefined;
		}

		try {
			const allowedOrigin = siteUrl ? new URL( siteUrl ).origin : window.location.origin;
			return new URL( candidate ).origin === allowedOrigin ? candidate : undefined;
		} catch {
			return undefined;
		}
	}, [ carried, siteUrl ] );
}

/**
 * Resolve the header summary for a single post/page. Title, type, and
 * published date come from the Stats `post` payload; the featured image
 * isn't in that payload, so it's read separately from core-data.
 *
 * @param postId - The post/page ID from the route.
 * @return The resolved post summary.
 */
export function usePostSummary( postId: number ): PostSummary {
	// The header only needs the post row, so scope the query to the `post` field
	// instead of pulling the full stats payload.
	const { data, isLoading } = useStatsPost( { postId, fields: [ 'post' ] } );
	const post = data?.post;
	const type = post?.post_type;

	const imageUrl = useSelect(
		select => {
			if ( ! type || ! Number.isInteger( postId ) || postId <= 0 ) {
				return undefined;
			}

			const core = select( coreStore ) as unknown as {
				getEntityRecord: ( kind: string, name: string, key: number ) => unknown;
			};

			const entity = core.getEntityRecord( 'postType', type, postId ) as
				| { featured_media?: number }
				| undefined;
			if ( ! entity?.featured_media ) {
				return undefined;
			}

			const media = core.getEntityRecord( 'postType', 'attachment', entity.featured_media ) as
				| MediaEntity
				| undefined;

			return media?.media_details?.sizes?.thumbnail?.source_url ?? media?.source_url ?? undefined;
		},
		[ postId, type ]
	);

	// Reads the same already-resolved post entity as the image (no extra
	// request); its own selector avoids re-rendering on every store change.
	const url = useSelect(
		select => {
			if ( ! type || ! Number.isInteger( postId ) || postId <= 0 ) {
				return undefined;
			}

			const core = select( coreStore ) as unknown as {
				getEntityRecord: ( kind: string, name: string, key: number ) => unknown;
			};

			const entity = core.getEntityRecord( 'postType', type, postId ) as
				| { link?: string }
				| undefined;

			return entity?.link;
		},
		[ postId, type ]
	);

	const carriedUrl = useCarriedPostUrl();

	return {
		title: post?.post_title,
		type,
		// GMT fallback gets an explicit `Z` suffix so downstream code doesn't
		// mistake it for a site-timezone wall time.
		publishedDate:
			post?.post_date ?? ( post?.post_date_gmt ? `${ post.post_date_gmt }Z` : undefined ),
		imageUrl,
		// The entity permalink is authoritative; the carried URL only covers the
		// post types core data cannot resolve.
		url: url ?? carriedUrl,
		isLoading,
	};
}
