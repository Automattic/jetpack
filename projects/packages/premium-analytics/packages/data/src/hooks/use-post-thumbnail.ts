/**
 * External dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';

type PostEntity = {
	featured_media?: number;
};

type MediaEntity = {
	source_url?: string;
	media_details?: { sizes?: { thumbnail?: { source_url?: string } } };
};

/**
 * Resolve a post's featured-image thumbnail from core data.
 *
 * @param postId   - Post ID.
 * @param postType - Post type slug.
 * @return The thumbnail URL, falling back to the full-size source.
 */
export function usePostThumbnail(
	postId?: number | string,
	postType?: string
): string | undefined {
	const numericPostId = Number( postId );
	const canResolvePost = Boolean(
		postType && Number.isInteger( numericPostId ) && numericPostId > 0
	);
	const { record: post } = useEntityRecord< PostEntity >(
		'postType',
		postType ?? '',
		numericPostId,
		{ enabled: canResolvePost }
	);
	const mediaId = post?.featured_media ?? 0;
	const { record: media } = useEntityRecord< MediaEntity >( 'postType', 'attachment', mediaId, {
		enabled: canResolvePost && mediaId > 0,
	} );

	return media?.media_details?.sizes?.thumbnail?.source_url ?? media?.source_url;
}
