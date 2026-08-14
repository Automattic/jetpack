import { getBucketResolution, getFormatter } from '../time-axis';
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

// The test script pins TZ and locale, so local formatting is deterministic.
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

	it( 'keeps hour ticks up to a full week of sub-daily data', () => {
		const formatter = getFormatter(
			toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 24 * 7 + 1 ) )
		);

		expect( formatter( new Date( '2026-08-05T13:00:00' ).getTime() ) ).toMatch( /1\sPM/ );
	} );

	it( 'keeps date ticks for a two-point daily series spanning exactly a day', () => {
		const formatter = getFormatter(
			toSeries( dailyDates( new Date( '2026-08-01T00:00:00' ), 2 ) )
		);

		expect( formatter( new Date( '2026-08-02T00:00:00' ).getTime() ) ).toMatch( /Aug 2/ );
	} );

	it( 'keeps date ticks for daily data over the same multi-day span', () => {
		const formatter = getFormatter(
			toSeries( dailyDates( new Date( '2026-08-01T00:00:00' ), 3 ) )
		);

		expect( formatter( new Date( '2026-08-02T00:00:00' ).getTime() ) ).toMatch( /Aug 2/ );
		expect( formatter( new Date( '2026-08-02T13:00:00' ).getTime() ) ).not.toMatch( /PM/ );
	} );

	it( 'keeps date ticks for daily buckets across a spring-forward transition', () => {
		// A 23-hour first gap, as a daily series straddling spring-forward
		// produces, must not demote the series to the sub-daily regime.
		const start = new Date( '2026-03-08T00:00:00' );
		const dstDates = [ 0, 23, 47, 71 ].map(
			offsetHours => new Date( start.getTime() + offsetHours * 60 * 60 * 1000 )
		);
		const formatter = getFormatter( toSeries( dstDates ) );

		expect( formatter( dstDates[ 2 ].getTime() ) ).not.toMatch( /AM|PM/ );
		expect( formatter( dstDates[ 2 ].getTime() ) ).toMatch( /Mar/ );
	} );

	it( 'keeps date ticks when no series has two points', () => {
		const formatter = getFormatter( [
			...toSeries( [ new Date( '2026-03-01T00:00:00' ) ] ),
			...toSeries( [ new Date( '2026-03-04T00:00:00' ) ] ),
		] );

		expect( formatter( new Date( '2026-03-02T00:00:00' ).getTime() ) ).toMatch( /Mar 2/ );
	} );

	it( 'uses month ticks for buckets exactly a shortest-month apart', () => {
		const formatter = getFormatter(
			toSeries( [
				new Date( '2026-02-01T00:00:00' ),
				new Date( '2026-03-01T00:00:00' ),
				new Date( '2026-04-01T00:00:00' ),
			] )
		);

		expect( formatter( new Date( '2026-03-01T00:00:00' ).getTime() ) ).toBe( 'Mar' );
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

	it( 'keeps month ticks for monthly buckets spanning several years', () => {
		const monthlyDates = Array.from(
			{ length: 36 },
			( _, i ) => new Date( Date.UTC( 2024, i, 1 ) )
		);
		const formatter = getFormatter( toSeries( monthlyDates ) );

		// Year ticks here would render the same year for every tick the band scale
		// samples out of a calendar year.
		expect( formatter( new Date( '2024-10-01T00:00:00' ).getTime() ) ).toBe( 'Oct' );
		expect( formatter( new Date( '2025-01-01T00:00:00' ).getTime() ) ).toBe( '2025' );
	} );

	it( 'uses year ticks for inferred yearly buckets that do not start in January', () => {
		const formatter = getFormatter(
			toSeries( [ new Date( '2023-07-01T00:00:00' ), new Date( '2024-07-01T00:00:00' ) ] )
		);

		// The month regime would print a bare "Jul" for both.
		expect( formatter( new Date( '2023-07-01T00:00:00' ).getTime() ) ).toBe( '2023' );
		expect( formatter( new Date( '2024-07-01T00:00:00' ).getTime() ) ).toBe( '2024' );
	} );

	it( 'ignores series with no dated points when measuring the span', () => {
		const formatter = getFormatter( [
			...toSeries( dailyDates( new Date( '2024-01-01T00:00:00' ), 14 ) ),
			...toSeries( [] ),
		] );

		// An empty comparison series must not turn the span into NaN, which would
		// fall through every span check to year ticks.
		expect( formatter( new Date( '2024-01-03T00:00:00' ).getTime() ) ).toMatch( /Jan 3/ );
	} );

	it( 'falls back to date ticks when nothing is dated', () => {
		const formatter = getFormatter( toSeries( [] ) );

		expect( formatter( new Date( '2024-01-03T00:00:00' ).getTime() ) ).toMatch( /Jan 3/ );
	} );

	describe( 'with an explicit tickResolution', () => {
		it( 'uses hour ticks for two hourly points a day apart, where spacing would read as daily', () => {
			const formatter = getFormatter(
				toSeries( [ new Date( '2026-08-01T00:00:00' ), new Date( '2026-08-02T00:00:00' ) ] ),
				'hour'
			);

			expect( formatter( new Date( '2026-08-01T13:00:00' ).getTime() ) ).toMatch( /1\sPM/ );
		} );

		it( 'uses date ticks for a lone daily point, where spacing is unknowable', () => {
			const formatter = getFormatter( toSeries( [ new Date( '2026-08-02T00:00:00' ) ] ), 'day' );

			expect( formatter( new Date( '2026-08-02T00:00:00' ).getTime() ) ).toMatch( /Aug 2/ );
		} );

		it( 'uses month ticks for monthly buckets regardless of their measured gaps', () => {
			const formatter = getFormatter(
				toSeries( [ new Date( '2026-02-01T00:00:00' ), new Date( '2026-03-01T00:00:00' ) ] ),
				'month'
			);

			expect( formatter( new Date( '2026-03-01T00:00:00' ).getTime() ) ).toBe( 'Mar' );
		} );

		it( 'uses date ticks for weekly buckets', () => {
			const weeklyDates = Array.from(
				{ length: 8 },
				( _, i ) => new Date( Date.UTC( 2026, 0, 5 + i * 7 ) )
			);
			const formatter = getFormatter( toSeries( weeklyDates ), 'week' );

			expect( formatter( new Date( '2026-01-12T00:00:00' ).getTime() ) ).toMatch( /Jan 12/ );
		} );

		it( 'uses year ticks for a pair of yearly buckets', () => {
			const formatter = getFormatter(
				toSeries( [ new Date( '2025-01-01T00:00:00' ), new Date( '2026-01-01T00:00:00' ) ] ),
				'year'
			);

			expect( formatter( new Date( '2025-01-01T00:00:00' ).getTime() ) ).toBe( '2025' );
			expect( formatter( new Date( '2026-01-01T00:00:00' ).getTime() ) ).toBe( '2026' );
		} );

		it( 'uses year ticks for yearly buckets that do not start in January', () => {
			const formatter = getFormatter(
				toSeries( [ new Date( '2025-06-01T00:00:00' ), new Date( '2026-06-01T00:00:00' ) ] ),
				'year'
			);

			expect( formatter( new Date( '2025-06-01T00:00:00' ).getTime() ) ).toBe( '2025' );
			expect( formatter( new Date( '2026-06-01T00:00:00' ).getTime() ) ).toBe( '2026' );
		} );
	} );
} );

describe( 'getBucketResolution', () => {
	it( 'infers hourly buckets from sub-daily spacing', () => {
		expect(
			getBucketResolution( toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 6 ) ) )
		).toBe( 'hour' );
	} );

	it( 'infers daily buckets from daily spacing', () => {
		expect(
			getBucketResolution( toSeries( dailyDates( new Date( '2026-08-01T00:00:00' ), 5 ) ) )
		).toBe( 'day' );
	} );

	it( 'infers daily buckets from weekly spacing, which labels the same way', () => {
		const weeklyDates = Array.from(
			{ length: 5 },
			( _, i ) => new Date( Date.UTC( 2026, 0, 5 + i * 7 ) )
		);

		expect( getBucketResolution( toSeries( weeklyDates ) ) ).toBe( 'day' );
	} );

	it( 'infers monthly buckets from a shortest-month gap', () => {
		expect(
			getBucketResolution(
				toSeries( [ new Date( '2026-02-01T00:00:00' ), new Date( '2026-03-01T00:00:00' ) ] )
			)
		).toBe( 'month' );
	} );

	it( 'infers yearly buckets from a yearly gap', () => {
		expect(
			getBucketResolution(
				toSeries( [ new Date( '2025-06-01T00:00:00' ), new Date( '2026-06-01T00:00:00' ) ] )
			)
		).toBe( 'year' );
	} );

	it( 'keeps a daily gap across spring-forward out of the hourly bucket', () => {
		const start = new Date( '2026-03-08T00:00:00' );
		const dstDates = [ 0, 23, 47 ].map(
			offsetHours => new Date( start.getTime() + offsetHours * 60 * 60 * 1000 )
		);

		expect( getBucketResolution( toSeries( dstDates ) ) ).toBe( 'day' );
	} );

	it( 'reports daily buckets when no series has two points', () => {
		// Unmeasurable spacing reads as Infinity, which must not be mistaken for a
		// very coarse bucket.
		expect( getBucketResolution( toSeries( [ new Date( '2026-08-02T00:00:00' ) ] ) ) ).toBe(
			'day'
		);
	} );

	it( 'reports a declared resolution over the measured spacing', () => {
		const hourly = toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 6 ) );

		expect( getBucketResolution( hourly, 'month' ) ).toBe( 'month' );
	} );

	it( 'reports a declared weekly resolution as daily', () => {
		// Weeks and days are both calendar-date buckets as far as labelling goes,
		// and 'week' is not a label format of its own.
		expect( getBucketResolution( toSeries( [] ), 'week' ) ).toBe( 'day' );
	} );
} );
