/**
 * External dependencies
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { fetchCaptionTracks } from '../../lib/video-tracks/caption-tracks';
import { cancelQueryThenSetData } from './query-client';
/**
 * Types
 */
import type { SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { Dispatch, SetStateAction } from 'react';

type UseCaptionTracksArgs = {
	guid: string;
	isOpen: boolean;
	onError?: () => void;
};

type UseCaptionTracksResult = {
	captionTracks: SavedCaptionTrack[];
	setCaptionTracks: Dispatch< SetStateAction< SavedCaptionTrack[] > >;
	isLoadingCaptionTracks: boolean;
};

const EMPTY_CAPTION_TRACKS: SavedCaptionTrack[] = [];

const getCaptionTracksQueryKey = ( guid: string ) => [ 'videopress', 'caption-tracks', guid ];

/**
 * Loads and owns the locally stored caption-track drafts for a video.
 *
 * Backed by a react-query cache keyed by GUID. Mutations write the cache
 * optimistically via `setCaptionTracks`, which cancels any in-flight fetch so
 * a stale response can't overwrite the optimistic list.
 *
 * @param args         - Hook arguments.
 * @param args.guid    - VideoPress GUID.
 * @param args.isOpen  - Whether the modal is open.
 * @param args.onError - Called when the caption tracks can't be loaded, so a
 *                     stale-empty list doesn't silently invite duplicates.
 * @return Caption-track state and a loading flag.
 */
export function useCaptionTracks( {
	guid,
	isOpen,
	onError,
}: UseCaptionTracksArgs ): UseCaptionTracksResult {
	const queryClient = useQueryClient();
	const onErrorRef = useRef( onError );
	onErrorRef.current = onError;

	const query = useQuery< SavedCaptionTrack[] >( {
		queryKey: getCaptionTracksQueryKey( guid ),
		queryFn: () => fetchCaptionTracks( guid ),
		enabled: isOpen && !! guid,
	} );

	// Surface each load failure; the cached list keeps rendering meanwhile.
	const { isError, errorUpdatedAt } = query;
	useEffect( () => {
		if ( isError && errorUpdatedAt ) {
			onErrorRef.current?.();
		}
	}, [ isError, errorUpdatedAt ] );

	const setCaptionTracks = useCallback< Dispatch< SetStateAction< SavedCaptionTrack[] > > >(
		value => {
			cancelQueryThenSetData< SavedCaptionTrack[] >(
				queryClient,
				getCaptionTracksQueryKey( guid ),
				current => {
					const currentTracks = current ?? EMPTY_CAPTION_TRACKS;
					return typeof value === 'function' ? value( currentTracks ) : value;
				}
			);
		},
		[ guid, queryClient ]
	);

	return {
		captionTracks: query.data ?? EMPTY_CAPTION_TRACKS,
		setCaptionTracks,
		isLoadingCaptionTracks: query.isLoading,
	};
}
