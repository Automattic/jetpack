import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page.
 *
 * The page is not user-customizable (WOOA7S-1625). Follow-ups will add more
 * widgets, including the plays trend, to this fixed composition.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'video-detail-highlights',
		type: 'jpa/video-detail-highlights',
		placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 2, order: 2 },
	},
];
