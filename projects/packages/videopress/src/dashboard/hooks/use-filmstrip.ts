import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { Storyboard } from '../types/edits';

export const FILMSTRIP_QUERY_KEY = 'vp-filmstrip';
export type FilmstripState =
	{ status: 'storyboard'; storyboard: Storyboard } | { status: 'loading' | 'unavailable' };

/**
 * Validate the sprite geometry before using it for layout.
 *
 * @param value - Storyboard endpoint response.
 * @return Whether the response describes a usable sprite.
 */
export function isStoryboard( value: unknown ): value is Storyboard {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}
	const descriptor = value as Storyboard;
	return (
		typeof descriptor.url === 'string' &&
		/^https?:\/\//.test( descriptor.url ) &&
		[
			descriptor.tile_width,
			descriptor.tile_height,
			descriptor.tiles,
			descriptor.columns,
			descriptor.interval_ms,
		].every( number => Number.isSafeInteger( number ) && number > 0 ) &&
		( descriptor.rows === undefined ||
			( Number.isSafeInteger( descriptor.rows ) &&
				descriptor.rows >= Math.ceil( descriptor.tiles / descriptor.columns ) ) )
	);
}

/**
 * Fetch the original video's storyboard independently of timeline zoom.
 *
 * @param guid - VideoPress identifier.
 * @return The storyboard or a neutral-track state.
 */
export default function useFilmstrip( guid: string ): FilmstripState {
	const query = useQuery( {
		queryKey: [ FILMSTRIP_QUERY_KEY, guid ],
		enabled: Boolean( guid ),
		staleTime: 5 * 60 * 1000,
		retry: false,
		queryFn: async ( { signal } ) => {
			const response = await apiFetch< unknown >( {
				path: `/wpcom/v2/videopress/${ encodeURIComponent( guid ) }/storyboard`,
				signal,
			} );
			return isStoryboard( response ) ? response : null;
		},
	} );
	if ( query.data ) {
		return { status: 'storyboard', storyboard: query.data };
	}
	return { status: query.isPending ? 'loading' : 'unavailable' };
}
