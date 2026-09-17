/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
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
	getEntityRecord: (
		kind: string,
		name: string,
		key: number,
		query: Record< string, unknown >
	) => unknown;
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
	const post = useSelect(
		select => {
			if ( ! canResolvePost ) {
				return undefined;
			}

			const core = select( coreStore ) as unknown as EntityRecordsSelector;
			return core.getEntityRecord( 'postType', postType ?? '', numericPostId, {
				context: 'view',
			} ) as PostEntity | undefined;
		},
		[ canResolvePost, numericPostId, postType ]
	);
	const mediaId = post?.featured_media ?? 0;
	const media = useSelect(
		select => {
			if ( ! canResolvePost || mediaId <= 0 ) {
				return undefined;
			}

			const core = select( coreStore ) as unknown as EntityRecordsSelector;
			return core.getEntityRecord( 'postType', 'attachment', mediaId, {
				context: 'view',
			} ) as MediaEntity | undefined;
		},
		[ canResolvePost, mediaId ]
	);

	return getThumbnailUrl( media );
}

/**
 * Resolve featured-image thumbnails for a visible page of post rows.
 *
 * @param rows - Post rows after filtering, sorting, and pagination.
 * @return Thumbnail URLs keyed by post ID.
 */
export function usePostThumbnails( rows: PostThumbnailSource[] ): PostThumbnailUrls {
	const postQueries = useMemo( () => {
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
			query: {
				include: Array.from( ids ).sort( ( a, b ) => a - b ),
				per_page: ids.size,
				context: 'view',
				_fields: 'id,featured_media',
			},
		} ) );
	}, [ rows ] );

	const postRecordGroups = useSelect(
		select => {
			const core = select( coreStore ) as unknown as EntityRecordsSelector;

			return postQueries.map(
				( { type, query } ) =>
					core.getEntityRecords( 'postType', type, query ) as PostEntity[] | null
			);
		},
		[ postQueries ]
	);

	const havePostQueriesResolved = useSelect(
		select => {
			const core = select( coreStore ) as unknown as EntityRecordsSelector;
			return postQueries.every( ( { type, query } ) =>
				core.hasFinishedResolution( 'getEntityRecords', [ 'postType', type, query ] )
			);
		},
		[ postQueries ]
	);

	const postRecords = useMemo(
		() => postRecordGroups.flatMap( records => records ?? [] ),
		[ postRecordGroups ]
	);

	const mediaIds = useMemo(
		() =>
			havePostQueriesResolved
				? Array.from(
						new Set(
							postRecords
								.map( post => post.featured_media )
								.filter( ( id ): id is number => typeof id === 'number' && id > 0 )
						)
				  ).sort( ( a, b ) => a - b )
				: [],
		[ havePostQueriesResolved, postRecords ]
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
				context: 'view',
				_fields: 'id,source_url,media_details',
			} ) ?? [] ) as MediaEntity[];
		},
		[ mediaIds ]
	);

	return useMemo( () => {
		const mediaById = new Map( media.map( item => [ item.id, item ] ) );

		return postRecords.reduce< PostThumbnailUrls >( ( urls, post ) => {
			const url = getThumbnailUrl( mediaById.get( post.featured_media ) );
			if ( post.id && url ) {
				urls[ post.id ] = url;
			}
			return urls;
		}, {} );
	}, [ postRecords, media ] );
}
