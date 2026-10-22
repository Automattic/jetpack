import type { EmptyStateMode } from '../../channel/editor-controls';
import type { PlaylistDisplayAttributes } from '../playlist/types';

export type LatestVideosOrder = 'newest' | 'oldest' | 'popular';

export type LatestVideosPlaylistAttributes = PlaylistDisplayAttributes & {
	// How many of the site's newest VideoPress videos to show; the page size when paginated.
	count: number;
	orderBy?: LatestVideosOrder;
	// Search, sort and length controls above the list, read from the page URL.
	showBrowseControls?: boolean;
	pagination?: 'none' | 'numbered';
	// Leave out the video a channel video page is showing.
	excludeCurrent?: boolean;
	// "12K views · 3 days ago" under each entry.
	showMeta?: boolean;
	// What the block shows while the site has no videos.
	emptyState?: EmptyStateMode;
};
