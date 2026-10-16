import { buildMonthCalendarHeatmapData } from '../build-month-calendar-data';

const range = { start: '2026-08-01', end: '2026-09-14' };
const cellAt = (
	result: ReturnType< typeof buildMonthCalendarHeatmapData >,
	month: number,
	weekday: number,
	week: number
) => result.data[ month * 7 + weekday ].data[ week ];

describe( 'buildMonthCalendarHeatmapData', () => {
	test( 'draws one 7 × 6 block per month between the range ends', () => {
		const { data, columnGroups } = buildMonthCalendarHeatmapData( {}, range, { locale: 'en-US' } );
		expect( data ).toHaveLength( 14 );
		data.forEach( column => {
			expect( column.data ).toHaveLength( 6 );
			expect( column.label ).toBeUndefined();
		} );
		expect( columnGroups ).toEqual( [
			{ label: 'Aug', span: 7 },
			{ label: 'Sep', span: 7 },
		] );
	} );

	test( 'orders weekdays from Monday by default and from Sunday on request', () => {
		// Aug 1 2026 is a Saturday.
		const monday = buildMonthCalendarHeatmapData( { '2026-08-01': 1 }, range );
		expect( cellAt( monday, 0, 5, 0 ).value ).toBe( 1 );
		expect( cellAt( monday, 0, 0, 0 ).hidden ).toBe( true );

		const sunday = buildMonthCalendarHeatmapData( { '2026-08-01': 1 }, range, { weekStartsOn: 0 } );
		expect( cellAt( sunday, 0, 6, 0 ).value ).toBe( 1 );
	} );

	test( 'hides days outside the month and the rows past its last week', () => {
		const result = buildMonthCalendarHeatmapData( {}, range );
		// Aug 2026 runs Sat 1 → Mon 31 and needs all six rows from Monday Jul 27.
		expect( cellAt( result, 0, 4, 0 ).hidden ).toBe( true ); // Fri Jul 31
		expect( cellAt( result, 0, 0, 5 ).hidden ).toBeUndefined(); // Mon Aug 31
		expect( cellAt( result, 0, 1, 5 ).hidden ).toBe( true ); // Tue Sep 1
		// Sep 2026 fits in five rows from Monday Aug 31, so its sixth row is overflow.
		expect( cellAt( result, 1, 0, 0 ).hidden ).toBe( true ); // Mon Aug 31
		expect( cellAt( result, 1, 2, 4 ).hidden ).toBeUndefined(); // Wed Sep 30
		expect( cellAt( result, 1, 0, 5 ).hidden ).toBe( true ); // Mon Oct 5
	} );

	test( 'fades days inside a drawn month but outside the range as placeholders', () => {
		const result = buildMonthCalendarHeatmapData( {}, range );
		// Sep 14 2026 is a Monday: row 2 col 0. Tue Sep 15 is the first day past the range.
		expect( cellAt( result, 1, 0, 2 ).placeholder ).toBeUndefined();
		expect( cellAt( result, 1, 1, 2 ).placeholder ).toBe( true );
		expect( cellAt( result, 1, 1, 2 ).hidden ).toBeUndefined();
		expect( cellAt( result, 1, 2, 4 ).placeholder ).toBe( true ); // Wed Sep 30
	} );

	test( 'fades days before a mid-month start', () => {
		const result = buildMonthCalendarHeatmapData( {}, { start: '2026-08-10', end: '2026-08-20' } );
		expect( cellAt( result, 0, 5, 0 ).placeholder ).toBe( true ); // Sat Aug 1
		expect( cellAt( result, 0, 0, 1 ).placeholder ).toBe( true ); // Mon Aug 3
		expect( cellAt( result, 0, 0, 2 ).placeholder ).toBeUndefined(); // Mon Aug 10
	} );

	test( 'reads values by day and leaves missing days null', () => {
		const result = buildMonthCalendarHeatmapData(
			{ '2026-08-03': 4, '2026-08-04': NaN, '2026-08-05': null },
			range
		);
		expect( cellAt( result, 0, 0, 1 ).value ).toBe( 4 );
		expect( cellAt( result, 0, 1, 1 ).value ).toBeNull();
		expect( cellAt( result, 0, 2, 1 ).value ).toBeNull();
		expect( cellAt( result, 0, 3, 1 ).value ).toBeNull();
	} );

	test( 'labels every day with its full date in the locale', () => {
		// Read from Intl rather than spelled out: short month names drift between ICU builds.
		const monthLabels = ( locale: string ) => {
			const format = new Intl.DateTimeFormat( locale, {
				month: 'short',
				calendar: 'gregory',
				timeZone: 'UTC',
			} );
			return [ '2026-08-01', '2026-09-01' ].map( day =>
				format.format( new Date( `${ day }T00:00:00Z` ) )
			);
		};
		const result = buildMonthCalendarHeatmapData( {}, range, { locale: 'en-US' } );
		expect( cellAt( result, 0, 0, 1 ).label ).toBe( 'Mon, Aug 3, 2026' );
		for ( const locale of [ 'fr-FR', 'ja-JP' ] ) {
			const { columnGroups } = buildMonthCalendarHeatmapData( {}, range, { locale } );
			expect( columnGroups.map( group => group.label ) ).toEqual( monthLabels( locale ) );
		}
	} );

	test( 'labels Gregorian months under a locale whose default calendar is not Gregorian', () => {
		const result = buildMonthCalendarHeatmapData(
			{},
			{ start: '2026-09-01', end: '2026-09-30' },
			{ locale: 'fa-IR' }
		);
		const gregorian = new Intl.DateTimeFormat( 'fa-IR', {
			month: 'short',
			calendar: 'gregory',
			timeZone: 'UTC',
		} );
		expect( result.columnGroups ).toEqual( [
			{ label: gregorian.format( new Date( '2026-09-01T00:00:00Z' ) ), span: 7 },
		] );
	} );

	test( 'handles a leap February and a range inside one month', () => {
		const leap = buildMonthCalendarHeatmapData( {}, { start: '2028-02-01', end: '2028-02-29' } );
		expect( leap.data ).toHaveLength( 7 );
		// Feb 29 2028 is a Tuesday in the fifth week row.
		expect( cellAt( leap, 0, 1, 4 ).hidden ).toBeUndefined();
		expect( cellAt( leap, 0, 2, 4 ).hidden ).toBe( true );
	} );

	test( 'spans a year boundary', () => {
		const { columnGroups } = buildMonthCalendarHeatmapData(
			{},
			{ start: '2025-10-01', end: '2026-09-14' },
			{ locale: 'en-US' }
		);
		expect( columnGroups.map( group => group.label ) ).toEqual( [
			'Oct',
			'Nov',
			'Dec',
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
		] );
	} );

	test( 'adds the year to the month labels once a range passes twelve months', () => {
		const thirteen = buildMonthCalendarHeatmapData(
			{},
			{ start: '2025-09-15', end: '2026-09-14' },
			{ locale: 'en-US' }
		);
		const labels = thirteen.columnGroups.map( group => group.label );
		expect( labels ).toHaveLength( 13 );
		expect( labels[ 0 ] ).toBe( 'Sep 2025' );
		expect( labels[ 12 ] ).toBe( 'Sep 2026' );

		const twelve = buildMonthCalendarHeatmapData(
			{},
			{ start: '2025-10-01', end: '2026-09-14' },
			{ locale: 'en-US' }
		);
		expect( twelve.columnGroups[ 0 ].label ).toBe( 'Oct' );
	} );

	test.each( [
		[ '2026-08-29', 5, 4 ], // Sat
		[ '2026-08-30', 6, 4 ], // Sun
		[ '2026-08-31', 0, 5 ], // Mon
	] )( 'measures from a start on %s and fades the month before it', ( start, weekday, week ) => {
		const result = buildMonthCalendarHeatmapData( { [ start ]: 2 }, { start, end: '2026-09-14' } );
		expect( cellAt( result, 0, weekday, week ) ).toMatchObject( { value: 2 } );
		expect( cellAt( result, 0, weekday, week ).placeholder ).toBeUndefined();
		expect( cellAt( result, 0, 0, 1 ).placeholder ).toBe( true ); // Mon Aug 3
	} );

	test( 'keeps a placeholder empty even when the map holds a value for that day', () => {
		const result = buildMonthCalendarHeatmapData( { '2026-09-20': 7 }, range );
		// Sun Sep 20 2026 sits past the range end in row 2.
		expect( cellAt( result, 1, 6, 2 ) ).toMatchObject( { value: null, placeholder: true } );
	} );

	test.each( [
		[ 'an unparseable start', { start: '2026-8-1', end: '2026-09-14' } ],
		[ 'an unparseable end', { start: '2026-08-01', end: 'today' } ],
		[ 'an impossible day', { start: '2026-02-30', end: '2026-03-01' } ],
		[ 'a reversed range', { start: '2026-09-14', end: '2026-08-01' } ],
	] )( 'returns an empty grid and warns once on %s', ( _, badRange ) => {
		expect( buildMonthCalendarHeatmapData( {}, badRange ) ).toEqual( {
			data: [],
			columnGroups: [],
		} );
		expect( console ).toHaveWarned();
	} );

	test( 'skips keys that are not yyyy-MM-dd with one warning', () => {
		const result = buildMonthCalendarHeatmapData( { 'Aug 3 2026': 9, '2026-08-03': 4 }, range );
		expect( cellAt( result, 0, 0, 1 ).value ).toBe( 4 );
		expect( console ).toHaveWarned();
	} );
} );
