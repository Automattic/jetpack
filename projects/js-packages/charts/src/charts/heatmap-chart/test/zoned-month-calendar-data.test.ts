/**
 * @jest-environment <rootDir>/tests/environment-chatham.mjs
 */

// Chatham runs ahead of UTC, so a local-time setter would land the grid a day off.
import { buildMonthCalendarHeatmapData } from '../build-month-calendar-data';

const range = { start: '2026-08-01', end: '2026-09-14' };

describe( 'buildMonthCalendarHeatmapData in a zone ahead of UTC', () => {
	test( 'keys the grid on civil days, not the runtime zone', () => {
		const { data, columnGroups } = buildMonthCalendarHeatmapData(
			{ '2026-08-01': 1, '2026-09-14': 2 },
			range,
			{ locale: 'en-US' }
		);
		expect( columnGroups.map( group => group.label ) ).toEqual( [ 'Aug', 'Sep' ] );
		// Sat Aug 1 2026: block 0, weekday 5, week 0. Mon Sep 14: block 1, weekday 0, week 2.
		expect( data[ 5 ].data[ 0 ] ).toMatchObject( { label: 'Sat, Aug 1, 2026', value: 1 } );
		expect( data[ 7 ].data[ 2 ] ).toMatchObject( { label: 'Mon, Sep 14, 2026', value: 2 } );
		expect( data[ 7 + 1 ].data[ 2 ].placeholder ).toBe( true ); // Tue Sep 15
	} );
} );
