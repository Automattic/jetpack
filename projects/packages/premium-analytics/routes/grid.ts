import { DEFAULT_GRID, ROW_HEIGHT_PRESETS } from '@wordpress/widget-dashboard';

/**
 * The analytics pages are designed on three columns (WOOA7S-2032), one fewer
 * than the widget-dashboard package default.
 */
export const PA_COLUMN_COUNT = 3;

/**
 * The analytics pages are designed at the small (200px) row height rather than
 * the package's medium default.
 */
export const PA_ROW_HEIGHT = ROW_HEIGHT_PRESETS.small;

/**
 * Grid for the fixed detail-page compositions. Kept apart from the customizable
 * main-dashboard preference so a settings control can't stretch these tiles.
 */
export const DETAIL_GRID = {
	...DEFAULT_GRID,
	columns: PA_COLUMN_COUNT,
	rowHeight: PA_ROW_HEIGHT,
};
