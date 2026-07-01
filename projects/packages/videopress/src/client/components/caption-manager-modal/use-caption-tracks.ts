/**
 * External dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { fetchCaptionTracks } from '../../lib/video-tracks/caption-tracks';
import { useLocalEditGuard } from './use-local-edit-guard';
/**
 * Types
 */
import type { LocalEditSetter } from './use-local-edit-guard';
import type { SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';

const debug = debugFactory( 'videopress:caption-manager-modal:use-caption-tracks' );

type UseCaptionTracksArgs = {
	guid: string;
	isOpen: boolean;
	onError?: () => void;
};

type UseCaptionTracksResult = {
	captionTracks: SavedCaptionTrack[];
	setCaptionTracks: LocalEditSetter< SavedCaptionTrack[] >;
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
	const { hasLocalEditsRef, setWithGuard, resetLocalEdits } = useLocalEditGuard( setCaptionTracks );

	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		resetLocalEdits();
		setIsLoadingCaptionTracks( true );
		fetchCaptionTracks( guid )
			.then( loadedCaptionTracks => {
				if ( ! isMounted ) {
					return;
				}

				if ( ! hasLocalEditsRef.current ) {
					setCaptionTracks( loadedCaptionTracks );
					return;
				}

				// A save landed before this fetch resolved; keep it and merge the server drafts in behind it.
				setCaptionTracks( current => {
					const localIds = new Set( current.map( track => track.id ) );
					return [
						...current,
						...loadedCaptionTracks.filter( track => ! localIds.has( track.id ) ),
					];
				} );
			} )
			.catch( error => {
				debug( 'fetch caption tracks error', error );
				if ( ! isMounted ) {
					return;
				}

				// Report the failure regardless; only skip the empty fallback so it can't wipe local edits.
				if ( ! hasLocalEditsRef.current ) {
					setCaptionTracks( [] );
				}
				onErrorRef.current?.();
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoadingCaptionTracks( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ guid, isOpen, hasLocalEditsRef, resetLocalEdits ] );

	return { captionTracks, setCaptionTracks: setWithGuard, isLoadingCaptionTracks };
}
