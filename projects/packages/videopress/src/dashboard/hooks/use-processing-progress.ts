// Live transcoding progress for VideoPress videos that are still being
// processed after upload, ported from the VideoPress player's converting
// plugin. The player opens a socket.io connection to io.videopress.com and
// averages the per-filetype `conversion status` events it receives for the
// video's GUID; this module speaks the same protocol so the library shows
// the same percentage the embedded player reports.
//
// A module-level store keeps one socket per GUID no matter how many cells
// subscribe (the thumbnail overlay and the title-cell pill both render per
// item), and tears the socket down when the last subscriber unmounts.

import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { io } from 'socket.io-client';
import { fetchVideoItem } from '../../client/lib/fetch-video-item';
import type { Socket } from 'socket.io-client';

const PROGRESS_SOCKET_ORIGIN = 'https://io.videopress.com';

type ConversionStatusEvent = {
	type: string;
	progress: number;
};

type ProgressEntry = {
	progress: number | null;
	subscribers: Set< () => void >;
	socket: Socket | null;
	disposed: boolean;
};

const entries = new Map< string, ProgressEntry >();

/**
 * Fetch the video's `files_status` and connect the entry's socket.
 *
 * The set of output formats VideoPress transcodes for a video decides which
 * per-filetype progress events count towards the average — the same
 * selection the player makes before showing its converting modal: videos
 * large enough to get a DVD rendition are tracked via `dvd_mp4`, everything
 * else via `std_mp4`.
 *
 * @param guid      - The video GUID.
 * @param isPrivate - Whether the video is private (the info request then
 *                  needs a playback token).
 * @param entry     - The store entry to connect.
 */
async function connect( guid: string, isPrivate: boolean, entry: ProgressEntry ): Promise< void > {
	let supportedTypes = [ 'std_mp4' ];
	try {
		const info = await fetchVideoItem( { guid, isPrivate } );
		if ( info?.files_status?.dvd ) {
			supportedTypes = [ 'dvd_mp4' ];
		}
	} catch {
		// No video info yet; std_mp4 is produced for every upload.
	}

	if ( entry.disposed ) {
		return;
	}

	const progressByType: Record< string, number > = {};
	supportedTypes.forEach( type => {
		progressByType[ type ] = 0;
	} );

	const socket = io( PROGRESS_SOCKET_ORIGIN, { upgrade: false, query: { guid } } );
	entry.socket = socket;

	const onStatus = ( data: ConversionStatusEvent ) => {
		// Ignore events for filetypes this video's average doesn't track.
		if ( ! ( data.type in progressByType ) ) {
			return;
		}
		progressByType[ data.type ] = data.progress;

		let sum = 0;
		for ( const type in progressByType ) {
			// The backend reports negative values before a filetype starts.
			sum += Math.max( 0, progressByType[ type ] );
		}
		entry.progress = Math.floor( sum / supportedTypes.length );
		entry.subscribers.forEach( notify => notify() );

		if ( entry.progress >= 100 ) {
			socket.off( 'conversion status', onStatus );
			socket.disconnect();
		}
	};

	socket.on( 'conversion status', onStatus );
}

/**
 * Subscribe to conversion progress for a GUID, creating the shared socket on
 * first subscription and disposing it when the last subscriber leaves.
 *
 * @param guid      - The video GUID.
 * @param isPrivate - Whether the video is private.
 * @param notify    - Called whenever the progress value changes.
 * @return Unsubscribe callback.
 */
function subscribeToProgress( guid: string, isPrivate: boolean, notify: () => void ): () => void {
	let entry = entries.get( guid );
	if ( ! entry ) {
		entry = { progress: null, subscribers: new Set(), socket: null, disposed: false };
		entries.set( guid, entry );
		void connect( guid, isPrivate, entry );
	}
	entry.subscribers.add( notify );

	return () => {
		entry.subscribers.delete( notify );
		if ( entry.subscribers.size === 0 ) {
			entry.disposed = true;
			entry.socket?.disconnect();
			entries.delete( guid );
		}
	};
}

/**
 * Read the last known progress for a GUID.
 *
 * @param guid - The video GUID.
 * @return Percentage 0–100, or null before the first event arrives.
 */
function readProgress( guid: string ): number | null {
	return entries.get( guid )?.progress ?? null;
}

/**
 * Reset the shared progress store. Intended for tests; production code
 * should not call this.
 */
export function __resetProcessingProgressForTests(): void {
	entries.forEach( entry => {
		entry.disposed = true;
		entry.socket?.disconnect();
	} );
	entries.clear();
}

/**
 * Track the live transcoding progress of a processing VideoPress video.
 *
 * @param guid      - The video GUID.
 * @param isPrivate - Whether the video is private.
 * @param enabled   - Only subscribe while true (e.g. while the item is
 *                  processing); pass false to keep the hook inert.
 * @return Percentage 0–100, or null while no progress is known.
 */
export function useProcessingProgress(
	guid: string,
	isPrivate: boolean,
	enabled: boolean
): number | null {
	const subscribe = useCallback(
		( notify: () => void ) => {
			if ( ! enabled || ! guid ) {
				return () => {};
			}
			return subscribeToProgress( guid, isPrivate, notify );
		},
		[ guid, isPrivate, enabled ]
	);

	const getSnapshot = useCallback(
		() => ( enabled && guid ? readProgress( guid ) : null ),
		[ guid, enabled ]
	);

	return useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
}
