import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/** Grid of the customizable dashboard: the column count follows the container width. */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	minColumnWidth: 400,
	rowHeight: 200,
};
