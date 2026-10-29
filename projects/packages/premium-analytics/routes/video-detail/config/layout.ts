import { PA_COLUMN_COUNT } from '../../grid';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page (WOOA7S-1625): the player,
 * then the performance chart, then the embeds list, each a full-width row.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'videopress-video-player',
		type: 'videopress/video-player',
		placement: { width: PA_COLUMN_COUNT, height: 3, order: 1 },
	},
	{
		uuid: 'video-detail-views-performance',
		type: 'jpa/video-detail-views-performance',
		attributes: { chartType: 'bar' },
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 2 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 3 },
	},
];
