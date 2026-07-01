/**
 * External dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../lib/fetch-video-item';
import { flattenVideoTracks } from '../../lib/video-tracks';
/**
 * Types
 */
import type { VideoTextTrack } from '../../lib/video-tracks/types';
import type { Dispatch, SetStateAction } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal:use-video-tracks' );

type UseVideoTracksArgs = {
	guid: string;
	isOpen: boolean;
	tracks: VideoTextTrack[];
	onError?: () => void;
};

type UseVideoTracksResult = {
	managedTracks: VideoTextTrack[];
	setManagedTracks: Dispatch< SetStateAction< VideoTextTrack[] > >;
	previewAspectRatio: string | undefined;
};

/**
 * Owns the video's live "managed" track list and preview aspect ratio.
 *
 * The video-info tracks are the source of truth; the `tracks` prop isn't always
 * populated (e.g. the dashboard media REST omits it), so the list is re-synced
 * from the prop on open and then replaced with the fetched video info.
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
	tracks,
	onError,
}: UseVideoTracksArgs ): UseVideoTracksResult {
	const [ managedTracks, setManagedTracks ] = useState< VideoTextTrack[] >( tracks );
	const [ previewAspectRatio, setPreviewAspectRatio ] = useState< string | undefined >();
	const onErrorRef = useRef( onError );
	onErrorRef.current = onError;

	/*
	 * Re-sync from the tracks prop when the modal opens so the list reflects the
	 * video, but not on every parent re-render, so an interim empty tracks prop
	 * can't blank it.
	 */
	useEffect( () => {
		if ( isOpen ) {
			setManagedTracks( tracks );
		}
	}, [ isOpen ] );

	/*
	 * Fetch the video info on open for the authoritative live track list and the
	 * preview aspect ratio.
	 */
	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		fetchVideoItem( { guid, isPrivate: false } )
			.then( info => {
				if ( ! isMounted ) {
					return;
				}

				if ( info?.tracks ) {
					setManagedTracks( flattenVideoTracks( info.tracks ) );
				}

				const width = Number( info?.width );
				const height = Number( info?.height );
				if ( width > 0 && height > 0 ) {
					setPreviewAspectRatio( `${ width } / ${ height }` );
				}
			} )
			.catch( error => {
				debug( 'fetch video info error', error );
				if ( isMounted ) {
					onErrorRef.current?.();
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ guid, isOpen ] );

	return { managedTracks, setManagedTracks, previewAspectRatio };
}
