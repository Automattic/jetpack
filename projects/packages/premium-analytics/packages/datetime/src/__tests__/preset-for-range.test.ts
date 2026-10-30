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
