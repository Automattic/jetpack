import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import { POST_DETAIL_TAB_LAYOUTS } from './tab-layouts';

describe( 'post detail tab layouts', () => {
	it( 'composes Post traffic as a three-column highlights row, a Post views chart beside the interaction cards, then Traffic activity beside UTM', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] ).toEqual( [
			{
				uuid: 'post-detail-highlights',
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
				type: 'jpa/utm-insights--utm',
				attributes: { utmDimension: 'utm_source,utm_medium', max: 10, showReportLink: false },
				placement: { width: 1, height: 2, order: 6 },
			},
		] );
	} );

	it( 'composes Email opens as a highlights row over a three-column trend chart with Locations beside it', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] ).toMatchObject( [
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
		] );
	} );

	it( 'composes Email clicks as a trend chart beside Platforms and Clients, over the Locations and links rows', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] ).toMatchObject( [
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
		] );
	} );
} );
