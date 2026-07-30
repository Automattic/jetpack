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
 * Resolve the public URL a list surface carried into this route.
 *
 * A public post type that sets `show_in_rest: false` has no core-data entity
 * config, so the permalink lookup below can never resolve it. The Stats report
 * does hold a URL for those rows, so the list surfaces pass it through the
 * route as a search param.
 *
 * That param comes from the address bar, so it is only honoured for an http(s)
 * URL on the site's own origin. Otherwise a crafted dashboard link could point
 * the header's link out at any host. The site URL needs `manage_options`, so
 * where it is unreadable the origin serving the dashboard stands in for it —
 * that is the site itself on a self-hosted install. A URL that passes neither
 * check resolves to `undefined`, and the header simply offers no link out.
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
 * Resolve the header summary for a single post/page.
 *
 * Title, type, and published date come straight from the Stats `post` payload
 * (the raw post row). The featured image isn't part of that payload, so it's
 * read from the site's own post entity via `@wordpress/core-data`, degrading
 * gracefully to `undefined` when the record or the featured media is missing.
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

	// The public URL is not part of the Stats payload, so it comes from the same
	// post entity the featured image is read from — already resolved, so this
	// adds no request. Kept as its own selector so the mapped value stays a
	// primitive and cannot re-render the header on every store change.
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
		publishedDate: post?.post_date_gmt ?? post?.post_date,
		imageUrl,
		// The entity permalink is authoritative; the carried URL only covers the
		// post types core data cannot resolve.
		url: url ?? carriedUrl,
		isLoading,
	};
}
