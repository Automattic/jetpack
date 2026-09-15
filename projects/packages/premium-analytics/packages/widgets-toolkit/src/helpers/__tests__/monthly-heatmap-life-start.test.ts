/**
 * Internal dependencies
 */
import { monthlyHeatmapLifeStart } from '../monthly-heatmap-life-start';

const anchor = new Date( '2026-04-10T16:27:32Z' );
const rows = [
	{
		year: 2026,
		months: [ null, null, null, 6, 12, 0, 3, null, null, null, null, null ],
		total: 21,
	},
];

describe( 'monthlyHeatmapLifeStart', () => {
	it( 'starts on the anchor when it falls in the oldest covered month', () => {
		expect( monthlyHeatmapLifeStart( rows, anchor, 'UTC' ) ).toBe( anchor );
	} );

	it( 'reads the anchor month in the site timezone', () => {
		// 2026-05-01T02:00 in Auckland is still April 30 in UTC.
		const lateApril = new Date( '2026-04-30T14:30:00Z' );

		expect( monthlyHeatmapLifeStart( rows, lateApril, 'Pacific/Auckland' ) ).toEqual(
			new Date( '2026-03-31T11:00:00.000Z' )
		);
		expect( monthlyHeatmapLifeStart( rows, lateApril, 'UTC' ) ).toBe( lateApril );
	} );

	it( 'opens the oldest month whole when the anchor is in a later month', () => {
		const later = new Date( '2026-06-15T00:00:00Z' );

		expect( monthlyHeatmapLifeStart( rows, later, 'UTC' ) ).toEqual(
			new Date( '2026-04-01T00:00:00.000Z' )
		);
	} );

	it( 'opens the oldest month whole when the anchor is in an earlier month', () => {
		const earlier = new Date( '2026-03-20T00:00:00Z' );

		expect( monthlyHeatmapLifeStart( rows, earlier, 'UTC' ) ).toEqual(
			new Date( '2026-04-01T00:00:00.000Z' )
		);
	} );

	it( 'reads the oldest row wherever it sits', () => {
		const later = { year: 2027, months: [ 12, 0, null ], total: 12 };

		expect( monthlyHeatmapLifeStart( [ ...rows, later ], anchor, 'UTC' ) ).toBe( anchor );
		expect( monthlyHeatmapLifeStart( [ later, ...rows ], anchor, 'UTC' ) ).toBe( anchor );
	} );

	it( 'opens the oldest month whole without an anchor', () => {
		expect( monthlyHeatmapLifeStart( rows, undefined, 'UTC' ) ).toEqual(
			new Date( '2026-04-01T00:00:00.000Z' )
		);
	} );

	it( 'falls back to the anchor without covered rows', () => {
		expect( monthlyHeatmapLifeStart( [], anchor, 'UTC' ) ).toBe( anchor );
		expect(
			monthlyHeatmapLifeStart( [ { year: 2026, months: [ null, 'before' ] } ], anchor, 'UTC' )
		).toBe( anchor );
		expect( monthlyHeatmapLifeStart( [], undefined, 'UTC' ) ).toBeUndefined();
	} );
} );
