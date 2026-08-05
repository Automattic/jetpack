import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page.
 *
 * The page is not user-customizable (WOOA7S-1625): the highlights card spans
 * the full width, with the views-performance chart and the "Used on posts &
 * pages" list side by side below it.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'video-detail-highlights',
		type: 'jpa/video-detail-highlights',
		placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
	},
	{
		uuid: 'video-detail-views-performance',
		type: 'jpa/video-detail-views-performance',
		placement: { width: 2, height: 2, order: 2 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: 2, height: 2, order: 3 },
	},
];
