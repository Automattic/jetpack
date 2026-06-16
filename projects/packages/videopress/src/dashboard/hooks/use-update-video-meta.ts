import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { privacyStringToInt, LIBRARY_ITEM_QUERY_SEGMENT, LIBRARY_QUERY_KEY } from './use-library';
import type { VideoDetailsPatch } from '../types/library';

type ApiPatch = {
	title?: string;
	description?: string;
	caption?: string;
	rating?: string;
	display_embed?: boolean;
	allow_download?: boolean;
	privacy_setting?: 0 | 1 | 2;
};

/**
 * Convert a UI VideoDetailsPatch to the shape expected by the wpcom/v2/videopress/meta endpoint.
 *
 * @param patch - The partial UI-layer patch object with camelCase field names.
 * @return A plain object with snake_case API field names, omitting undefined keys.
 */
export function patchToApi( patch: Partial< VideoDetailsPatch > ): ApiPatch {
	const out: ApiPatch = {};
	if ( patch.title !== undefined ) {
		out.title = patch.title;
	}
	if ( patch.description !== undefined ) {
		out.description = patch.description;
	}
	if ( patch.rating !== undefined ) {
		out.rating = patch.rating;
	}
	if ( patch.privacy !== undefined ) {
		out.privacy_setting = privacyStringToInt( patch.privacy );
	}
	if ( patch.displayEmbed !== undefined ) {
		out.display_embed = patch.displayEmbed;
	}
	if ( patch.allowDownloads !== undefined ) {
		out.allow_download = patch.allowDownloads;
	}
	return out;
}

/**
 * Return a mutation that POSTs video meta updates to wpcom/v2/videopress/meta and
 * invalidates the library cache on success.
 *
 * @return A TanStack Query mutation object with a mutateAsync method.
 */
export function useUpdateVideoMeta() {
	const client = useQueryClient();
	return useMutation< void, Error, { id: number | string; patch: Partial< VideoDetailsPatch > } >( {
		mutationFn: async ( { id, patch } ) => {
			await apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id: Number( id ), ...patchToApi( patch ) },
			} );
		},
		onSuccess: ( _data, { id } ) => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			client.invalidateQueries( {
				queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
			} );
		},
	} );
}
