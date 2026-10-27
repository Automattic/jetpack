import { PA_COLUMN_COUNT, PA_ROW_HEIGHT } from '../../grid';
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/** Grid of the customizable dashboard: one column from 0px, two from 600px, three from 960px. */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: { 0: 1, 600: 2, 960: PA_COLUMN_COUNT },
	rowHeight: PA_ROW_HEIGHT,
};
