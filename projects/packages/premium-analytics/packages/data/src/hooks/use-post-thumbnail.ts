/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from 'react';

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
};

// Each query covers a run of this many rows, so rows mounted below add queries instead of changing
// the ones core-data already resolved. WP REST rejects a `per_page` above 100.
const ROWS_PER_QUERY = 50;

function sortedIds( ids: Iterable< number > ): number[] {
	return Array.from( new Set( ids ) ).sort( ( a, b ) => a - b );
}

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
 * Resolve featured-image thumbnails for the post rows a table shows.
 *
 * @param rows - Post rows after filtering and sorting.
 * @return Thumbnail URLs keyed by post ID.
 */
export function usePostThumbnails( rows: PostThumbnailSource[] ): PostThumbnailUrls {
	const postQueries = useMemo( () => {
		const queries: { type: string; query: Record< string, unknown > }[] = [];

		for ( let start = 0; start < rows.length; start += ROWS_PER_QUERY ) {
			const grouped = new Map< string, number[] >();

			for ( const row of rows.slice( start, start + ROWS_PER_QUERY ) ) {
				const id = Number( row.id );
				if (
					typeof row.type !== 'string' ||
					row.type === 'homepage' ||
					! Number.isInteger( id ) ||
					id <= 0
				) {
					continue;
				}

				grouped.set( row.type, [ ...( grouped.get( row.type ) ?? [] ), id ] );
			}

			// Sorted, so a run whose rows trade places keeps its query.
			for ( const [ type, ids ] of grouped ) {
				const include = sortedIds( ids );
				queries.push( {
					type,
					query: {
						include,
						per_page: include.length,
						context: 'view',
						_fields: 'id,featured_media',
					},
				} );
			}
		}

		return queries;
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

	const postRecords = useMemo(
		() => postRecordGroups.flatMap( records => records ?? [] ),
		[ postRecordGroups ]
	);

	// One media query per resolved post query, so it too stays put as rows are added.
	const mediaIdBatches = useMemo(
		() =>
			postRecordGroups.flatMap( records => {
				const include = sortedIds(
					( records ?? [] )
						.map( post => post.featured_media )
						.filter( ( id ): id is number => typeof id === 'number' && id > 0 )
				);
				return include.length ? [ include ] : [];
			} ),
		[ postRecordGroups ]
	);

	const mediaGroups = useSelect(
		select => {
			const core = select( coreStore ) as unknown as EntityRecordsSelector;

			return mediaIdBatches.map(
				include =>
					core.getEntityRecords( 'postType', 'attachment', {
						include,
						per_page: include.length,
						context: 'view',
						_fields: 'id,source_url,media_details',
					} ) as MediaEntity[] | null
			);
		},
		[ mediaIdBatches ]
	);

	const media = useMemo( () => mediaGroups.flatMap( records => records ?? [] ), [ mediaGroups ] );

	const resolvedUrls = useMemo( () => {
		const mediaById = new Map( media.map( item => [ item.id, item ] ) );

		return postRecords.reduce< PostThumbnailUrls >( ( urls, post ) => {
			const url = getThumbnailUrl( mediaById.get( post.featured_media ) );
			if ( post.id && url ) {
				urls[ post.id ] = url;
			}
			return urls;
		}, {} );
	}, [ postRecords, media ] );

	// A grown or re-sorted row list is a new query that resolves empty first; keep the URLs already
	// shown meanwhile, so thumbnails do not blink back to their placeholder.
	const [ shownUrls, setShownUrls ] = useState( resolvedUrls );
	const hasNewUrl = Object.entries( resolvedUrls ).some(
		( [ id, url ] ) => shownUrls[ Number( id ) ] !== url
	);
	if ( hasNewUrl ) {
		const urls = { ...shownUrls, ...resolvedUrls };
		setShownUrls( urls );
		return urls;
	}

	return shownUrls;
}
