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

	it( 'keeps unfinished tabs hidden with empty layouts', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] ).toEqual( [] );
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] ).toEqual( [] );
	} );
} );
