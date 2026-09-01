/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import { DETAIL_SURFACE_PRESETS, dateToISOStringWithTZ } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { useDetailDateControls } from './use-detail-date-controls';

// A zone ahead of UTC, so a visitor-zone reading of the wall time would land on
// a different day than the site's.
const TIME_ZONE = 'Asia/Taipei';
const DEFAULTS = getSettings();

beforeAll( () => {
	setSettings( {
		...DEFAULTS,
		timezone: { offset: 8, offsetFormatted: '8', string: TIME_ZONE, abbr: '' },
	} );
} );

afterAll( () => {
	setSettings( DEFAULTS );
} );

/**
 * A date-filter controller slice with nothing applied, overridable per test.
 *
 * @param overrides - Fields to set on the slice.
 * @return The controller slice.
 */
function filters( overrides: Partial< Parameters< typeof useDetailDateControls >[ 1 ] > = {} ) {
	return {
		appliedPresetId: undefined,
		appliedRange: {},
		replaceRange: jest.fn(),
		timeZone: TIME_ZONE,
		...overrides,
	};
}

describe( 'useDetailDateControls', () => {
	it( 'offers the preset pills alone, anchored on the site-local publish instant', () => {
		const { result } = renderHook( () =>
			useDetailDateControls( '2026-07-08 00:29:35', filters() )
		);

		expect( result.current ).toMatchObject( {
			presetIds: DETAIL_SURFACE_PRESETS,
			withCustomRange: false,
			withIntervalControl: false,
			onStep: undefined,
		} );
		// Half past midnight in Taipei, not in the runner's zone.
		expect( result.current.allTimeStart?.toISOString() ).toBe( '2026-07-07T16:29:35.000Z' );
	} );

	it( 'reads an offset-bearing publish instant as given', () => {
		const { result } = renderHook( () =>
			useDetailDateControls( '2026-07-08 10:29:35Z', filters() )
		);

		expect( result.current.allTimeStart?.toISOString() ).toBe( '2026-07-08T10:29:35.000Z' );
	} );

	it( 'leaves all time unanchored while the publish date is unknown or unreadable', () => {
		expect(
			renderHook( () => useDetailDateControls( undefined, filters() ) ).result.current.allTimeStart
		).toBeUndefined();
		expect(
			renderHook( () => useDetailDateControls( 'not a date', filters() ) ).result.current
				.allTimeStart
		).toBeUndefined();
	} );

	it( 're-anchors an applied all-time range once the publish date resolves', () => {
		const replaceRange = jest.fn();
		const unanchored = { from: new Date( '2020-01-01T00:00:00+08:00' ), to: new Date() };
		const { rerender } = renderHook(
			( { publishedDate }: { publishedDate?: string } ) =>
				useDetailDateControls(
					publishedDate,
					filters( { appliedPresetId: 'all-time', appliedRange: unanchored, replaceRange } )
				),
			{ initialProps: {} }
		);

		expect( replaceRange ).not.toHaveBeenCalled();

		rerender( { publishedDate: '2026-07-08 00:29:35' } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		const [ range, presetId ] = replaceRange.mock.calls[ 0 ];
		expect( presetId ).toBe( 'all-time' );
		expect( dateToISOStringWithTZ( range.from, TIME_ZONE ) ).toBe(
			'2026-07-08T00:00:00.000+08:00'
		);
	} );

	it( 'leaves an all-time range that already starts on the publish day alone', () => {
		const replaceRange = jest.fn();
		renderHook( () =>
			useDetailDateControls(
				'2026-07-08 00:29:35',
				filters( {
					appliedPresetId: 'all-time',
					appliedRange: { from: new Date( '2026-07-08T00:00:00+08:00' ), to: new Date() },
					replaceRange,
				} )
			)
		);

		expect( replaceRange ).not.toHaveBeenCalled();
	} );

	it( 'never touches a range that is not all time', () => {
		const replaceRange = jest.fn();
		renderHook( () =>
			useDetailDateControls(
				'2026-07-08 00:29:35',
				filters( {
					appliedPresetId: 'last-7-days',
					appliedRange: { from: new Date( '2020-01-01T00:00:00+08:00' ), to: new Date() },
					replaceRange,
				} )
			)
		);

		expect( replaceRange ).not.toHaveBeenCalled();
	} );
} );
