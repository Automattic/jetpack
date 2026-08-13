/**
 * Pin the site timezone to UTC so day-bound math is deterministic regardless
 * of the machine timezone running the tests.
 */
jest.mock( '@jetpack-premium-analytics/data', () => {
	const { TZDateMini } = jest.requireActual( '@date-fns/tz' );

	/*
	 * Only the timezone reads are stubbed. `resolveIntervalForRange` stays
	 * real: a stub owning a copy of the interval rules cannot fail when the
	 * real rules change.
	 */
	return {
		...jest.requireActual( '@jetpack-premium-analytics/data' ),
		getSiteTimezone: () => '+00:00',
		dateToISOStringWithLocalTZ: ( date: Date ) => new Date( date.getTime() ).toISOString(),
		localTZDate: ( value: number | Date ) =>
			new TZDateMini( typeof value === 'number' ? value : value.getTime(), '+00:00' ),
	};
} );
/**
 * External dependencies
 */
import { canStepForward, stepDateRange } from '@jetpack-premium-analytics/datetime';
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

	// A window long enough to allow day buckets, for the cases about carrying a
	// selection rather than about coercing it.
	const wideTo = new Date( '2026-07-19T14:30:00.000Z' );

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
			interval: 'hour',
		} );
	} );

	it( 'keeps the current interval when the preset is unchanged and still allows it', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to: wideTo },
			nextPresetId: 'last-30-days',
			effective: { preset: 'last-30-days', interval: 'week' },
		} );

		expect( patch?.interval ).toBe( 'week' );
	} );

	it( 'clamps an unsupported interval to the range default', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'last-24-hours',
			effective: { preset: 'last-24-hours', interval: 'month' },
		} );

		expect( patch?.interval ).toBe( 'hour' );
	} );

	it( 'carries a still-allowed interval across a preset change', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to: wideTo },
			nextPresetId: 'last-30-days',
			effective: { preset: 'last-7-days', interval: 'day' },
		} );

		// `day` is allowed for last-30-days too, so the selection survives.
		expect( patch?.interval ).toBe( 'day' );
	} );

	// A day bucket on a day-long window draws the whole range as one bar.
	it( 'coerces a day bucket when switching to a day-long preset', () => {
		for ( const preset of [ 'last-7-days', 'last-30-days' ] as const ) {
			const patch = buildRangePatch( {
				nextRange: { from, to },
				nextPresetId: 'last-24-hours',
				effective: { preset, interval: 'day' },
			} );

			expect( patch?.interval ).toBe( 'hour' );
		}
	} );

	it( 'coerces an interval the new preset disallows', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'last-24-hours',
			effective: { preset: 'last-30-days', interval: 'week' },
		} );

		expect( patch?.interval ).toBe( 'hour' );
	} );

	it( 'carries the interval through a manual edit that leaves a preset', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to: wideTo },
			nextPresetId: 'custom',
			effective: { preset: 'last-7-days', interval: 'day' },
		} );

		expect( patch?.interval ).toBe( 'day' );
	} );

	// A stepped window carries no preset, so the same rule has to reach it
	// through the range length rather than through the preset table.
	it( 'coerces a day bucket on a day-long custom range', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'custom',
			effective: { preset: 'last-7-days', interval: 'day' },
		} );

		expect( patch?.interval ).toBe( 'hour' );
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

	it( 'keeps an exact range untouched even when it leaves a preset', () => {
		const patch = buildRangePatch( {
			nextRange: { from, to },
			nextPresetId: 'custom',
			exactRange: true,
			effective: {},
		} );

		expect( patch?.from ).toBe( '2026-07-09T14:30:00.000Z' );
		expect( patch?.to ).toBe( '2026-07-10T14:30:00.000Z' );
	} );

	/*
	 * Rounding a stepped `to` up to the end of its day stretches a rolling
	 * window on every step and pushes its next window into the future, hiding
	 * the forward arrow.
	 */
	it( 'steps a rolling window back and forward without changing its length', () => {
		const previous = stepDateRange( { from, to }, 'previous' );
		const back = buildRangePatch( {
			nextRange: previous,
			nextPresetId: 'custom',
			exactRange: true,
			effective: { preset: 'last-24-hours', interval: 'hour' },
		} );

		expect( back ).toMatchObject( {
			from: '2026-07-08T14:30:00.000Z',
			to: '2026-07-09T14:30:00.000Z',
			interval: 'hour',
			preset: 'custom',
		} );

		const backRange = { from: new Date( back?.from ?? '' ), to: new Date( back?.to ?? '' ) };
		expect( canStepForward( backRange, to ) ).toBe( true );

		const returned = stepDateRange( backRange, 'next' );
		expect( returned?.from?.getTime() ).toBe( from.getTime() );
		expect( returned?.to?.getTime() ).toBe( to.getTime() );
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
