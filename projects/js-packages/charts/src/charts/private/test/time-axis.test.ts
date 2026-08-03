import { getFormatter } from '../time-axis';
import type { useChartDataTransform } from '../../../hooks';

type SortedData = ReturnType< typeof useChartDataTransform >;

const toSeries = ( dates: Date[] ): SortedData =>
	[
		{
			label: 'series',
			data: dates.map( date => ( { date, value: 1 } ) ),
		},
	] as unknown as SortedData;

const hourlyDates = ( start: Date, hours: number ): Date[] =>
	Array.from( { length: hours }, ( _, i ) => new Date( start.getTime() + i * 60 * 60 * 1000 ) );

const dailyDates = ( start: Date, days: number ): Date[] =>
	Array.from( { length: days }, ( _, i ) => new Date( start.getTime() + i * 24 * 60 * 60 * 1000 ) );

// TZ is pinned to UTC by the test script, so local formatting is deterministic.
describe( 'getFormatter', () => {
	it( 'uses hour ticks within a single day', () => {
		const formatter = getFormatter(
			toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 24 ) )
		);

		expect( formatter( new Date( '2026-08-02T13:00:00' ).getTime() ) ).toMatch( /1\sPM/ );
	} );

	it( 'uses hour ticks with dates at midnight for sub-daily data spanning multiple days', () => {
		const formatter = getFormatter(
			toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 48 ) )
		);

		expect( formatter( new Date( '2026-08-03T00:00:00' ).getTime() ) ).toMatch( /Aug 3/ );
		expect( formatter( new Date( '2026-08-02T13:00:00' ).getTime() ) ).toMatch( /1\sPM/ );
	} );

	it( 'keeps date ticks for daily data over the same multi-day span', () => {
		const formatter = getFormatter(
			toSeries( dailyDates( new Date( '2026-08-01T00:00:00' ), 3 ) )
		);

		expect( formatter( new Date( '2026-08-02T00:00:00' ).getTime() ) ).toMatch( /Aug 2/ );
		expect( formatter( new Date( '2026-08-02T13:00:00' ).getTime() ) ).not.toMatch( /PM/ );
	} );

	it( 'uses month ticks with the year at January for monthly buckets', () => {
		const monthlyDates = Array.from(
			{ length: 13 },
			( _, i ) => new Date( Date.UTC( 2025, 7 + i, 1 ) )
		);
		const formatter = getFormatter( toSeries( monthlyDates ) );

		expect( formatter( new Date( '2025-09-01T00:00:00' ).getTime() ) ).toBe( 'Sep' );
		expect( formatter( new Date( '2026-01-01T00:00:00' ).getTime() ) ).toBe( '2026' );
	} );

	it( 'keeps date ticks for weekly buckets within a year', () => {
		const weeklyDates = Array.from(
			{ length: 20 },
			( _, i ) => new Date( Date.UTC( 2026, 0, 5 + i * 7 ) )
		);
		const formatter = getFormatter( toSeries( weeklyDates ) );

		expect( formatter( new Date( '2026-03-02T00:00:00' ).getTime() ) ).toMatch( /Mar 2/ );
	} );

	it( 'uses year ticks beyond a year', () => {
		const yearly = getFormatter(
			toSeries( [ new Date( '2020-01-01T00:00:00' ), new Date( '2026-01-01T00:00:00' ) ] )
		);

		expect( yearly( new Date( '2023-01-01T00:00:00' ).getTime() ) ).toBe( '2023' );
	} );
} );
