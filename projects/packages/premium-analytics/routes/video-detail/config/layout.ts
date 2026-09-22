import { PA_COLUMN_COUNT } from '../../grid';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for the video detail page (not user-customizable,
 * WOOA7S-1625): two full-width rows on the three-column detail grid.
 */
export const VIDEO_DETAIL_LAYOUT: DashboardWidget[] = [
	{
		uuid: 'video-detail-views-performance',
		type: 'jpa/video-detail-views-performance',
		attributes: { chartType: 'bar' },
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 1 },
	},
	{
		uuid: 'video-detail-embeds',
		type: 'jpa/video-detail-embeds',
		placement: { width: PA_COLUMN_COUNT, height: 2, order: 2 },
	},
];
