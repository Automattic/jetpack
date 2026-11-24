import { useEntityRecords } from '@wordpress/core-data';
import { useMemo, useRef } from '@wordpress/element';
import type { Episode } from '../types';

export interface EpisodesQueryArgs {
	categoryId: number;
	page?: number;
	perPage?: number;
	orderBy?: 'date' | 'title';
	order?: 'asc' | 'desc';
	search?: string;
	status?: string;
}

export interface EpisodesPage {
	episodes: Episode[];
	totalPages: number;
	total: number;
}

/**
 * Read a page of podcast episodes via core-data's post-type entity.
 *
 * Holds onto the previous page during pagination so DataViews doesn't flash
 * empty between fetches.
 *
 * @param args - Pagination, sort, search, and status filter args.
 * @return      `{ data, isLoading }` matching the prior TanStack-shaped contract.
 */
export function useEpisodesQuery( args: EpisodesQueryArgs ): {
	data: EpisodesPage | undefined;
	isLoading: boolean;
} {
	const query = useMemo(
		() => ( {
			categories: args.categoryId,
			page: args.page ?? 1,
			per_page: args.perPage ?? 20,
			orderby: args.orderBy ?? 'date',
			order: args.order ?? 'desc',
			_embed: 'wp:featuredmedia',
			...( args.search ? { search: args.search } : {} ),
			...( args.status ? { status: args.status } : {} ),
		} ),
		[ args.categoryId, args.page, args.perPage, args.orderBy, args.order, args.search, args.status ]
	);

	const { records, hasResolved, totalItems, totalPages } = useEntityRecords< Episode >(
		'postType',
		'post',
		query
	);

	// Cache the last resolved page so the table doesn't flash empty during
	// page changes (core-data nulls `records` while the next fetch is in flight).
	const previousRef = useRef< EpisodesPage | undefined >( undefined );

	const data = useMemo< EpisodesPage | undefined >( () => {
		if ( records ) {
			previousRef.current = {
				episodes: records,
				total: totalItems ?? 0,
				totalPages: totalPages ?? 0,
			};
			return previousRef.current;
		}
		return previousRef.current;
	}, [ records, totalItems, totalPages ] );

	return { data, isLoading: ! hasResolved && ! previousRef.current };
}
