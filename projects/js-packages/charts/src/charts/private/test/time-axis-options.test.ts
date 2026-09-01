/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { dailySeries, hourlySeries } from '../../../test-utils/series-fixtures';
import { buildTimeAxisOptions } from '../time-axis-options';

const TOKYO = { timeZone: 'Asia/Tokyo' };

const build = ( overrides: Partial< Parameters< typeof buildTimeAxisOptions >[ 0 ] > = {} ) =>
	buildTimeAxisOptions( {
		dataSorted: dailySeries( '2026-08-01T15:00:00Z', 30 ),
		width: 600,
		axisOptions: { tickResolution: 'day' },
		scaleDomain: undefined,
		zoomDomain: undefined,
		formatting: TOKYO,
		...overrides,
	} );

describe( 'buildTimeAxisOptions', () => {
	it( 'selects tick values instead of leaving the count to d3', () => {
		const axis = build();

		expect( Array.isArray( axis.tickValues ) ).toBe( true );
		expect( ( axis.tickValues as Date[] ).length ).toBeGreaterThan( 1 );
	} );

	it( 'confines tick values to the zoom window', () => {
		const zoomDomain: [ Date, Date ] = [
			new Date( '2026-08-10T15:00:00Z' ),
			new Date( '2026-08-14T15:00:00Z' ),
		];

		const ticks = build( { zoomDomain } ).tickValues as Date[];

		expect( ticks.length ).toBeGreaterThan( 0 );
		for ( const tick of ticks ) {
			expect( tick.getTime() ).toBeGreaterThanOrEqual( zoomDomain[ 0 ].getTime() );
			expect( tick.getTime() ).toBeLessThanOrEqual( zoomDomain[ 1 ].getTime() );
		}
	} );

	it( 'prefers the zoom window over a caller scale domain', () => {
		const scaleDomain: [ Date, Date ] = [
			new Date( '2026-08-01T15:00:00Z' ),
			new Date( '2026-08-30T15:00:00Z' ),
		];
		const zoomDomain: [ Date, Date ] = [
			new Date( '2026-08-10T15:00:00Z' ),
			new Date( '2026-08-12T15:00:00Z' ),
		];

		const ticks = build( { scaleDomain, zoomDomain } ).tickValues as Date[];

		expect( ticks.length ).toBeGreaterThan( 0 );
		for ( const tick of ticks ) {
			expect( tick.getTime() ).toBeLessThanOrEqual( zoomDomain[ 1 ].getTime() );
		}
	} );

	it( 'confines tick values to a caller scale domain when there is no zoom', () => {
		const scaleDomain: [ Date, Date ] = [
			new Date( '2026-08-05T15:00:00Z' ),
			new Date( '2026-08-08T15:00:00Z' ),
		];

		const ticks = build( { scaleDomain } ).tickValues as Date[];

		expect( ticks.length ).toBeGreaterThan( 0 );
		for ( const tick of ticks ) {
			expect( tick.getTime() ).toBeGreaterThanOrEqual( scaleDomain[ 0 ].getTime() );
			expect( tick.getTime() ).toBeLessThanOrEqual( scaleDomain[ 1 ].getTime() );
		}
	} );

	it( 'caps the selection at a caller numTicks', () => {
		const axis = build( { axisOptions: { tickResolution: 'day', numTicks: 3 } } );

		expect( ( axis.tickValues as Date[] ).length ).toBeLessThanOrEqual( 3 );
	} );

	it( 'caps the selection by width when no numTicks is given', () => {
		const narrow = build( { width: 180 } ).tickValues as Date[];
		const wide = build( { width: 900 } ).tickValues as Date[];

		expect( narrow.length ).toBeLessThan( wide.length );
	} );

	it( 'selects nothing when the caller supplies its own tickFormat', () => {
		const axis = build( {
			axisOptions: { tickResolution: 'day', tickFormat: () => 'x' },
		} );

		expect( axis.tickValues ).toBeUndefined();
		expect( axis.tickFormat?.( new Date(), 0, [] ) ).toBe( 'x' );
		expect( typeof axis.numTicks ).toBe( 'number' );
	} );

	it( 'fits a caller tickFormat to the width rather than leaving visx its fixed default', () => {
		const isoDay = ( value: unknown ) => new Date( Number( value ) ).toISOString().slice( 0, 10 );

		const narrow = build( {
			width: 180,
			axisOptions: { tickResolution: 'day', tickFormat: isoDay },
		} );
		const wide = build( {
			width: 900,
			axisOptions: { tickResolution: 'day', tickFormat: isoDay },
		} );

		expect( narrow.numTicks ).toBeLessThan( wide.numTicks as number );
	} );

	it( "keeps a caller's numTicks on the tickFormat branch", () => {
		const axis = build( {
			axisOptions: { tickResolution: 'day', tickFormat: () => 'x', numTicks: 2 },
		} );

		expect( axis.numTicks ).toBe( 2 );
	} );

	it( 'narrows the format to the zoom window on a multi-year dataset', () => {
		const axis = build( {
			dataSorted: dailySeries( '2023-01-01T15:00:00Z', 1100 ),
			zoomDomain: [ new Date( '2024-03-01T15:00:00Z' ), new Date( '2024-08-01T15:00:00Z' ) ],
		} );

		const labels = new Set(
			( axis.tickValues as Date[] ).map( tick => axis.tickFormat?.( tick, 0, [] ) )
		);

		expect( labels.size ).toBeGreaterThan( 1 );
	} );

	it( 'selects ticks only from the series the chart renders', () => {
		const dataSorted = [
			{ ...dailySeries( '2026-06-01T15:00:00Z', 90 )[ 0 ], label: 'hidden' },
			{ ...dailySeries( '2026-08-01T15:00:00Z', 5 )[ 0 ], label: 'shown' },
		];

		const ticks = build( {
			dataSorted,
			isSeriesRendered: series => series.label === 'shown',
		} ).tickValues as Date[];

		const rendered = dataSorted[ 1 ].data.map( point => Number( point.date ) );
		expect( ticks.length ).toBeGreaterThan( 1 );
		for ( const tick of ticks ) {
			expect( rendered ).toContain( tick.getTime() );
		}
	} );

	it( "lets a caller's own tickValues win", () => {
		const mine = [ new Date( '2026-08-05T15:00:00Z' ) ];

		const axis = build( { axisOptions: { tickResolution: 'day', tickValues: mine } } );

		expect( axis.tickValues ).toBe( mine );
	} );

	it( 'labels ticks in the host time zone', () => {
		// 2026-08-02T15:30Z is Aug 2 in Los Angeles and Aug 3 in Tokyo.
		const axis = build( { formatting: { locale: 'de-DE', timeZone: 'Asia/Tokyo' } } );

		expect( axis.tickFormat?.( new Date( '2026-08-02T15:30:00Z' ), 0, [] ) ).toBe( '3. Aug.' );
	} );

	it( 'falls back to the runtime locale and zone when no formatting is supplied', () => {
		const axis = build( { formatting: {} } );

		expect( axis.tickFormat?.( new Date( '2026-08-02T15:30:00Z' ), 0, [] ) ).toBe( 'Aug 2' );
	} );
	it( 'keeps its own selection when a caller passes tickValues as undefined', () => {
		const axis = build( { axisOptions: { tickResolution: 'day', tickValues: undefined } } );

		expect( ( axis.tickValues as Date[] ).length ).toBeGreaterThan( 1 );
	} );

	it( 'keeps its width-fitted count when a caller passes numTicks as undefined', () => {
		const isoDay = ( value: unknown ) => new Date( Number( value ) ).toISOString().slice( 0, 10 );

		const axis = build( {
			width: 180,
			axisOptions: { tickResolution: 'day', tickFormat: isoDay, numTicks: undefined },
		} );

		expect( axis.numTicks ).toBeLessThan( 10 );
	} );

	it( 'hands visx a width-fitted count rather than an empty selection', () => {
		const axis = build( {
			zoomDomain: [ new Date( '2027-01-01T00:00:00Z' ), new Date( '2027-01-02T00:00:00Z' ) ],
		} );

		expect( axis.tickValues ).toBeUndefined();
		expect( typeof axis.numTicks ).toBe( 'number' );
	} );

	it( 'accepts a numeric scale domain', () => {
		const axis = build( {
			scaleDomain: [ Date.parse( '2026-08-05T15:00:00Z' ), Date.parse( '2026-08-08T15:00:00Z' ) ],
		} );

		const ticks = axis.tickValues as Date[];
		expect( ticks.length ).toBeGreaterThan( 0 );
		for ( const tick of ticks ) {
			expect( tick.getTime() ).toBeGreaterThanOrEqual( Date.parse( '2026-08-05T15:00:00Z' ) );
			expect( tick.getTime() ).toBeLessThanOrEqual( Date.parse( '2026-08-08T15:00:00Z' ) );
		}
	} );

	it( "keeps a caller's orientation and display", () => {
		const axis = build( {
			axisOptions: { tickResolution: 'day', orientation: 'top', display: false },
		} );

		expect( axis.orientation ).toBe( 'top' );
		expect( axis.display ).toBe( false );
	} );

	it( 'sends no numTicks when it selects the tick values itself', () => {
		expect( 'numTicks' in build() ).toBe( false );
	} );

	it( 'reads the resolution from the series it renders, not the hidden ones', () => {
		const dataSorted = [
			{ ...hourlySeries( '2026-08-01T00:00:00Z', 48 )[ 0 ], label: 'hidden' },
			{ ...dailySeries( '2026-08-01T15:00:00Z', 5 )[ 0 ], label: 'shown' },
		];

		const axis = build( { dataSorted, isSeriesRendered: series => series.label === 'shown' } );

		// A daily label, not one of the hidden series' hours.
		expect( axis.tickFormat?.( new Date( '2026-08-02T15:00:00Z' ), 0, [] ) ).not.toMatch(
			/(AM|PM|Uhr)/
		);
	} );
} );
