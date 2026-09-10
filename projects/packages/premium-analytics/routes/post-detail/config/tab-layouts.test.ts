import { PA_COLUMN_COUNT } from '../../grid';
import { POST_DETAIL_TAB_LAYOUTS } from './tab-layouts';

describe( 'post detail tab layouts', () => {
	it( 'composes Post traffic as full-width highlights and Post views bar chart rows, Likes, Comments and UTM side by side, then a full-width All-time traffic', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] ).toEqual( [
			{
				uuid: 'post-detail-highlights',
				type: 'jpa/post-detail-highlights',
				placement: { width: PA_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'post-views',
				type: 'jpa/post-views',
				attributes: { chartType: 'bar' },
				placement: { width: PA_COLUMN_COUNT, height: 2, order: 2 },
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
				uuid: 'post-all-time-traffic',
				type: 'jpa/post-all-time-traffic',
				placement: { width: PA_COLUMN_COUNT, height: 2, order: 6 },
			},
		] );
	} );

	it( 'composes Email opens as a highlights row over a full-width trend chart, then Locations, Platforms and Clients side by side', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] ).toMatchObject( [
			{
				uuid: 'email-opens-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'opens' },
				placement: { width: PA_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'email-opens-trend',
				type: 'jpa/email-time-series--total-opens',
				attributes: { metric: 'opens' },
				placement: { width: PA_COLUMN_COUNT, height: 2, order: 2 },
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

	it( 'composes Email clicks as a two-column trend chart beside Platforms, Clients beside the two-column Locations map, then a two-column Top links', () => {
		expect( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] ).toMatchObject( [
			{
				uuid: 'email-clicks-highlights',
				type: 'jpa/email-top-row',
				attributes: { metric: 'clicks' },
				placement: { width: PA_COLUMN_COUNT, height: 1, order: 1 },
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
				attributes: { view: 'devices', metric: 'clicks' },
				placement: { width: 1, height: 2, order: 3 },
			},
			{
				uuid: 'email-clicks-clients',
				type: 'jpa/email-breakdown--clients-clicks',
				attributes: { view: 'clients', metric: 'clicks' },
				placement: { width: 1, height: 2, order: 4 },
			},
			{
				uuid: 'email-clicks-countries',
				type: 'jpa/email-breakdown--location-clicks',
				attributes: { view: 'countries', metric: 'clicks', showMap: true },
				placement: { width: 2, height: 2, order: 5 },
			},
			{
				uuid: 'email-clicks-links',
				type: 'jpa/email-breakdown--top-links',
				attributes: { view: 'links', metric: 'clicks' },
				placement: { width: 2, height: 2, order: 6 },
			},
		] );
	} );

	it( 'never wraps a tile past a partly filled row of the three-column grid', () => {
		for ( const layout of Object.values( POST_DETAIL_TAB_LAYOUTS ) ) {
			let used = 0;
			for ( const widget of layout ) {
				// Every detail tile declares a numeric span, never `fill` or `full`.
				const width = widget.placement?.width;
				expect( typeof width ).toBe( 'number' );
				const span = width as number;
				// A tile that does not fit wraps and strands the columns before it.
				// The last row may stay open (Email clicks ends on a two-column tile).
				expect( used + span ).toBeLessThanOrEqual( PA_COLUMN_COUNT );
				used = ( used + span ) % PA_COLUMN_COUNT;
			}
		}
	} );
} );
