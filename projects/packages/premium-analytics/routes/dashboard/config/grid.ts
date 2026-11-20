import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * Grid of the customizable dashboard: as many columns as fit tiles of the floor
 * width, up to six. At the 16px gap the page sets, two columns from 786px of
 * container, three from 1187px, four from 1588px, five from 1989px, six from
 * 2390px; the floor keeps three columns on a 1440px laptop, admin menu open.
 */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: 6,
	minColumnWidth: 385,
	rowHeight: 200,
};
