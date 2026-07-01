/**
 * External dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { fetchCaptionTracks } from '../../lib/video-tracks/caption-tracks';
/**
 * Types
 */
import type { SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { Dispatch, SetStateAction } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal:use-caption-tracks' );

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

/**
 * Loads and owns the locally stored caption-track drafts for a video.
 *
 * The list is fetched when the modal opens and then kept in state so mutations
 * (save/delete) can update it optimistically.
 *
 * @param args         - Hook arguments.
 * @param args.guid    - VideoPress GUID.
 * @param args.isOpen  - Whether the modal is open.
 * @param args.onError - Called when the caption tracks can't be loaded, so a
 *                     stale-empty list doesn't silently invite duplicates.
 * @return Caption-track state and loading flag.
 */
export function useCaptionTracks( {
	guid,
	isOpen,
	onError,
}: UseCaptionTracksArgs ): UseCaptionTracksResult {
	const [ captionTracks, setCaptionTracks ] = useState< SavedCaptionTrack[] >( [] );
	const [ isLoadingCaptionTracks, setIsLoadingCaptionTracks ] = useState( false );
	const onErrorRef = useRef( onError );
	onErrorRef.current = onError;

	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		setIsLoadingCaptionTracks( true );
		fetchCaptionTracks( guid )
			.then( loadedCaptionTracks => {
				if ( isMounted ) {
					setCaptionTracks( loadedCaptionTracks );
				}
			} )
			.catch( error => {
				debug( 'fetch caption tracks error', error );
				if ( isMounted ) {
					setCaptionTracks( [] );
					onErrorRef.current?.();
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoadingCaptionTracks( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ guid, isOpen ] );

	return { captionTracks, setCaptionTracks, isLoadingCaptionTracks };
}
