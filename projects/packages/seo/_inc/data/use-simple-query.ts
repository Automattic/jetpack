/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { WP_Error } from './types';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

type QueryParams< T > = {
	name: string;
	query: APIFetchOptions< true >;
	options?: Pick< UseQueryOptions< T, WP_Error >, 'enabled' | 'gcTime' | 'refetchOnMount' >;
};

/**
 * Thin TanStack Query wrapper for wp-api GET requests. Keeps the Overview,
 * Content, and Discoverability screens free of repetitive fetching boilerplate.
 */
const useSimpleQuery = < T >( { name, query, options }: QueryParams< T > ) =>
	useQuery< T, WP_Error >( {
		queryKey: [ name, query ],
		queryFn: () => apiFetch< T >( query ),
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
		...options,
	} );

export default useSimpleQuery;
