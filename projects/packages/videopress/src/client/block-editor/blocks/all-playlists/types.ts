export type AllPlaylistsLayout = 'gallery' | 'list';
export type AllPlaylistsOrder = 'newest' | 'oldest' | 'title' | 'updated';
export type AllPlaylistsPagination = 'numbered' | 'load-more';

/**
 * What the block's typography and color supports store, read back so the
 * headings can follow the Styles tab.
 */
export type BlockStyleAttributes = {
	fontFamily?: string;
	fontSize?: string;
	textColor?: string;
	style?: {
		typography?: Record< string, string | number | undefined >;
		color?: { text?: string };
	};
};

export type AllPlaylistsAttributes = BlockStyleAttributes & {
	layout: AllPlaylistsLayout;
	columns: number;
	perPage: number;
	orderBy: AllPlaylistsOrder;
	showDescription: boolean;
	showVideoCount: boolean;
	pagination: AllPlaylistsPagination;
	// Leave out the playlist a channel playlist page is showing.
	excludeCurrent?: boolean;
	// "Updated 2 weeks ago · 1 hr 12 min" under each card.
	showUpdated?: boolean;
};

/**
 * Bounds of the layout settings; the PHP render clamps to the same values.
 */
export const MIN_COLUMNS = 1;
export const MAX_COLUMNS = 6;
export const MIN_PER_PAGE = 1;
export const MAX_PER_PAGE = 48;
