import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z } from 'zod';

declare global {
	const jetpack_boost_ds:
		| {
				cornerstone_pages_list?: { value?: unknown; nonce?: string };
				cornerstone_pages_properties?: { value?: unknown; nonce?: string };
				modules_state?: { value?: unknown; nonce?: string };
				performance_history?: { value?: unknown; nonce?: string };
		  }
		| undefined;
}

const pagesListSchema = z.array( z.string() );
const propertiesSchema = z.object( {
	max_pages: z.number(),
	max_pages_premium: z.number(),
	default_pages: z.array( z.string() ),
	predefined_pages: z.array( z.string() ),
} );

const listWireSchema = z.object( { JSON: pagesListSchema } );
const propertiesWireSchema = z.object( { JSON: propertiesSchema } );

export type CornerstonePagesList = z.infer< typeof pagesListSchema >;
export type CornerstonePagesProperties = z.infer< typeof propertiesSchema >;

const LIST_QUERY_KEY = [ 'jetpack_boost_cornerstone_pages_list' ] as const;
const PROPERTIES_QUERY_KEY = [ 'jetpack_boost_cornerstone_pages_properties' ] as const;

const LIST_READ_PATH = '/jetpack-boost-ds/cornerstone-pages-list';
const LIST_WRITE_PATH = '/jetpack-boost-ds/cornerstone-pages-list/set';
const PROPERTIES_READ_PATH = '/jetpack-boost-ds/cornerstone-pages-properties';

/**
 * Reads the user-managed cornerstone-pages URL list via the data-sync
 * REST surface.
 *
 * @return React Query state for the cornerstone-pages list.
 */
export function useCornerstonePagesList() {
	return useQuery( {
		queryKey: LIST_QUERY_KEY,
		queryFn: async (): Promise< CornerstonePagesList > => {
			const nonce = jetpack_boost_ds?.cornerstone_pages_list?.nonce ?? '';
			const raw = await apiFetch( {
				path: LIST_READ_PATH,
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': nonce },
			} );
			const parsed = listWireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				return [];
			}
			return parsed.data.JSON ?? [];
		},
		staleTime: 12 * 60 * 60 * 1000,
	} );
}

/**
 * Mutation that replaces the cornerstone-pages URL list. Optimistically
 * updates the cache so the textarea reflects the new value while the
 * request is in flight, then invalidates on settle to re-sync.
 *
 * @return The TanStack `useMutation` handle.
 */
export function useSetCornerstonePagesList() {
	const client = useQueryClient();
	return useMutation( {
		mutationFn: async ( next: CornerstonePagesList ): Promise< CornerstonePagesList > => {
			const nonce = jetpack_boost_ds?.cornerstone_pages_list?.nonce ?? '';
			const raw = await apiFetch( {
				path: LIST_WRITE_PATH,
				method: 'POST',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': nonce },
				data: { JSON: next },
			} );
			const parsed = listWireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				throw new Error( 'Invalid cornerstone_pages_list response' );
			}
			return parsed.data.JSON ?? [];
		},
		onMutate: async next => {
			await client.cancelQueries( { queryKey: LIST_QUERY_KEY } );
			const prev = client.getQueryData< CornerstonePagesList >( LIST_QUERY_KEY );
			client.setQueryData< CornerstonePagesList >( LIST_QUERY_KEY, next );
			return { prev };
		},
		onError: ( _err, _next, ctx ) => {
			if ( ctx && 'prev' in ctx ) {
				client.setQueryData< CornerstonePagesList >( LIST_QUERY_KEY, ctx.prev );
			}
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: LIST_QUERY_KEY } );
		},
	} );
}

/**
 * Reads cornerstone-pages plan/feature properties (max page count,
 * default pages, predefined pages) via the data-sync REST surface.
 *
 * @return React Query state for the properties payload.
 */
export function useCornerstonePagesProperties() {
	return useQuery( {
		queryKey: PROPERTIES_QUERY_KEY,
		queryFn: async (): Promise< CornerstonePagesProperties | null > => {
			const nonce = jetpack_boost_ds?.cornerstone_pages_properties?.nonce ?? '';
			const raw = await apiFetch( {
				path: PROPERTIES_READ_PATH,
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': nonce },
			} );
			const parsed = propertiesWireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				return null;
			}
			return parsed.data.JSON;
		},
		staleTime: 12 * 60 * 60 * 1000,
	} );
}
