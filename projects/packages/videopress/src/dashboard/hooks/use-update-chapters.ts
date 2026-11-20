import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { syncChapters as syncChaptersCore } from '../../client/utils/video-chapters/sync-chapters';
import type {
	ChapterSaveSource,
	ChaptersSyncStatus,
} from '../../client/utils/video-chapters/sync-chapters';
import type { LibraryItem } from '../types/library';

export type { ChaptersSyncStatus } from '../../client/utils/video-chapters/sync-chapters';

type ChaptersVideo = Pick< LibraryItem, 'guid' | 'isPrivate' | 'durationSeconds' >;

/**
 * Bind the dashboard source and warning notices to the shared chapters sync.
 *
 * Sync errors show a warning rather than failing the already-persisted description save.
 *
 * @param source - Dashboard editing surface responsible for the save.
 * @return An object with the stable `syncChapters` callback.
 */
export function useUpdateChapters(
	source: Extract< ChapterSaveSource, 'dashboard_details' | 'dashboard_editor' >
) {
	const { createWarningNotice } = useDispatch( noticesStore );

	const syncChapters = useCallback(
		( video: ChaptersVideo, description: string ): Promise< ChaptersSyncStatus > =>
			syncChaptersCore( video, description, {
				source,
				onWarning: message => createWarningNotice( message, { type: 'snackbar' } ),
			} ),
		[ createWarningNotice, source ]
	);

	return { syncChapters };
}
