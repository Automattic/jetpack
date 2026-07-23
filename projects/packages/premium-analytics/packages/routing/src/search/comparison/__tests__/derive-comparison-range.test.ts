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
		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:30:00.000Z',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-07-08T14:30:00.000Z',
			compare_to: '2026-07-09T14:30:00.000Z',
		} );
	} );

	it( 'keeps the time of day for previous-week on rolling ranges', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:30:00.000Z',
				comp: '1',
				compare_preset: 'previous-week',
			} )
		).toEqual( {
			compare_from: '2026-07-02T14:30:00.000Z',
			compare_to: '2026-07-03T14:30:00.000Z',
		} );
	} );
} );
