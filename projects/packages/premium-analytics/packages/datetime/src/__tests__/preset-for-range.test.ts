/**
 * External dependencies
 */
import { addDays, subDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { findSelectablePresetForRange } from '../preset-for-range';
import { computePrimaryRange } from '../presets/primary';

const TIMEZONE = 'America/New_York';

// File-level like its group siblings: a per-test restore would hand the real
// clock back to a suite sharing the registry that froze it for its own run.
beforeAll( () => {
	jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
} );

afterAll( () => {
	jest.useRealTimers();
} );

describe( 'findSelectablePresetForRange', () => {
	it.each( [ [ 'last-7-days' ], [ 'last-month' ], [ 'month-to-date' ] ] as const )(
		'names the window "%s" covers today',
		presetId => {
			const range = computePrimaryRange( presetId, TIMEZONE )!;

			expect( findSelectablePresetForRange( range, TIMEZONE ) ).toBe( presetId );
		}
	);

	it( 'names a window two presets cover as the calendar one when stepped from a calendar preset', () => {
		// On the 30th the month to date is also the last 30 days. Hand the clock
		// back as found: a group sibling may have frozen it for its own run.
		const now = Date.now();
		jest.setSystemTime( Date.parse( '2026-08-30T12:00:00.000Z' ) );
		try {
			const range = computePrimaryRange( 'month-to-date', TIMEZONE )!;

			expect( findSelectablePresetForRange( range, TIMEZONE ) ).toBe( 'last-30-days' );
			expect( findSelectablePresetForRange( range, TIMEZONE, { presetId: 'last-month' } ) ).toBe(
				'month-to-date'
			);
		} finally {
			jest.setSystemTime( now );
		}
	} );

	it( 'never names a window as an excluded preset', () => {
		const range = computePrimaryRange( 'last-7-days', TIMEZONE )!;

		expect(
			findSelectablePresetForRange( range, TIMEZONE, { exclude: [ 'last-7-days' ] } )
		).toBeUndefined();
	} );

	it( 'names nothing for a window a step moved off every preset', () => {
		const { from, to } = computePrimaryRange( 'last-7-days', TIMEZONE )!;

		expect(
			findSelectablePresetForRange( { from: subDays( from, 7 ), to: subDays( to, 7 ) }, TIMEZONE )
		).toBeUndefined();
	} );

	it( 'names nothing for a window that only shares an end with a preset', () => {
		const { from, to } = computePrimaryRange( 'last-7-days', TIMEZONE )!;

		expect(
			findSelectablePresetForRange( { from: addDays( from, 1 ), to }, TIMEZONE )
		).toBeUndefined();
		expect( findSelectablePresetForRange( { from }, TIMEZONE ) ).toBeUndefined();
	} );
} );
