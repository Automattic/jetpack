import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import { POST_DETAIL_TAB_LAYOUTS } from './tab-layouts';

describe( 'post detail tab layouts', () => {
	it( 'keeps the post traffic interaction cards in a single fixed row', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] ).toEqual( [
			{
				uuid: 'post-detail-highlights',
				type: 'jpa/post-detail-highlights',
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'post-comments',
				type: 'jpa/post-comments',
				placement: { width: 1, height: 2, order: 2 },
			},
			{
				uuid: 'post-likes',
				type: 'jpa/post-likes',
				placement: { width: 1, height: 2, order: 3 },
			},
			{
				uuid: 'post-utm',
				type: 'jpa/utm-insights',
				attributes: { utmDimension: 'utm_source,utm_medium', max: 10 },
				placement: { width: 2, height: 2, order: 4 },
			},
			{
				uuid: 'post-traffic-activity',
				type: 'jpa/post-traffic-activity',
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 2, order: 5 },
			},
		] );
	} );

	it( 'composes Email opens as a full highlight row followed by a 2/1/1 breakdown row', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] ).toMatchObject( [
			{
				uuid: 'email-opens-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'opens' },
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'email-opens-countries',
				type: 'jpa/email-breakdown',
				attributes: { view: 'countries', metric: 'opens', max: 8 },
				placement: { width: 2, height: 2, order: 2 },
			},
			{
				uuid: 'email-opens-devices',
				type: 'jpa/email-breakdown',
				attributes: { view: 'devices', metric: 'opens', max: 8 },
				placement: { width: 1, height: 2, order: 3 },
			},
			{
				uuid: 'email-opens-clients',
				type: 'jpa/email-breakdown',
				attributes: { view: 'clients', metric: 'opens', max: 8 },
				placement: { width: 1, height: 2, order: 4 },
			},
		] );
	} );

	it( 'composes Email clicks with a mapped location card and a wide Top links card', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] ).toMatchObject( [
			{
				uuid: 'email-clicks-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'clicks' },
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'email-clicks-countries',
				type: 'jpa/email-breakdown',
				attributes: { view: 'countries', metric: 'clicks', max: 7, showMap: true },
				placement: { width: 3, height: 2, order: 2 },
			},
			{
				uuid: 'email-clicks-devices',
				type: 'jpa/email-breakdown',
				attributes: { view: 'devices', metric: 'clicks', max: 8 },
				placement: { width: 1, height: 2, order: 3 },
			},
			{
				uuid: 'email-clicks-clients',
				type: 'jpa/email-breakdown',
				attributes: { view: 'clients', metric: 'clicks', max: 8 },
				placement: { width: 1, height: 2, order: 4 },
			},
			{
				uuid: 'email-clicks-links',
				type: 'jpa/email-breakdown',
				attributes: { view: 'links', metric: 'clicks', max: 8 },
				placement: { width: 3, height: 2, order: 5 },
			},
		] );
	} );
} );
