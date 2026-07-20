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
		localTZDate: ( value: number | Date ) =>
			new TZDateMini( typeof value === 'number' ? value : value.getTime(), '+00:00' ),
	};
} );
/**
 * External dependencies
 */
import { endOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
import { buildRangePatch } from '../build-range-patch';

describe( 'buildRangePatch', () => {
	// A rolling sub-day window: `to` sits mid-day, exactly where end-of-day
	// rounding would corrupt it.
	const from = new Date( '2026-07-09T14:30:00.000Z' );
	const to = new Date( '2026-07-10T14:30:00.000Z' );

	it( 'returns null when there is nothing to stage', () => {
		expect( buildRangePatch( { effective: {} } ) ).toBeNull();
		expect( buildRangePatch( { nextRange: { from, to: undefined }, effective: {} } ) ).toBeNull();
	} );

	it( 'keeps a preset range `to` untouched instead of extending it to the end of the day', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'last-24-hours',
			effective: {},
		} );

		expect( patch ).toEqual( {
			from: '2026-07-09T14:30:00.000Z',
			to: '2026-07-10T14:30:00.000Z',
			preset: 'last-24-hours',
		} );
	} );

	it( 'extends calendar and manual edits to the end of the day', () => {
		const expected = endOfDay( to ).getTime();

		const custom = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'custom',
			effective: {},
		} );
		const manual = buildRangePatch( { nextRange: { from, to }, effective: {} } );

		expect( new Date( custom?.to ?? '' ).getTime() ).toBe( expected );
		expect( new Date( manual?.to ?? '' ).getTime() ).toBe( expected );
		expect( expected ).toBeGreaterThan( to.getTime() );
	} );

	it( 're-derives the comparison range from the new primary range when enabled', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'last-24-hours',
			effective: { comp: '1', compare_preset: 'previous-period' },
		} );

		expect( patch ).toMatchObject( {
			compare_from: '2026-07-08T14:30:00.000Z',
			compare_to: '2026-07-09T14:30:00.000Z',
		} );
	} );

	it( 'does not derive a comparison range when comparison is disabled', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'last-24-hours',
			effective: { compare_preset: 'previous-period' },
		} );

		expect( patch?.compare_from ).toBeUndefined();
		expect( patch?.compare_to ).toBeUndefined();
	} );

	it( 'stages only the preset when the range is absent', () => {
		expect( buildRangePatch( { nextPresetId: 'last-7-days', effective: {} } ) ).toEqual( {
			preset: 'last-7-days',
		} );
	} );
} );
