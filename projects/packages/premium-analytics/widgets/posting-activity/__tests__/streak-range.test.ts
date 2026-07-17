/**
 * Internal dependencies
 */
import { resolveStreakRange } from '../streak-range';

const TODAY = '2026-07-15';
const MIN_DAYS = 365;

describe( 'resolveStreakRange', () => {
	it( 'floors a short picker range to a full year ending on its end date', () => {
		const range = resolveStreakRange( { from: '2026-07-08', to: '2026-07-15' }, MIN_DAYS, TODAY );

		expect( range.endDate ).toBe( '2026-07-15' );
		// 365 days before the end date, not the picker's 7-day start.
		expect( range.startDate ).toBe( '2025-07-15' );
	} );

	it( 'keeps a picker range that already spans more than the minimum', () => {
		const range = resolveStreakRange( { from: '2024-01-01', to: '2026-07-15' }, MIN_DAYS, TODAY );

		expect( range.endDate ).toBe( '2026-07-15' );
		// The picker reaches further back than the floor, so it is preserved.
		expect( range.startDate ).toBe( '2024-01-01' );
	} );

	it( 'ends on today and spans a year back when the report has no end date', () => {
		const range = resolveStreakRange( {}, MIN_DAYS, TODAY );

		expect( range.endDate ).toBe( '2026-07-15' );
		expect( range.startDate ).toBe( '2025-07-15' );
	} );

	it( 'derives the date part from an ISO datetime end date', () => {
		const range = resolveStreakRange(
			{ from: '2026-07-14T00:00:00Z', to: '2026-07-15T23:59:59Z' },
			MIN_DAYS,
			TODAY
		);

		expect( range.endDate ).toBe( '2026-07-15' );
		expect( range.startDate ).toBe( '2025-07-15' );
	} );

	it( 'floors from the end date even when only the start is missing', () => {
		const range = resolveStreakRange( { to: '2026-03-01' }, MIN_DAYS, TODAY );

		expect( range.endDate ).toBe( '2026-03-01' );
		expect( range.startDate ).toBe( '2025-03-01' );
	} );
} );
