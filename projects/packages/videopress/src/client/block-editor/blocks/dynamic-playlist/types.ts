import type { PlaylistDisplayAttributes } from '../playlist/types';

export type DynamicPlaylistAttributes = PlaylistDisplayAttributes & {
	// How many of the site's newest VideoPress videos to show.
	count: number;
};
