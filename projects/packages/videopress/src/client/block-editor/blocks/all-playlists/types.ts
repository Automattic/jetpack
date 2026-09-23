export type AllPlaylistsLayout = 'gallery' | 'list';
export type AllPlaylistsOrder = 'newest' | 'oldest' | 'title';
export type AllPlaylistsPagination = 'numbered' | 'load-more';

export type AllPlaylistsAttributes = {
	layout: AllPlaylistsLayout;
	columns: number;
	perPage: number;
	orderBy: AllPlaylistsOrder;
	showDescription: boolean;
	showVideoCount: boolean;
	showTotalRuntime: boolean;
	pagination: AllPlaylistsPagination;
};

/**
 * Bounds of the layout settings; the PHP render clamps to the same values.
 */
export const MIN_COLUMNS = 1;
export const MAX_COLUMNS = 6;
export const MIN_PER_PAGE = 1;
export const MAX_PER_PAGE = 48;
