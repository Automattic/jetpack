import { ROW_HEIGHT_PRESETS } from '@wordpress/widget-dashboard';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * Narrowest tile the detail-page compositions are designed for. A surface fits
 * as many columns as its container allows at this width, counting the gap it
 * renders with: at the 16px gap these pages set, two columns from 616px of
 * container and three from 932px.
 */
export const PA_MIN_COLUMN_WIDTH = 300;

/**
 * The analytics pages are designed at the small (200px) row height rather than
 * the package's medium default.
 */
export const PA_ROW_HEIGHT = ROW_HEIGHT_PRESETS.small;

/** Columns the fixed detail-page compositions are arranged on. */
export const DETAIL_COLUMN_COUNT = 3;

/**
 * Grid for the fixed detail-page compositions: the shared tile floor, capped
 * at the count their layouts are arranged on.
 */
export const DETAIL_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: DETAIL_COLUMN_COUNT,
	minColumnWidth: PA_MIN_COLUMN_WIDTH,
	rowHeight: PA_ROW_HEIGHT,
};
