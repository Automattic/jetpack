/**
 * External dependencies
 */
import type { WidgetGridSettings } from '@wordpress/widget-dashboard';

/**
 * Name the tab's sections register under. Must match `Stats_Dashboard::DASHBOARD_NAME`.
 */
export const STATS_DASHBOARD_NAME = 'jetpack-videopress_stats';

/**
 * Preferences scope that keeps the arrangement the reader gave the tab.
 */
export const STATS_PREFERENCES_SCOPE = 'jetpack-videopress/stats-dashboard';

/**
 * Grid of the tab: the two rankings side by side under the performance widget.
 */
export const STATS_GRID: WidgetGridSettings = {
	model: 'grid',
	columns: 2,
	rowHeight: 200,
};
