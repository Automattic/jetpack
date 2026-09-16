/**
 * External dependencies
 */
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';

type PostEntity = {
	id?: number;
	featured_media?: number;
};

type MediaEntity = {
	id?: number;
	source_url?: string;
	media_details?: { sizes?: { thumbnail?: { source_url?: string } } };
};

export type PostThumbnailSource = {
	id?: number | string;
	type?: unknown;
};

export type PostThumbnailUrls = Record< number, string >;

type EntityRecordsSelector = {
	getEntityRecords: (
		kind: string,
		name: string,
		query: Record< string, unknown >
	) => unknown[] | null;
	hasFinishedResolution: ( selectorName: string, args: unknown[] ) => boolean;
};

function getThumbnailUrl( media?: MediaEntity ): string | undefined {
	return media?.media_details?.sizes?.thumbnail?.source_url ?? media?.source_url;
}

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

	return getThumbnailUrl( media );
}

/**
 * Resolve featured-image thumbnails for a visible page of post rows.
 *
 * @param rows - Post rows after filtering, sorting, and pagination.
 * @return Thumbnail URLs keyed by post ID.
 */
export function usePostThumbnails( rows: PostThumbnailSource[] ): PostThumbnailUrls {
	const idsByType = useMemo( () => {
		const grouped = new Map< string, Set< number > >();

		for ( const row of rows ) {
			const id = Number( row.id );
			if (
				typeof row.type !== 'string' ||
				row.type === 'homepage' ||
				! Number.isInteger( id ) ||
				id <= 0
			) {
				continue;
			}

			const ids = grouped.get( row.type ) ?? new Set< number >();
			ids.add( id );
			grouped.set( row.type, ids );
		}

		return Array.from( grouped, ( [ type, ids ] ) => ( {
			type,
			ids: Array.from( ids ).sort( ( a, b ) => a - b ),
		} ) );
	}, [ rows ] );

	const postRecords = useSelect(
		select => {
			const core = select( coreStore ) as unknown as EntityRecordsSelector;
			let hasResolved = true;

			const records = idsByType.flatMap( ( { type, ids } ) => {
				const query = {
					include: ids,
					per_page: ids.length,
					_fields: 'id,featured_media',
				};
				const items = core.getEntityRecords( 'postType', type, query );
				hasResolved =
					core.hasFinishedResolution( 'getEntityRecords', [ 'postType', type, query ] ) &&
					hasResolved;

				return ( items ?? [] ) as PostEntity[];
			} );

			return { records, hasResolved };
		},
		[ idsByType ]
	);

	const mediaIds = useMemo(
		() =>
			postRecords.hasResolved
				? Array.from(
						new Set(
							postRecords.records
								.map( post => post.featured_media )
								.filter( ( id ): id is number => typeof id === 'number' && id > 0 )
						)
				  ).sort( ( a, b ) => a - b )
				: [],
		[ postRecords ]
	);

	const media = useSelect(
		select => {
			if ( ! mediaIds.length ) {
				return [];
			}

			const core = select( coreStore ) as unknown as EntityRecordsSelector;
			return ( core.getEntityRecords( 'postType', 'attachment', {
				include: mediaIds,
				per_page: mediaIds.length,
				_fields: 'id,source_url,media_details',
			} ) ?? [] ) as MediaEntity[];
		},
		[ mediaIds ]
	);

	return useMemo( () => {
		const mediaById = new Map( media.map( item => [ item.id, item ] ) );

		return postRecords.records.reduce< PostThumbnailUrls >( ( urls, post ) => {
			const url = getThumbnailUrl( mediaById.get( post.featured_media ) );
			if ( post.id && url ) {
				urls[ post.id ] = url;
			}
			return urls;
		}, {} );
	}, [ postRecords.records, media ] );
}
