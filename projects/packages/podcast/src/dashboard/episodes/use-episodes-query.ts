import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
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

const fetchEpisodes = async ( args: EpisodesQueryArgs ): Promise< EpisodesPage > => {
	const {
		categoryId,
		page = 1,
		perPage = 20,
		orderBy = 'date',
		order = 'desc',
		search = '',
		status = 'any',
	} = args;

	const query: Record< string, string | number > = {
		categories: categoryId,
		page,
		per_page: perPage,
		orderby: orderBy,
		order,
		_embed: 'wp:featuredmedia',
	};
	if ( search ) {
		query.search = search;
	}
	if ( status ) {
		query.status = status;
	}

	const response = ( await apiFetch( {
		path: addQueryArgs( '/wp/v2/posts', query ),
		method: 'GET',
		parse: false,
	} ) ) as Response;

	const episodes = ( await response.json() ) as Episode[];
	const total = parseInt( response.headers.get( 'X-WP-Total' ) || '0', 10 );
	const totalPages = parseInt( response.headers.get( 'X-WP-TotalPages' ) || '1', 10 );

	return { episodes, total, totalPages };
};

/**
 * Read a page of podcast episodes; keeps the previous page visible during
 * pagination so the table doesn't flash empty.
 *
 * @param args - Pagination, sort, search, and status filter args.
 * @return      Query result with `data.episodes` and pagination metadata.
 */
export function useEpisodesQuery( args: EpisodesQueryArgs ) {
	return useQuery< EpisodesPage >( {
		queryKey: [ 'jetpack-podcast', 'episodes', args ],
		queryFn: () => fetchEpisodes( args ),
		enabled: args.categoryId > 0,
		placeholderData: keepPreviousData,
	} );
}
