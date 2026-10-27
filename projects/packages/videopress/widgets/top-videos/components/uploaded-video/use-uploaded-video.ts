/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { toLibraryItem, type ApiMediaItem } from '../../../../src/dashboard/utils/library-item';
import { libraryRefetchInterval } from '../../../../src/dashboard/utils/processing-poll';
import type { LibraryItem } from '../../../../src/dashboard/types/library';

/**
 * Follows a just-uploaded video until it is processed, on the library's poll cadence.
 *
 * @param id - Attachment ID the upload created.
 * @return The video as the library maps it, or null until the first answer.
 */
export function useUploadedVideo( id: number ): LibraryItem | null {
	const [ video, setVideo ] = useState< LibraryItem | null >( null );

	useEffect( () => {
		let cancelled = false;
		let timer: number | undefined;
		const startedAt = Date.now();

		const poll = async () => {
			let next: LibraryItem | null = null;
			try {
				const raw = await apiFetch< ApiMediaItem >( { path: `/wp/v2/media/${ id }` } );
				next = toLibraryItem( raw, isSimpleSite() );
			} catch {
				// A record that has not synced yet answers on a later poll.
			}
			if ( cancelled ) {
				return;
			}
			if ( next ) {
				setVideo( next );
			}
			const interval = libraryRefetchInterval( next?.isProcessing ?? true, Date.now() - startedAt );
			if ( interval !== false ) {
				timer = window.setTimeout( () => void poll(), interval );
			}
		};

		void poll();

		return () => {
			cancelled = true;
			window.clearTimeout( timer );
		};
	}, [ id ] );

	return video;
}
