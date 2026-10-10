import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useRef } from 'react';
import { nextProcessingPoll, PROCESSING_POLL_SLOW_INTERVAL_MS } from './use-library';
import type { ProcessingPollAnchor } from './use-library';
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
 * @param guid    - VideoPress identifier.
 * @param enabled - Wait for video processing before requesting thumbnails.
 * @return The storyboard or a neutral-track state.
 */
export default function useFilmstrip( guid: string, enabled = true ): FilmstripState {
	const waitingSince = useRef< ProcessingPollAnchor | null >( null );
	const query = useQuery< Storyboard | null >( {
		queryKey: [ FILMSTRIP_QUERY_KEY, guid ],
		enabled: enabled && Boolean( guid ),
		staleTime: q => ( q.state.data ? 5 * 60 * 1000 : 0 ),
		refetchInterval: q => {
			const { anchor } = nextProcessingPoll(
				waitingSince.current,
				enabled &&
					! q.state.data &&
					( ! q.state.error ||
						( q.state.error as { code?: string } ).code === 'storyboard_unavailable' )
					? [ guid ]
					: [],
				Date.now()
			);
			waitingSince.current = anchor;
			// The thumbnail job can finish after the playable renditions; allow two more minutes.
			return anchor && Date.now() - anchor.startedAt < 2 * 60 * 1000
				? PROCESSING_POLL_SLOW_INTERVAL_MS
				: false;
		},
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
