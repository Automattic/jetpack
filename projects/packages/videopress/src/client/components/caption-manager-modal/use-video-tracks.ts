/**
 * External dependencies
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../lib/fetch-video-item';
import { flattenVideoTracks } from '../../lib/video-tracks';
import { cancelQueryThenSetData } from './query-client';
/**
 * Types
 */
import type { VideoTextTrack } from '../../lib/video-tracks/types';
import type { Dispatch, SetStateAction } from 'react';

type VideoTracksQueryData = {
	/** Flattened track list, or null when the video info carried none. */
	tracks: VideoTextTrack[] | null;
	aspectRatio: string | undefined;
};

type UseVideoTracksArgs = {
	guid: string;
	isOpen: boolean;
	tracks?: VideoTextTrack[];
	onError?: () => void;
};

type UseVideoTracksResult = {
	managedTracks: VideoTextTrack[];
	setManagedTracks: Dispatch< SetStateAction< VideoTextTrack[] > >;
	previewAspectRatio: string | undefined;
};

const EMPTY_TRACKS: VideoTextTrack[] = [];

const getVideoTracksQueryKey = ( guid: string ) => [ 'videopress', 'video-info', guid ];

/**
 * Owns the video's live "managed" track list and preview aspect ratio.
 *
 * The video-info endpoint is the source of truth; the `tracks` prop isn't
 * always populated (e.g. the dashboard media REST omits it), so it renders
 * until the query resolves. Mutations write the cache optimistically via
 * `setManagedTracks`, which cancels any in-flight fetch so a stale response
 * can't overwrite the optimistic list.
 *
 * @param args         - Hook arguments.
 * @param args.guid    - VideoPress GUID.
 * @param args.isOpen  - Whether the modal is open.
 * @param args.tracks  - Track list from the host, used until the video info loads.
 * @param args.onError - Called when the video info can't be loaded.
 * @return Managed track state and the preview aspect ratio.
 */
export function useVideoTracks( {
	guid,
	isOpen,
	tracks = EMPTY_TRACKS,
	onError,
}: UseVideoTracksArgs ): UseVideoTracksResult {
	const queryClient = useQueryClient();
	const onErrorRef = useRef( onError );
	onErrorRef.current = onError;
	const propTracksRef = useRef( tracks );
	propTracksRef.current = tracks;

	/*
	 * Capture the seed on open only: an interim prop change while the modal is
	 * open (e.g. a host refetch whose media REST field omits tracks) must not
	 * blank the list.
	 */
	const [ seedTracks, setSeedTracks ] = useState( tracks );
	const seedTracksRef = useRef( tracks );
	useEffect( () => {
		if ( isOpen ) {
			seedTracksRef.current = propTracksRef.current;
			setSeedTracks( propTracksRef.current );
		}
	}, [ isOpen ] );

	const query = useQuery< VideoTracksQueryData >( {
		queryKey: getVideoTracksQueryKey( guid ),
		queryFn: async () => {
			const info = await fetchVideoItem( { guid, isPrivate: false } );
			const width = Number( info?.width );
			const height = Number( info?.height );
			return {
				tracks: info?.tracks ? flattenVideoTracks( info.tracks ) : null,
				aspectRatio: width > 0 && height > 0 ? `${ width } / ${ height }` : undefined,
			};
		},
		enabled: isOpen && !! guid,
	} );

	// Surface each load failure; the prop/cached list keeps rendering meanwhile.
	const { isError, errorUpdatedAt } = query;
	useEffect( () => {
		if ( isError && errorUpdatedAt ) {
			onErrorRef.current?.();
		}
	}, [ isError, errorUpdatedAt ] );

	const setManagedTracks = useCallback< Dispatch< SetStateAction< VideoTextTrack[] > > >(
		value => {
			cancelQueryThenSetData< VideoTracksQueryData >(
				queryClient,
				getVideoTracksQueryKey( guid ),
				current => {
					const currentTracks = current?.tracks ?? seedTracksRef.current;
					return {
						tracks: typeof value === 'function' ? value( currentTracks ) : value,
						aspectRatio: current?.aspectRatio,
					};
				}
			);
		},
		[ guid, queryClient ]
	);

	return {
		managedTracks: query.data?.tracks ?? seedTracks,
		setManagedTracks,
		previewAspectRatio: query.data?.aspectRatio,
	};
}
