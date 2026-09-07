import { DETAIL_COLUMN_COUNT } from '../../detail-grid';
import { POST_DETAIL_TAB_LAYOUTS } from './tab-layouts';

describe( 'post detail tab layouts', () => {
	it( 'composes Post traffic as full-width highlights and Post views rows, Likes, Comments and UTM side by side, then a full-width Traffic activity', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] ).toEqual( [
			{
				uuid: 'post-detail-highlights',
				type: 'jpa/post-detail-highlights',
				placement: { width: DETAIL_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'post-views',
				type: 'jpa/post-views',
				placement: { width: DETAIL_COLUMN_COUNT, height: 2, order: 2 },
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
				uuid: 'post-utm',
				type: 'jpa/utm-insights--utm',
				attributes: { utmDimension: 'utm_source,utm_medium', showReportLink: false },
				placement: { width: 1, height: 2, order: 5 },
			},
			{
				uuid: 'post-traffic-activity',
				type: 'jpa/post-traffic-activity',
				placement: { width: DETAIL_COLUMN_COUNT, height: 2, order: 6 },
			},
		] );
	} );

	it( 'composes Email opens as a highlights row over a full-width trend chart, then Locations, Platforms and Clients side by side', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] ).toMatchObject( [
			{
				uuid: 'email-opens-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'opens' },
				placement: { width: DETAIL_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'email-opens-trend',
				type: 'jpa/email-time-series--total-opens',
				attributes: { metric: 'opens' },
				placement: { width: DETAIL_COLUMN_COUNT, height: 2, order: 2 },
			},
			{
				uuid: 'email-opens-countries',
				type: 'jpa/email-breakdown--location-opens',
				attributes: { view: 'countries', metric: 'opens' },
				placement: { width: 1, height: 2, order: 3 },
			},
			{
				uuid: 'email-opens-devices',
				type: 'jpa/email-breakdown--platforms-opens',
				attributes: { view: 'devices', metric: 'opens' },
				placement: { width: 1, height: 2, order: 4 },
			},
			{
				uuid: 'email-opens-clients',
				type: 'jpa/email-breakdown--clients-opens',
				attributes: { view: 'clients', metric: 'opens' },
				placement: { width: 1, height: 2, order: 5 },
			},
		] );
	} );

	it( 'composes Email clicks as a full-width trend chart over the full-width Locations map, then Platforms, Clients and Top links side by side', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] ).toMatchObject( [
			{
				uuid: 'email-clicks-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'clicks' },
				placement: { width: DETAIL_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'email-clicks-trend',
				type: 'jpa/email-time-series--total-clicks',
				attributes: { metric: 'clicks' },
				placement: { width: DETAIL_COLUMN_COUNT, height: 2, order: 2 },
			},
			{
				uuid: 'email-clicks-countries',
				type: 'jpa/email-breakdown--location-clicks',
				attributes: { view: 'countries', metric: 'clicks', showMap: true },
				placement: { width: DETAIL_COLUMN_COUNT, height: 2, order: 3 },
			},
			{
				uuid: 'email-clicks-devices',
				type: 'jpa/email-breakdown--platforms-clicks',
				attributes: { view: 'devices', metric: 'clicks' },
				placement: { width: 1, height: 2, order: 4 },
			},
			{
				uuid: 'email-clicks-clients',
				type: 'jpa/email-breakdown--clients-clicks',
				attributes: { view: 'clients', metric: 'clicks' },
				placement: { width: 1, height: 2, order: 5 },
			},
			{
				uuid: 'email-clicks-links',
				type: 'jpa/email-breakdown--top-links',
				attributes: { view: 'links', metric: 'clicks' },
				placement: { width: 1, height: 2, order: 6 },
			},
		] );
	} );

	it( 'fills every row of the three-column grid without leaving a gap', () => {
		for ( const layout of Object.values( POST_DETAIL_TAB_LAYOUTS ) ) {
			let used = 0;
			for ( const widget of layout ) {
				const width = widget.placement?.width ?? 1;
				// A tile that does not fit wraps and strands the columns before it.
				expect( used + width ).toBeLessThanOrEqual( DETAIL_COLUMN_COUNT );
				used = ( used + width ) % DETAIL_COLUMN_COUNT;
			}
			expect( used ).toBe( 0 );
		}
	} );
} );
