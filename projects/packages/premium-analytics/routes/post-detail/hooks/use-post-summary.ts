/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

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
	/** Whether the underlying stats request is still resolving. */
	isLoading: boolean;
};

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

	return {
		title: post?.post_title,
		type,
		publishedDate: post?.post_date_gmt ?? post?.post_date,
		imageUrl,
		isLoading,
	};
}
