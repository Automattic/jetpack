/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import getMediaToken from '../../../lib/get-media-token';
import { withMetadataToken } from './utils';
/**
 * Types
 */
import type { PlaylistEntry, PlaylistLiveMetadata } from './types';

export type PlaylistLiveMetadataCache = Record< string, PlaylistLiveMetadata >;

/**
 * Pick the live display metadata (title, poster) out of a videos API
 * response item.
 *
 * @param item - The videos API response.
 * @return Live metadata; fields are omitted when the API has none.
 */
export function liveMetadataFromApiResponse(
	item: Record< string, unknown >
): PlaylistLiveMetadata {
	const metadata: PlaylistLiveMetadata = {};

	if ( typeof item?.title === 'string' && item.title ) {
		metadata.title = decodeEntities( item.title );
	}
	if ( typeof item?.poster === 'string' && item.poster ) {
		metadata.poster = item.poster;
	}

	return metadata;
}

/**
 * Build an entry's live metadata, signing the poster URL for private videos:
 * the API returns the poster's bare file URL, which the file host refuses
 * without a token. The token comes from the same local cache fetchVideoItem
 * used to read the metadata, so this rarely costs an extra request.
 *
 * @param guid - The video GUID.
 * @param item - The videos API response.
 * @return Live metadata.
 */
export async function liveMetadataWithSignedPoster(
	guid: string,
	item: Record< string, unknown >
): Promise< PlaylistLiveMetadata > {
	const metadata = liveMetadataFromApiResponse( item );

	if ( metadata.poster && item?.is_private === true ) {
		try {
			const { token } = await getMediaToken( 'playback', { guid } );
			if ( token ) {
				metadata.poster = withMetadataToken( metadata.poster, token );
			} else {
				// A poster the file host would refuse is worse than the fallback.
				delete metadata.poster;
				metadata.isPrivateLocked = true;
			}
		} catch {
			delete metadata.poster;
			metadata.isPrivateLocked = true;
		}
	}

	if ( metadata.isPrivateLocked ) {
		metadata.title = __( 'Private video', 'jetpack-videopress-pkg' );
	}

	return metadata;
}

/**
 * Resolve the live display metadata (title, poster) of the given entries.
 *
 * It is never written to block attributes: the editor reads it fresh from
 * the video data, the same way the front-end view script does. Each GUID is
 * looked up once per editing session; failed lookups keep the fallback.
 *
 * @param videos - The entries to resolve.
 * @return The cache keyed by GUID, a setter to seed it, and a way to mark a GUID as already resolved so the effect skips it.
 */
export default function usePlaylistLiveMetadata( videos: PlaylistEntry[] ) {
	const [ liveMetadata, setLiveMetadata ] = useState< PlaylistLiveMetadataCache >( {} );
	const metadataFetchesStarted = useRef( new Set< string >() );

	const cacheLiveMetadata = useCallback( ( guid: string, metadata: PlaylistLiveMetadata ) => {
		if ( ! Object.keys( metadata ).length ) {
			return;
		}
		setLiveMetadata( cache => ( { ...cache, [ guid ]: { ...cache[ guid ], ...metadata } } ) );
	}, [] );

	const markFetched = useCallback( ( guid: string ) => {
		metadataFetchesStarted.current.add( guid );
	}, [] );

	useEffect( () => {
		videos.forEach( ( { guid } ) => {
			if ( metadataFetchesStarted.current.has( guid ) ) {
				return;
			}
			metadataFetchesStarted.current.add( guid );

			fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } )
				.then( item => liveMetadataWithSignedPoster( guid, item as Record< string, unknown > ) )
				.then( metadata => cacheLiveMetadata( guid, metadata ) )
				.catch( ( error: Error & { cause?: { error?: string } } ) => {
					// A video this user cannot authorize at all shows the lock
					// placeholder; anything else keeps the GUID fallback.
					if ( error?.cause?.error === 'auth' ) {
						cacheLiveMetadata( guid, {
							title: __( 'Private video', 'jetpack-videopress-pkg' ),
							isPrivateLocked: true,
						} );
					}
				} );
		} );
	}, [ videos, cacheLiveMetadata ] );

	return { liveMetadata, cacheLiveMetadata, markFetched };
}
