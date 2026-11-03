import { sanitizeStatsEmailTimeSeriesResponse, sanitizeStatsTimeSeriesResponse } from '..';
import {
	emailClicksTimeSeriesFixture,
	emailOpensHourlyTimeSeriesFixture,
	emailOpensTimeSeriesFixture,
	invalidIsoWeekYearSubscribersFixture,
	invalidWeekSubscribersFixture,
	monthlySubscribersFixture,
	objectRowsTimeSeriesFixture,
	scalarDaysTimeSeriesFixture,
	visitsFixture,
	weeklySubscribersFixture,
	wpcomWeeklySubscribersFixture,
	yearlySubscribersFixture,
} from '../__fixtures__/time-series';

describe( 'Stats time-series normalizer', () => {
	it( 'normalizes visits rows with Premium Analytics date keys', () => {
		const result = sanitizeStatsTimeSeriesResponse( visitsFixture, { period: 'day' } );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				views: 21,
				visitors: 8,
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-16T23:59:59',
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-15T23:59:59',
				label: '2026-06-15',
				value: 8,
				views: 8,
				visitors: 3,
				items: [],
			} )
		);
	} );

	it( 'normalizes object rows from top-level data arrays', () => {
		const result = sanitizeStatsTimeSeriesResponse( objectRowsTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				subscribers: 7,
				unsubscribers: 2,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				value: 7,
				subscribers: 7,
				unsubscribers: 2,
			} )
		);
	} );

	it( 'normalizes ISO week rows with date ranges', () => {
		expect( sanitizeStatsTimeSeriesResponse( weeklySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-21T23:59:59',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it( 'normalizes WPCOM YYYYWMMWDD week labels to date ranges', () => {
		expect( sanitizeStatsTimeSeriesResponse( wpcomWeeklySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-29',
				date_start: '2026-06-29T00:00:00',
				date_end: '2026-07-05T23:59:59',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it.each( [
		[
			'week',
			[ '2025W12W29', '2026W01W05', '2026W10W05' ],
			'2026-01-01',
			'2026-10-07',
			[
				[ '2026-01-01T00:00:00', '2026-01-04T23:59:59' ],
				[ '2026-01-05T00:00:00', '2026-01-11T23:59:59' ],
				[ '2026-10-05T00:00:00', '2026-10-07T23:59:59' ],
			],
		],
		[
			'month',
			[ '2025-04-01', '2025-05-01', '2026-07-01' ],
			'2025-04-11',
			'2026-07-23',
			[
				[ '2025-04-11T00:00:00', '2025-04-30T23:59:59' ],
				[ '2025-05-01T00:00:00', '2025-05-31T23:59:59' ],
				[ '2026-07-01T00:00:00', '2026-07-23T23:59:59' ],
			],
		],
		[
			'year',
			[ '2022-01-01', '2023-01-01', '2026-01-01' ],
			'2022-06-15',
			'2026-10-07',
			[
				[ '2022-06-15T00:00:00', '2022-12-31T23:59:59' ],
				[ '2023-01-01T00:00:00', '2023-12-31T23:59:59' ],
				[ '2026-01-01T00:00:00', '2026-10-07T23:59:59' ],
			],
		],
	] )(
		'stamps %s buckets the requested range cuts through with the range edges',
		( unit, periods, from, to, expected ) => {
			const result = sanitizeStatsTimeSeriesResponse(
				{
					unit,
					fields: [ 'period', 'views' ],
					data: periods.map( ( period, index ) => [ period, index + 3 ] ),
				},
				{ start_date: `${ from }T00:00:00.000+01:00`, date: `${ to }T23:59:59.999+02:00` }
			);

			expect( result.data.map( ( { date_start, date_end } ) => [ date_start, date_end ] ) ).toEqual(
				expected
			);
			expect( result.summary ).toEqual(
				expect.objectContaining( {
					date_start: `${ from }T00:00:00`,
					date_end: `${ to }T23:59:59`,
				} )
			);
		}
	);

	it( 'falls back to raw period strings for invalid ISO weeks', () => {
		expect( sanitizeStatsTimeSeriesResponse( invalidWeekSubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-W54',
				date_start: '2026-W54T00:00:00',
				date_end: '2026-W54T23:59:59',
				value: 9,
				subscribers: 9,
			} )
		);
		expect(
			sanitizeStatsTimeSeriesResponse( invalidIsoWeekYearSubscribersFixture ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				time_interval: '2025-W53',
				date_start: '2025-W53T00:00:00',
				date_end: '2025-W53T23:59:59',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it( 'normalizes month and year rows with date-fns boundaries', () => {
		expect( sanitizeStatsTimeSeriesResponse( monthlySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2024-02-01',
				date_start: '2024-02-01T00:00:00',
				date_end: '2024-02-29T23:59:59',
				value: 29,
				subscribers: 29,
			} )
		);
		expect( sanitizeStatsTimeSeriesResponse( yearlySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2024-01-01',
				date_start: '2024-01-01T00:00:00',
				date_end: '2024-12-31T23:59:59',
				value: 366,
				subscribers: 366,
			} )
		);
	} );

	it( 'normalizes scalar days maps into numeric value rows', () => {
		const result = sanitizeStatsTimeSeriesResponse( scalarDaysTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				value: 10,
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15',
				value: 7,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-16',
				value: 3,
			} ),
		] );
	} );

	it( 'normalizes email opens timelines nested under the timeline key', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailOpensTimeSeriesFixture, {
			period: 'day',
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				opens_count: 21,
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-16T23:59:59',
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				label: '2026-06-15',
				value: 8,
				opens_count: 8,
				items: [],
			} )
		);
	} );

	it( 'uses the clicks metric as the headline value for click timelines', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailClicksTimeSeriesFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { clicks_count: 11 } ) );
		expect( result.data[ 1 ] ).toEqual(
			expect.objectContaining( { time_interval: '2026-06-16', value: 7, clicks_count: 7 } )
		);
	} );

	it( 'resolves hourly email timelines into distinct per-hour buckets', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailOpensHourlyTimeSeriesFixture, {
			period: 'hour',
		} );

		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15 09:00',
				date_start: '2026-06-15T09:00:00',
				date_end: '2026-06-15T09:59:59',
				label: '2026-06-15 09:00',
				value: 3,
				opens_count: 3,
				hour: 9,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-15 10:00',
				date_start: '2026-06-15T10:00:00',
				value: 5,
				opens_count: 5,
				hour: 10,
			} ),
		] );
		// The hour dimension must not be summed into the metric summary.
		expect( result.summary ).toEqual( expect.objectContaining( { opens_count: 8 } ) );
		expect( result.summary ).not.toHaveProperty( 'hour' );
	} );

	it( 'trims buckets outside a window_start/window_end window and sums only the rest', () => {
		// The last-24-hours shape: hourly buckets are anchored on the start day's
		// midnight, so leading pre-09:00 buckets arrive and must not be summed.
		const result = sanitizeStatsEmailTimeSeriesResponse(
			{
				timeline: {
					unit: 'hour',
					fields: [ 'date', 'hour', 'opens_count' ],
					data: [
						[ '2026-06-14', 8, 1 ],
						[ '2026-06-14', 9, 2 ],
						[ '2026-06-15', 8, 4 ],
						[ '2026-06-15', 9, 8 ],
					],
				},
			},
			{
				period: 'hour',
				window_start: '2026-06-14T09:00:00.000-04:00',
				window_end: '2026-06-15T08:59:59.999-04:00',
			}
		);

		expect( result.data.map( point => point.time_interval ) ).toEqual( [
			'2026-06-14 09:00',
			'2026-06-15 08:00',
		] );
		expect( result.summary ).toEqual(
			expect.objectContaining( {
				opens_count: 6,
				date_start: '2026-06-14T09:00:00',
				date_end: '2026-06-15T08:59:59',
			} )
		);
	} );

	it( 'reads window bounds as the wall clock written, only in pipeline-supported shapes', () => {
		const timeline = {
			timeline: {
				unit: 'hour',
				fields: [ 'date', 'hour', 'opens_count' ],
				data: [
					[ '2026-06-14', 8, 1 ],
					[ '2026-06-14', 9, 2 ],
					[ '2026-06-15', 8, 4 ],
					[ '2026-06-15', 9, 8 ],
				],
			},
		};

		// A seconds-less T-separated bound reads the same wall clock as the
		// full ISO shape the presets emit.
		const noSeconds = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-14T09:00-04:00',
			window_end: '2026-06-15T08:59-04:00',
		} );
		expect( noSeconds.data.map( point => point.time_interval ) ).toEqual( [
			'2026-06-14 09:00',
			'2026-06-15 08:00',
		] );

		// Space-separated datetimes already degrade upstream (getDatePart splits on
		// T only), so the trim must stay off for them rather than half-apply.
		const spaceSeparated = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-14 09:00:00-04:00',
			window_end: '2026-06-15 08:59:59-04:00',
		} );
		expect( spaceSeparated.data ).toHaveLength( 4 );
	} );

	it( 'keeps rows whose bucket bounds are not comparable wall clocks', () => {
		// An unparseable period label echoes back verbatim as its own bounds;
		// the trim must not silently discard such a row (and its counts).
		const result = sanitizeStatsEmailTimeSeriesResponse(
			{
				timeline: {
					unit: 'day',
					fields: [ 'date', 'opens_count' ],
					data: [
						[ '2026-06-15', 3 ],
						[ 'not-a-date', 5 ],
					],
				},
			},
			{ period: 'day', window_start: '2026-06-15', window_end: '2026-06-15' }
		);

		expect( result.data ).toHaveLength( 2 );
		expect( result.summary ).toEqual( expect.objectContaining( { opens_count: 8 } ) );
	} );

	it( 'widens bare-date window bounds to whole days and needs both bounds to trim', () => {
		// Hourly rows at each day's edges, so an unwidened bound drops one of them.
		const timeline = {
			timeline: {
				unit: 'hour',
				fields: [ 'date', 'hour', 'opens_count' ],
				data: [
					[ '2026-06-15', 0, 3 ],
					[ '2026-06-16', 23, 5 ],
				],
			},
		};

		const windowed = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-15',
			window_end: '2026-06-16',
		} );
		expect( windowed.data ).toHaveLength( 2 );
		expect( windowed.summary ).toEqual( expect.objectContaining( { opens_count: 8 } ) );

		// Neither a lone bound nor the generic start_date/end_date may trim —
		// range-bounded endpoints reach this sanitizer carrying those.
		const oneBound = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-16',
		} );
		expect( oneBound.data ).toHaveLength( 2 );

		const requestDates = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			start_date: '2026-06-16',
			end_date: '2026-06-16',
		} );
		expect( requestDates.data ).toHaveLength( 2 );

		// A bound the timestamp reader rejects, or an inverted window, must
		// disable the trim rather than silently empty the chart.
		const invalidBound = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-15T99:00:00',
			window_end: '2026-06-16',
		} );
		expect( invalidBound.data ).toHaveLength( 2 );

		const inverted = sanitizeStatsEmailTimeSeriesResponse( timeline, {
			period: 'hour',
			window_start: '2026-06-16',
			window_end: '2026-06-15',
		} );
		expect( inverted.data ).toHaveLength( 2 );
	} );

	it( 'normalizes hour 0 and string-typed hour values into padded per-hour buckets', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse(
			{
				timeline: {
					unit: 'hour',
					fields: [ 'date', 'opens_count' ],
					data: [
						[ '2026-06-15', '2', 0 ],
						[ '2026-06-15', '4', '23' ],
					],
				},
			},
			{ period: 'hour' }
		);

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( { time_interval: '2026-06-15 00:00', hour: 0, value: 2 } )
		);
		expect( result.data[ 1 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15 23:00',
				date_end: '2026-06-15T23:59:59',
				hour: '23',
				value: 4,
			} )
		);
	} );

	it( 'returns an empty email time series report when the timeline key is missing', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( {} );

		expect( result.data ).toEqual( [] );
		expect( result.summary ).toEqual( { date_start: '', date_end: '' } );
	} );

	it( 'restamps an offset-bearing query date as a bucket bound when no rows are returned', () => {
		const result = sanitizeStatsTimeSeriesResponse(
			{},
			{
				start_date: '2026-06-15T00:00:00-07:00',
				end_date: '2026-06-16T23:59:59-07:00',
			}
		);

		expect( result.data ).toEqual( [] );
		expect( result.summary ).toEqual( {
			date_start: '2026-06-15T00:00:00',
			date_end: '2026-06-16T23:59:59',
		} );
	} );

	it( 'resolves hourly visits rows whose period packs the date and hour together', () => {
		const result = sanitizeStatsTimeSeriesResponse(
			{
				unit: 'hour',
				fields: [ 'period', 'views' ],
				data: [
					[ '2026-06-15 09:00:00', 3 ],
					[ '2026-06-15 10:00:00', 5 ],
					[ '2026-06-16 00:00:00', 1 ],
				],
			},
			{ period: 'hour' }
		);

		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15 09:00',
				date_start: '2026-06-15T09:00:00',
				date_end: '2026-06-15T09:59:59',
				value: 3,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-15 10:00',
				date_start: '2026-06-15T10:00:00',
				value: 5,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-16 00:00',
				date_start: '2026-06-16T00:00:00',
				value: 1,
			} ),
		] );
	} );

	it( 'leaves an hourly row that carries no parseable hour on its calendar bucket', () => {
		const result = sanitizeStatsTimeSeriesResponse(
			{ unit: 'hour', fields: [ 'period', 'views' ], data: [ [ '2026-06-15', 3 ] ] },
			{ period: 'hour' }
		);

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-15T23:59:59',
			} )
		);
	} );

	// WP.com labels each UTC hour of the range in the one offset the request's `date` states.
	const fixedOffsetLabels = ( firstUtcHour: string, count: number, offsetHours: number ) =>
		Array.from( { length: count }, ( _, i ) =>
			new Date( Date.parse( firstUtcHour ) + ( i + offsetHours ) * 3600000 )
				.toISOString()
				.slice( 0, 19 )
				.replace( 'T', ' ' )
		);
	const hoursOf = ( day: string, hours: number[] ) =>
		hours.map( hour => `${ day } ${ String( hour ).padStart( 2, '0' ) }:00` );
	const allHours = Array.from( { length: 24 }, ( _, hour ) => hour );

	it.each( [
		{
			name: 'fall-back',
			query: { start_date: '2025-11-02T00:00:00.000-04:00', date: '2025-11-02T23:59:59.999-05:00' },
			utcOffset: '-05:00',
			labels: fixedOffsetLabels( '2025-11-02T04:00:00Z', 25, -5 ),
			expected: hoursOf( '2025-11-02', allHours ),
			// The EDT and EST 01:00 rows, merged.
			oneAmViews: 2 + 3,
		},
		{
			name: 'spring-forward',
			query: { start_date: '2026-03-08T00:00:00.000-05:00', date: '2026-03-08T23:59:59.999-04:00' },
			utcOffset: '-04:00',
			labels: fixedOffsetLabels( '2026-03-08T05:00:00Z', 23, -4 ),
			expected: hoursOf(
				'2026-03-08',
				allHours.filter( hour => hour !== 2 )
			),
			oneAmViews: 2,
		},
		{
			name: 'half-hour zone',
			zone: 'America/St_Johns',
			query: { start_date: '2025-11-10T00:00:00.000-03:30', date: '2025-11-10T23:59:59.999-03:30' },
			// WP.com truncates the request's -03:30 to whole hours.
			utcOffset: '-03:00',
			labels: fixedOffsetLabels( '2025-11-10T04:00:00Z', 24, -3 ),
			expected: hoursOf( '2025-11-10', allHours ),
			oneAmViews: 2,
		},
	] )(
		'reads offset-requested hourly labels back into the site zone on a $name day',
		( { zone = 'America/New_York', query, utcOffset, labels, expected, oneAmViews } ) => {
			const result = sanitizeStatsTimeSeriesResponse(
				{
					unit: 'hour',
					utc_offset: utcOffset,
					fields: [ 'period', 'views' ],
					data: labels.map( ( label, i ) => [ label, i + 1 ] ),
				},
				{ ...query, timezone: zone }
			);

			expect( result.data.map( row => row.time_interval ) ).toEqual( expected );
			expect( result.data[ 1 ].views ).toBe( oneAmViews );
			expect( result.summary.views ).toBe( ( labels.length * ( labels.length + 1 ) ) / 2 );
		}
	);

	it( 'keeps hourly labels as sent when the request states no offset, merging the repeated hour', () => {
		const labels = hoursOf( '2025-11-02', [ 0, 1, 1, ...allHours.slice( 2 ) ] ).map(
			label => `${ label }:00`
		);
		const result = sanitizeStatsTimeSeriesResponse(
			{
				unit: 'hour',
				// Today's offset, which says nothing about the labels' own.
				utc_offset: '-04:00',
				fields: [ 'period', 'views' ],
				data: labels.map( ( label, i ) => [ label, i + 1 ] ),
			},
			{ start_date: '2025-11-02', date: '2025-11-02', timezone: 'America/New_York' }
		);

		expect( result.data.map( row => row.time_interval ) ).toEqual(
			hoursOf( '2025-11-02', allHours )
		);
		expect( result.data[ 1 ].views ).toBe( 2 + 3 );
	} );

	// The shape `stats/subscribers` returns.
	it( 'orders newest-first payloads oldest first', () => {
		const result = sanitizeStatsTimeSeriesResponse(
			{
				date: '2026-06-17',
				unit: 'day',
				fields: [ 'period', 'subscribers' ],
				data: [
					[ '2026-06-17', 12 ],
					[ '2026-06-16', 11 ],
					[ '2026-06-15', 9 ],
				],
			},
			{ period: 'day' }
		);

		expect( result.data.map( row => row.time_interval ) ).toEqual( [
			'2026-06-15',
			'2026-06-16',
			'2026-06-17',
		] );
		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-15T00:00:00',
				date_end: '2026-06-17T23:59:59',
			} )
		);
	} );
} );
