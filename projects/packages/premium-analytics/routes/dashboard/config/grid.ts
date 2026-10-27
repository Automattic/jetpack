import { PA_MIN_COLUMN_WIDTH, PA_ROW_HEIGHT } from '../../grid';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/** Grid of the customizable dashboard: the column count follows the container width. */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	minColumnWidth: PA_MIN_COLUMN_WIDTH,
	rowHeight: PA_ROW_HEIGHT,
};
