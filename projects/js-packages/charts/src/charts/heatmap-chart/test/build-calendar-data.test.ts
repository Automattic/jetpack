import { buildCalendarHeatmapData } from '../private/build-calendar-data';
import type { DataPointDate } from '../../../types';

const series: DataPointDate[] = [
	{ dateString: '2024-01-01', value: 3 }, // Mon
	{ dateString: '2024-01-03', value: 5 }, // Wed
	{ dateString: '2024-01-15', value: 2 }, // Mon (3rd week)
];

describe( 'buildCalendarHeatmapData', () => {
	test( 'returns empty result for empty input', () => {
		expect( buildCalendarHeatmapData( [] ) ).toEqual( { data: [], rowLabels: [] } );
	} );

	test( 'groups days into week columns of 7 rows', () => {
		const { data } = buildCalendarHeatmapData( series );
		expect( data ).toHaveLength( 3 ); // weeks containing Jan 1, Jan 8, Jan 15
		data.forEach( column => expect( column.data ).toHaveLength( 7 ) );
	} );

	test( 'Monday week start places Jan 1 (Mon) in row 0', () => {
		const { data, rowLabels } = buildCalendarHeatmapData( series, { weekStartsOn: 1 } );
		expect( data[ 0 ].data[ 0 ].value ).toBe( 3 );
		expect( data[ 0 ].data[ 2 ].value ).toBe( 5 ); // Wed
		expect( rowLabels[ 0 ] ).toBe( 'Mon' );
		expect( rowLabels[ 2 ] ).toBe( 'Wed' );
		expect( rowLabels[ 4 ] ).toBe( 'Fri' );
		expect( rowLabels[ 1 ] ).toBe( '' );
	} );

	test( 'fills missing days with null', () => {
		const { data } = buildCalendarHeatmapData( series );
		expect( data[ 0 ].data[ 1 ].value ).toBeNull(); // Tue Jan 2 has no datum
	} );

	test( 'hides the week-completion days outside the span by default', () => {
		const midWeek: DataPointDate[] = [
			{ dateString: '2024-01-03', value: 5 }, // Wed
			{ dateString: '2024-01-09', value: 2 }, // Tue (2nd week)
		];
		const { data } = buildCalendarHeatmapData( midWeek, {
			weekStartsOn: 1,
		} );

		// Mon Jan 1 and Tue Jan 2 precede the span — hidden; Wed Jan 3 opens it.
		expect( data[ 0 ].data[ 0 ].hidden ).toBe( true );
		expect( data[ 0 ].data[ 1 ].hidden ).toBe( true );
		expect( data[ 0 ].data[ 2 ].hidden ).toBeUndefined();

		// Thu Jan 4 is inside the span with no entry — a blank cell, not hidden.
		expect( data[ 0 ].data[ 3 ].hidden ).toBeUndefined();
		expect( data[ 0 ].data[ 3 ].value ).toBeNull();

		// Tue Jan 9 closes the span; Wed Jan 10 onward is hidden.
		expect( data[ 1 ].data[ 1 ].hidden ).toBeUndefined();
		expect( data[ 1 ].data[ 2 ].hidden ).toBe( true );
		expect( data[ 1 ].data[ 6 ].hidden ).toBe( true );
	} );

	test( 'out-of-span days stay blank cells when hideOutOfRangeDays is false', () => {
		const midWeek: DataPointDate[] = [ { dateString: '2024-01-03', value: 5 } ]; // Wed
		const { data } = buildCalendarHeatmapData( midWeek, {
			weekStartsOn: 1,
			hideOutOfRangeDays: false,
		} );
		expect( data[ 0 ].data[ 0 ].hidden ).toBeUndefined();
		expect( data[ 0 ].data[ 0 ].value ).toBeNull();
	} );

	test( 'labels only the first column of each month', () => {
		const multiMonth: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 1 },
			{ dateString: '2024-02-05', value: 1 },
		];
		const { data } = buildCalendarHeatmapData( multiMonth );
		expect( data[ 0 ].label ).toBe( 'Jan' );
		const labels = data.map( c => c.label ).filter( Boolean );
		expect( labels ).toContain( 'Feb' );
	} );

	test( 'suppresses a partial first month label so it cannot collide with the next', () => {
		// Jan 29 is the only January column; February should be the first visible label.
		const partialFirstMonth: DataPointDate[] = [
			{ dateString: '2024-01-29', value: 1 },
			{ dateString: '2024-02-05', value: 1 },
		];
		const { data } = buildCalendarHeatmapData( partialFirstMonth, { weekStartsOn: 1 } );
		expect( data[ 0 ].label ).toBe( '' );
		expect( data.map( c => c.label ).filter( Boolean )[ 0 ] ).toBe( 'Feb' );
	} );

	test( 'keeps the first month label when the range never reaches a second month', () => {
		// Single-month ranges keep their lone month label.
		const singleMonth: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 1 },
			{ dateString: '2024-01-03', value: 2 },
		];
		const { data } = buildCalendarHeatmapData( singleMonth, { weekStartsOn: 1 } );
		expect( data ).toHaveLength( 1 );
		expect( data[ 0 ].label ).toBe( 'Jan' );
	} );

	test( 'filters out entries with unparseable or missing dates', () => {
		const mixed: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 3 },
			{ dateString: 'not-a-date', value: 9 },
			{ date: new Date( NaN ), value: 7 },
			{ value: 1 }, // neither date nor dateString
		];
		const { data } = buildCalendarHeatmapData( mixed );
		expect( data ).toHaveLength( 1 ); // only Jan 1 survives -> one week column
		const values = data.flatMap( column => column.data.map( cell => cell.value ) );
		expect( values ).toContain( 3 );
		expect( values ).not.toContain( 9 );
		expect( values ).not.toContain( 7 );
	} );

	test( 'returns empty result when every entry has an invalid date', () => {
		const allInvalid: DataPointDate[] = [
			{ dateString: 'nope', value: 1 },
			{ date: new Date( NaN ), value: 2 },
		];
		expect( buildCalendarHeatmapData( allInvalid ) ).toEqual( { data: [], rowLabels: [] } );
	} );

	test( 'duplicate days keep the last value (no aggregation)', () => {
		const dupes: DataPointDate[] = [
			{ dateString: '2024-01-01', value: 3 },
			{ dateString: '2024-01-01', value: 8 },
		];
		const { data } = buildCalendarHeatmapData( dupes, { weekStartsOn: 1 } );
		expect( data[ 0 ].data[ 0 ].value ).toBe( 8 ); // last write wins, not summed to 11
	} );

	test( 'Sunday week start shifts rows and labels (Sun/Tue/Thu)', () => {
		// gridStart snaps to Sun Dec 31 2023, so Mon Jan 1 lands in row 1.
		const { data, rowLabels } = buildCalendarHeatmapData( series, { weekStartsOn: 0 } );
		expect( data[ 0 ].data[ 1 ].value ).toBe( 3 ); // Mon Jan 1
		expect( data[ 0 ].data[ 3 ].value ).toBe( 5 ); // Wed Jan 3
		expect( rowLabels[ 0 ] ).toBe( 'Sun' );
		expect( rowLabels[ 2 ] ).toBe( 'Tue' );
		expect( rowLabels[ 4 ] ).toBe( 'Thu' );
	} );
} );

describe( 'buildCalendarHeatmapData with a grid wider than the series', () => {
	// Mon Jan 1 2024 through Sun Jan 7 — one whole week of data.
	const oneWeek: DataPointDate[] = [
		{ dateString: '2024-01-01', value: 3 },
		{ dateString: '2024-01-07', value: 4 },
	];

	test( 'draws the extra weeks and marks them placeholders, not blank cells', () => {
		const { data } = buildCalendarHeatmapData( oneWeek, {
			weekStartsOn: 1,
			gridSpan: { start: '2023-12-04' }, // 4 weeks earlier
		} );

		expect( data ).toHaveLength( 5 );

		// The filler weeks stand for days nothing was measured for.
		expect( data[ 0 ].data.every( cell => cell.placeholder === true ) ).toBe( true );
		expect( data[ 3 ].data.every( cell => cell.placeholder === true ) ).toBe( true );

		// The data week is untouched: real values, no placeholder flag.
		expect( data[ 4 ].data[ 0 ] ).toMatchObject( { value: 3 } );
		expect( data[ 4 ].data[ 0 ].placeholder ).toBeUndefined();
		expect( data[ 4 ].data[ 6 ] ).toMatchObject( { value: 4 } );
	} );

	test( 'labels the filler columns so the grid still reads as a calendar', () => {
		const { data } = buildCalendarHeatmapData( oneWeek, {
			weekStartsOn: 1,
			gridSpan: { start: '2023-12-04' },
		} );

		expect( data.map( column => column.label ) ).toEqual( [ 'Dec', '', '', '', 'Jan' ] );
	} );

	test( 'ignores a bound that would cut into the series', () => {
		const { data } = buildCalendarHeatmapData( oneWeek, {
			weekStartsOn: 1,
			gridSpan: { start: '2024-01-04', end: '2024-01-05' },
		} );

		expect( data ).toHaveLength( 1 );
		expect( data[ 0 ].data[ 0 ].value ).toBe( 3 );
		expect( data[ 0 ].data[ 6 ].value ).toBe( 4 );
	} );

	test( 'falls back to the series span for an unparseable bound', () => {
		const { data } = buildCalendarHeatmapData( oneWeek, {
			weekStartsOn: 1,
			gridSpan: { start: 'not-a-date' },
		} );

		expect( data ).toHaveLength( 1 );
	} );

	test( 'separates the ragged edge from the filler', () => {
		// The grid opens Mon Dec 25 and closes with the series on Wed Jan 3, so
		// Thu Jan 4 onward only completes the last week.
		const { data } = buildCalendarHeatmapData( [ { dateString: '2024-01-03', value: 5 } ], {
			weekStartsOn: 1,
			gridSpan: { start: '2023-12-25' },
		} );

		const lastColumn = data[ data.length - 1 ];

		// Inside the requested grid, before the data: filler.
		expect( lastColumn.data[ 0 ].placeholder ).toBe( true );
		expect( lastColumn.data[ 0 ].hidden ).toBeUndefined();

		expect( lastColumn.data[ 2 ].value ).toBe( 5 );

		// Past the grid's end: the calendar's ragged edge, painted as nothing.
		expect( lastColumn.data[ 3 ].hidden ).toBe( true );
		expect( lastColumn.data[ 3 ].placeholder ).toBeUndefined();
	} );

	test( 'is a no-op when no grid span is given', () => {
		expect( buildCalendarHeatmapData( oneWeek, { weekStartsOn: 1 } ) ).toEqual(
			buildCalendarHeatmapData( oneWeek, { weekStartsOn: 1, gridSpan: {} } )
		);
	} );

	// The caller sizes the grid in whole weeks back from the period's last day, so
	// the bound lands on that weekday — a Monday only one year in seven.
	test( 'opens on a whole column when the start bound falls mid-week', () => {
		const { data } = buildCalendarHeatmapData( oneWeek, {
			weekStartsOn: 1,
			gridSpan: { start: '2023-12-07' }, // a Thursday
		} );

		expect( data ).toHaveLength( 5 );

		// Mon Dec 4 through Wed Dec 6 precede the bound; they are as unmeasured as
		// the rest of the filler, so they fill the column rather than notching it.
		expect( data[ 0 ].data.every( cell => cell.placeholder === true ) ).toBe( true );
		expect( data[ 0 ].data.some( cell => cell.hidden ) ).toBe( false );
	} );

	test( 'still draws the ragged edge past the grid end', () => {
		// Wed Jan 3 ends the series, so Thu Jan 4 onward only completes the week.
		const { data } = buildCalendarHeatmapData( [ { dateString: '2024-01-03', value: 5 } ], {
			weekStartsOn: 1,
			gridSpan: { start: '2023-12-20' }, // a Wednesday
		} );

		expect( data[ 0 ].data.every( cell => cell.placeholder === true ) ).toBe( true );

		const lastColumn = data[ data.length - 1 ];
		expect( lastColumn.data[ 2 ].value ).toBe( 5 );
		expect( lastColumn.data[ 3 ].hidden ).toBe( true );
	} );

	test( 'keeps the ragged start edge when the bound is ignored', () => {
		// A narrowing bound never applies, so the series' own first week stays
		// ragged rather than being filled out.
		const { data } = buildCalendarHeatmapData( [ { dateString: '2024-01-03', value: 5 } ], {
			weekStartsOn: 1,
			gridSpan: { start: '2024-01-05' },
		} );

		expect( data ).toHaveLength( 1 );
		expect( data[ 0 ].data[ 0 ].hidden ).toBe( true );
		expect( data[ 0 ].data[ 0 ].placeholder ).toBeUndefined();
	} );
} );
