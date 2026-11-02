import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * Grid of the customizable dashboard: as many columns as fit tiles of the floor
 * width, up to six. At the 16px gap the page sets, two columns from 816px of
 * container, three from 1232px, four from 1648px, five from 2064px, six from 2480px.
 */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: 6,
	minColumnWidth: 400,
	rowHeight: 200,
};
