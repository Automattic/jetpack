/**
 * Types
 */
import type { PlaylistDisplayAttributes, PlaylistEntry } from '../playlist/types';

/**
 * Block context key under which the Latest Videos Playlist block hands its
 * inner Video Playlist block everything it needs to render.
 */
export const LATEST_VIDEOS_PLAYLIST_CONTEXT = 'videopress/latestVideosPlaylist';

export type LatestVideosStatus = 'loading' | 'ready' | 'error';

export type LatestVideosPlaylistContext = {
	videos: PlaylistEntry[];
	status: LatestVideosStatus;
	attributes: PlaylistDisplayAttributes;
};
