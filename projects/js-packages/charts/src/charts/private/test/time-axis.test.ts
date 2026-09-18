import { getBandTickValues, getFormatter } from '../time-axis';
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

	it( 'dates the ticks when sub-daily data spans exactly a day', () => {
		const formatter = getFormatter(
			toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 25 ) )
		);

		expect( formatter( new Date( '2026-08-03T00:00:00' ).getTime() ) ).toMatch( /Aug 3/ );
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

describe( 'tick format anchors', () => {
	// The band axis steers ticks onto boundaries using the predicate the format
	// hangs off itself. If the two ever disagree, the axis aims at buckets that
	// do not actually print the coarser label.
	it( 'marks exactly the buckets whose label carries the coarser unit', () => {
		const hourly = Array.from( { length: 48 }, ( _, i ) => new Date( 2026, 7, 2, i ) );
		const hourFormat = getFormatter( toSeries( hourly ) );

		expect( hourFormat.isAnchor ).toBeDefined();
		hourly.forEach( date => {
			const isDateLabel = ! /(AM|PM)/.test( hourFormat( date.getTime() ) );
			expect( hourFormat.isAnchor( date ) ).toBe( isDateLabel );
		} );

		const monthly = Array.from( { length: 36 }, ( _, i ) => new Date( 2023, 6 + i, 1 ) );
		const monthFormat = getFormatter( toSeries( monthly ) );

		expect( monthFormat.isAnchor ).toBeDefined();
		monthly.forEach( date => {
			const isYearLabel = /^\d{4}$/.test( monthFormat( date.getTime() ) );
			expect( monthFormat.isAnchor( date ) ).toBe( isYearLabel );
		} );
	} );
} );

describe( 'getBandTickValues', () => {
	const monthlyDomain = ( year: number, month: number, months: number ) =>
		Array.from( { length: months }, ( _, i ) => new Date( year, month + i, 1 ) );

	const hourlyDomain = ( start: Date, hours: number ) =>
		Array.from( { length: hours }, ( _, i ) => new Date( start.getTime() + i * 60 * 60 * 1000 ) );

	const labelsFor = ( domain: Date[], maxTicks = 4 ) => {
		const formatter = getFormatter( toSeries( domain ) );
		return getBandTickValues( domain, formatter, maxTicks ).map( date =>
			formatter( date.getTime() )
		);
	};

	it( 'shifts the sampling offset onto January for a monthly series starting mid-year', () => {
		// Sampling from index 0 gives Aug, Nov, Feb, May, Aug — no year at all on a
		// series that crosses one, and "Aug" twice.
		expect( labelsFor( monthlyDomain( 2025, 7, 13 ) ) ).toContain( '2026' );
	} );

	it( 'lands on every January of a multi-year monthly series that starts mid-year', () => {
		expect( labelsFor( monthlyDomain( 2023, 6, 36 ) ) ).toEqual( [ '2024', '2025', '2026' ] );
	} );

	it( 'keeps the dated midnight ticks for sub-daily data spanning days', () => {
		// Index sampling already lands here; this pins that the steering keeps it.
		expect( labelsFor( hourlyDomain( new Date( 2026, 7, 2 ), 48 ) ) ).toEqual( [
			'Aug 2',
			'12 PM',
			'Aug 3',
			'12 PM',
		] );
	} );

	it( 'steps whole days once a sub-daily span is too long to date any other way', () => {
		// No step inside a day fits four ticks across a week, so the offset sweep
		// alone would leave every tick but the first a bare hour on an unnamed day.
		expect( labelsFor( hourlyDomain( new Date( 2026, 7, 2 ), 168 ) ) ).toEqual( [
			'Aug 2',
			'Aug 4',
			'Aug 6',
			'Aug 8',
		] );
	} );

	it( 'steps whole years once a monthly span is too long to reach January any other way', () => {
		expect( labelsFor( monthlyDomain( 2023, 6, 120 ) ) ).toEqual( [
			'2024',
			'2027',
			'2030',
			'2033',
		] );
	} );

	it( 'still names a year at the lowest tick counts a caller can ask for', () => {
		// An anchor outranks a denser axis, so without a step that reaches two of
		// them a two-tick axis would settle for a single January.
		expect( labelsFor( monthlyDomain( 2023, 6, 36 ), 2 ) ).toEqual( [ '2024', '2026' ] );
		expect( labelsFor( monthlyDomain( 2023, 6, 36 ), 3 ) ).toEqual( [ '2024', '2025', '2026' ] );
	} );

	it( 'never repeats a label on adjacent ticks', () => {
		// 49 buckets put every fourth tick a whole year apart, so sampling by index
		// spells the same month five times over: Feb, Feb, Feb, Feb, Feb.
		const labels = labelsFor( monthlyDomain( 2023, 1, 49 ) );

		expect( labels.some( ( label, i ) => i > 0 && label === labels[ i - 1 ] ) ).toBe( false );
	} );

	it( 'keeps the axis dense when only a sparser one could reach an anchor', () => {
		// Ranking anchors above everything picked the two ticks that happened to be
		// Januaries and dropped the rest of the axis with them.
		expect( labelsFor( monthlyDomain( 2023, 3, 30 ) ) ).toEqual( [ 'Apr', '2024', 'Oct', 'Jul' ] );
	} );

	it( 'names the single year of a short series without thinning the axis to it', () => {
		expect( labelsFor( monthlyDomain( 2023, 6, 9 ) ) ).toEqual( [ 'Jul', 'Oct', '2024' ] );
	} );

	it( 'reaches anchors that sit an uneven number of buckets apart', () => {
		// A spring-forward day is 23 hourly buckets, not 24, so a fixed stride
		// slides off midnight and leaves the rest of the week on bare hours.
		const domain: Date[] = [];
		for ( let day = 0; day < 7; day++ ) {
			for ( let hour = 0; hour < 24; hour++ ) {
				if ( day !== 2 || hour !== 2 ) {
					domain.push( new Date( 2026, 2, 6 + day, hour ) );
				}
			}
		}

		expect( labelsFor( domain ) ).toEqual( [ 'Mar 6', 'Mar 8', 'Mar 10', 'Mar 12' ] );
	} );

	it( 'keeps the whole domain when it already fits', () => {
		const domain = monthlyDomain( 2023, 0, 4 );

		expect( getBandTickValues( domain, String, 4 ) ).toEqual( domain );
	} );

	it( 'never exceeds the requested tick count', () => {
		const domain = monthlyDomain( 2023, 6, 36 );

		expect( getBandTickValues( domain, String, 4 ).length ).toBeLessThanOrEqual( 4 );
		expect( getBandTickValues( domain, String, 7 ).length ).toBeLessThanOrEqual( 7 );
	} );

	it( 'returns nothing for an empty domain', () => {
		expect( getBandTickValues( [], String, 4 ) ).toEqual( [] );
	} );
} );
