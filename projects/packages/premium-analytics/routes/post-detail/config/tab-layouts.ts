import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import type { PostDetailTabId } from './tabs';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for each post-detail tab.
 *
 * The post detail page is not user-customizable (WOOA7S-1622): each tab
 * renders a fixed arrangement so required widgets and their sizing cannot be
 * removed or reshaped. Tabs whose composition has not been ported yet stay
 * empty and are hidden from the tab bar until their widgets land.
 */
export const POST_DETAIL_TAB_LAYOUTS: Record< PostDetailTabId, DashboardWidget[] > = {
	'post-traffic': [
		{
			uuid: 'post-detail-highlights',
			type: 'jpa/post-detail-highlights',
			placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
		},
		{
			uuid: 'post-likes',
			type: 'jpa/post-likes',
			placement: { width: 1, height: 2, order: 2 },
		},
	],
	'email-opens': [],
	'email-clicks': [],
};
