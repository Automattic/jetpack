import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page (not user-customizable,
 * WOOA7S-1625). The "Used on posts & pages" list stops at three columns
 * because a full-width leaderboard hits its max content width and leaves
 * trailing empty space.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'video-detail-views-performance',
		type: 'jpa/video-detail-views-performance',
		placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 2, order: 1 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: 3, height: 2, order: 2 },
	},
];
