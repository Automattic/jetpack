/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { planDateStep } from '../plan-date-step';
import { computePrimaryRange } from '../presets/primary';

const TIMEZONE = 'UTC';
const NOW = new Date( '2026-08-20T12:00:00.000Z' );

beforeAll( () => {
	jest.useFakeTimers();
} );

afterAll( () => {
	jest.useRealTimers();
} );

/**
 * Whole days on the site's clock.
 *
 * @param from - First day, as `[ year, month, day ]` with a 1-based month.
 * @param to   - Last day, likewise.
 * @return The inclusive range.
 */
function wholeDays( from: [ number, number, number ], to: [ number, number, number ] ) {
	return {
		from: new TZDate( from[ 0 ], from[ 1 ] - 1, from[ 2 ], 0, 0, 0, 0, TIMEZONE ),
		to: new TZDate( to[ 0 ], to[ 1 ] - 1, to[ 2 ], 23, 59, 59, 999, TIMEZONE ),
	};
}

describe( 'planDateStep', () => {
	const context = { timeZone: TIMEZONE, now: NOW };
	const weekBeforeLast = wholeDays( [ 2026, 8, 7 ], [ 2026, 8, 13 ] );

	// The presets read the clock; hand it back as found, since a group sibling
	// sharing the registry may have frozen it for its own run.
	let clock: number;
	beforeEach( () => {
		clock = Date.now();
		jest.setSystemTime( NOW );
	} );
	afterEach( () => jest.setSystemTime( clock ) );

	it.each( [
		[
			'back before the earliest date the plan allows',
			weekBeforeLast,
			'previous',
			{ earliestDate: weekBeforeLast.from },
		],
		[ 'forward from the latest window', wholeDays( [ 2026, 8, 14 ], [ 2026, 8, 20 ] ), 'next', {} ],
		[
			'anywhere from all time',
			wholeDays( [ 2020, 1, 1 ], [ 2026, 8, 20 ] ),
			'next',
			{ presetId: 'all-time' },
		],
	] as const )( 'refuses a step %s', ( _name, range, direction, extra ) => {
		expect( planDateStep( range, direction, { ...context, ...extra } ) ).toBeUndefined();
	} );

	it( 'names the landing as the preset whose window it is today', () => {
		expect( planDateStep( weekBeforeLast, 'next', context ) ).toEqual( {
			range: computePrimaryRange( 'last-7-days', TIMEZONE ),
			presetId: 'last-7-days',
		} );
	} );

	it( 'keeps the landing custom when the plan locks the preset it is', () => {
		expect(
			planDateStep( weekBeforeLast, 'next', { ...context, lockedPresetIds: [ 'last-7-days' ] } )
		).toMatchObject( { presetId: 'custom' } );
	} );

	// Twelve whole months stepped forward close the running August, days the
	// report has no data for; the landing is the to-date window instead.
	it( 'pulls a forward step that runs past today back to it', () => {
		const step = planDateStep( wholeDays( [ 2024, 9, 1 ], [ 2025, 8, 31 ] ), 'next', context );

		expect( step ).toEqual( {
			range: wholeDays( [ 2025, 9, 1 ], [ 2026, 8, 20 ] ),
			presetId: 'last-12-months',
		} );
	} );
} );
