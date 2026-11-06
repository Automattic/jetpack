import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * Tile heights in dashboard rows, as `src/dashboard-layout.php` declares them
 * for the default layouts: a one-line strip, a chart or a figure, and a
 * leaderboard tall enough for its ten rows. On 40px rows 16px apart a tile of
 * N rows stands 56N - 16px.
 */
export const TILE_ROWS = {
	strip: 4,
	card: 8,
	list: 11,
} as const;

/**
 * Grid of the customizable dashboard: as many columns as fit tiles of the floor
 * width, up to six. At the 16px gap the page sets, two columns from 786px of
 * container, three from 1187px, four from 1588px, five from 1989px, six from
 * 2390px; the floor keeps three columns on a 1440px laptop, admin menu open.
 * The 40px row lets a resize land close to the height a list needs.
 */
export const DASHBOARD_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: 6,
	minColumnWidth: 385,
	rowHeight: 40,
};
