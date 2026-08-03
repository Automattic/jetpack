/**
 * Mocks: the data package reads the site timezone from the WordPress core
 * store. Pin the timezone to UTC so day-bound math is deterministic
 * regardless of the machine timezone running the tests.
 */
jest.mock( '@jetpack-premium-analytics/data', () => {
	const { TZDateMini } = jest.requireActual( '@date-fns/tz' );
	return {
		getSiteTimezone: () => '+00:00',
		dateToISOStringWithLocalTZ: ( date: Date ) => new Date( date.getTime() ).toISOString(),
		localTZDate: ( value: number ) => new TZDateMini( value, '+00:00' ),
	};
} );
/**
 * Internal dependencies
 */
import { deriveComparisonRange } from '../derive-comparison-range';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';

describe( 'deriveComparisonRange', () => {
	it( 'returns undefined when comparison is disabled or the preset is missing', () => {
		const range = { from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' };

		expect(
			deriveComparisonRange( { ...range, compare_preset: 'previous-period' } )
		).toBeUndefined();
		expect( deriveComparisonRange( { ...range, comp: '1' } ) ).toBeUndefined();
	} );

	it( 'derives a day-aligned previous period for day-aligned ranges', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-06-07T23:59:59.999Z',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-05-25T00:00:00.000Z',
			compare_to: '2026-05-31T23:59:59.999Z',
		} );
	} );

	it( 'mirrors the exact window for rolling ranges like last-24-hours', () => {
		// The inclusive, hour-aligned shape the last-24-hours preset produces.
		// The comparison ends 1ms before the primary begins rather than sharing
		// that instant, so the two windows stay adjacent and never overlap.
		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:00:00.000Z',
				to: '2026-07-10T13:59:59.999Z',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-07-08T14:00:00.000Z',
			compare_to: '2026-07-09T13:59:59.999Z',
		} );
	} );

	// A link saved while the preset existed drops its comparison rather than
	// deriving a range the picker can no longer show. Typed as a string
	// because that is what the URL carries, whatever the current set is.
	it( 'returns undefined for a preset outside the current set', () => {
		const presetFromOldUrl: string = 'previous-week';

		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:30:00.000Z',
				comp: '1',
				compare_preset: presetFromOldUrl as ComparisonPresetId,
			} )
		).toBeUndefined();
	} );
} );
