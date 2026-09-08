import { DEFAULT_GRID, ROW_HEIGHT_PRESETS } from '@wordpress/widget-dashboard';

/**
 * The detail pages are designed on three columns, like the main dashboard
 * (WOOA7S-2032), one fewer than the widget-dashboard package default.
 */
export const DETAIL_COLUMN_COUNT = 3;

/**
 * Grid for the fixed detail-page compositions. Kept apart from the customizable
 * main-dashboard preference so a settings control can't stretch these tiles.
 */
export const DETAIL_GRID = {
	...DEFAULT_GRID,
	columns: DETAIL_COLUMN_COUNT,
	rowHeight: ROW_HEIGHT_PRESETS.small,
};
