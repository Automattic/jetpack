import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import type { PostDetailTabId } from './tabs';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * Fixed widget composition for each post-detail tab.
 *
 * The post detail page is not user-customizable (WOOA7S-1622): each tab
 * renders a fixed arrangement so required widgets and their sizing cannot be
 * removed or reshaped. A tab stays hidden only while its composition is empty.
 */
export const POST_DETAIL_TAB_LAYOUTS: Record< PostDetailTabId, DashboardWidget[] > = {
	'post-traffic': [
		{
			uuid: 'post-detail-highlights',
			// Three quarter-width tiles with the last column left empty, per the
			// design mocks — unlike the email highlights rows, which span all four.
			type: 'jpa/post-detail-highlights',
			placement: { width: 3, height: 1, order: 1 },
		},
		{
			uuid: 'post-views',
			type: 'jpa/post-views',
			placement: { width: 2, height: 2, order: 2 },
		},
		{
			uuid: 'post-likes',
			type: 'jpa/post-likes',
			placement: { width: 1, height: 2, order: 3 },
		},
		{
			uuid: 'post-comments',
			type: 'jpa/post-comments',
			placement: { width: 1, height: 2, order: 4 },
		},
		{
			uuid: 'post-traffic-activity',
			type: 'jpa/post-traffic-activity',
			placement: { width: 3, height: 2, order: 5 },
		},
		{
			uuid: 'post-utm',
			// The alias carries the mock's "UTM" card title; the registry's
			// global "UTM Insights" title is owned by the copy spreadsheet work.
			type: 'jpa/utm-insights--utm',
			// Detail-page widgets carry no "See report" action per the design
			// mocks — the post detail page is itself the terminal page, and the
			// site-wide UTM report would silently drop this post's scope.
			attributes: { utmDimension: 'utm_source,utm_medium', max: 10, showReportLink: false },
			placement: { width: 1, height: 2, order: 6 },
		},
	],
	'email-opens': [
		{
			uuid: 'email-opens-highlights',
			type: 'jpa/email-top-row',
			attributes: { metric: 'opens' },
			placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
		},
		{
			uuid: 'email-opens-trend',
			type: 'jpa/email-time-series--total-opens',
			attributes: { metric: 'opens' },
			placement: { width: 3, height: 2, order: 2 },
		},
		{
			uuid: 'email-opens-countries',
			type: 'jpa/email-breakdown--location-opens',
			attributes: { view: 'countries', metric: 'opens', max: 8 },
			placement: { width: 1, height: 2, order: 3 },
		},
		{
			uuid: 'email-opens-devices',
			type: 'jpa/email-breakdown--platforms-opens',
			attributes: { view: 'devices', metric: 'opens', max: 8 },
			placement: { width: 1, height: 2, order: 4 },
		},
		{
			uuid: 'email-opens-clients',
			type: 'jpa/email-breakdown--clients-opens',
			attributes: { view: 'clients', metric: 'opens', max: 8 },
			placement: { width: 1, height: 2, order: 5 },
		},
	],
	'email-clicks': [
		{
			uuid: 'email-clicks-highlights',
			type: 'jpa/email-top-row',
			attributes: { metric: 'clicks' },
			placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
		},
		{
			uuid: 'email-clicks-trend',
			type: 'jpa/email-time-series--total-clicks',
			attributes: { metric: 'clicks' },
			placement: { width: 2, height: 2, order: 2 },
		},
		{
			uuid: 'email-clicks-devices',
			type: 'jpa/email-breakdown--platforms-clicks',
			attributes: { view: 'devices', metric: 'clicks', max: 8 },
			placement: { width: 1, height: 2, order: 3 },
		},
		{
			uuid: 'email-clicks-clients',
			type: 'jpa/email-breakdown--clients-clicks',
			attributes: { view: 'clients', metric: 'clicks', max: 8 },
			placement: { width: 1, height: 2, order: 4 },
		},
		{
			uuid: 'email-clicks-countries',
			// Plain leaderboard per the design mocks — no map beside it.
			type: 'jpa/email-breakdown--location-clicks',
			attributes: { view: 'countries', metric: 'clicks', max: 8 },
			placement: { width: 2, height: 2, order: 5 },
		},
		{
			uuid: 'email-clicks-links',
			type: 'jpa/email-breakdown--top-links',
			attributes: { view: 'links', metric: 'clicks', max: 8 },
			placement: { width: 2, height: 2, order: 6 },
		},
	],
};
