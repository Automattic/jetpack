/**
 * Dashboard wrapper for the shared chapters VTT sync: the player consumes a
 * WebVTT 'chapters' track that is generated from timestamp lines in the
 * video description, so a description save must regenerate that track or
 * the player's chapter menu silently de-syncs. The pipeline itself lives in
 * `src/client/utils/video-chapters/sync-chapters` (shared with the block
 * editor's chapter manager modal); this hook only binds its warning seam to
 * the dashboard's global notices.
 */
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCallback } from '@wordpress/element';
import { syncChapters as syncChaptersCore } from '../../client/utils/video-chapters/sync-chapters';
import type { ChaptersSyncStatus } from '../../client/utils/video-chapters/sync-chapters';
import type { LibraryItem } from '../types/library';

export type { ChaptersSyncStatus } from '../../client/utils/video-chapters/sync-chapters';

type ChaptersVideo = Pick< LibraryItem, 'guid' | 'isPrivate' | 'durationSeconds' >;

/**
 * Return a `syncChapters` callback that reconciles the video's chapters VTT
 * track with its (about-to-be-saved) description.
 *
 * The callback never rejects: every failure resolves as `'error'` after
 * raising a warning notice, so callers can fire it alongside the details
 * save without the save being blocked or failed by the chapters sync.
 *
 * @return An object with the stable `syncChapters` callback.
 */
export function useUpdateChapters() {
	const { createWarningNotice } = useGlobalNotices();

	const syncChapters = useCallback(
		( video: ChaptersVideo, description: string ): Promise< ChaptersSyncStatus > =>
			syncChaptersCore( video, description, { onWarning: createWarningNotice } ),
		[ createWarningNotice ]
	);

	return { syncChapters };
}
