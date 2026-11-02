import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page (WOOA7S-1625): the
 * performance chart full width, then the player beside the embeds list.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'video-detail-views-performance',
		type: 'jpa/video-detail-views-performance',
		attributes: { chartType: 'bar' },
		placement: { width: 'full', height: 2, order: 10 },
	},
	{
		uuid: 'videopress-video-player',
		type: 'videopress/video-player',
		placement: { width: 1, height: 2, order: 20 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: 'fill', height: 2, order: 30 },
	},
];
