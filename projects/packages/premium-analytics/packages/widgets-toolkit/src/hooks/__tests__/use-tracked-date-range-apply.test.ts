/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { resetTracksIdentityForTesting, useTrackedDateRangeApply } from '../use-track-event';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: jest.fn(),
		identifyUser: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( { getScriptData: () => ( {} ) } ) );

type Params = ReturnType< ReportDateFilters[ 'onApply' ] >;

const EVENT = 'jetpack_premium_analytics_date_range_apply';

const LAST_7_DAYS = {
	preset: 'last-7-days',
	from: '2026-09-16T00:00:00+00:00',
	to: '2026-09-22T23:59:59+00:00',
	interval: 'day',
} as const;

const COMPARISON = {
	comp: '1',
	compare_from: '2026-09-09T00:00:00+00:00',
	compare_to: '2026-09-15T23:59:59+00:00',
} as const;

function apply(
	committed: Params,
	context: Parameters< typeof useTrackedDateRangeApply >[ 1 ] = {
		surface: 'dashboard',
		section: 'traffic',
		offersComparison: true,
	}
) {
	const onApply = jest.fn( () => committed );
	const { result } = renderHook( () => useTrackedDateRangeApply( onApply, context ) );

	return result.current();
}

describe( 'useTrackedDateRangeApply', () => {
	beforeEach( () => {
		mockRecordEvent.mockClear();
		resetTracksIdentityForTesting();
	} );

	it( 'records a preset with its interval and returns the committed params', () => {
		const committed = { ...LAST_7_DAYS };

		expect( apply( committed ) ).toBe( committed );
		expect( mockRecordEvent ).toHaveBeenCalledWith( EVENT, {
			surface: 'dashboard',
			section: 'traffic',
			range_type: 'preset',
			preset: 'last-7-days',
			interval: 'day',
			comparison: 'none',
		} );
	} );

	it( 'records a custom range without a preset', () => {
		apply( { ...LAST_7_DAYS, preset: 'custom' } );

		const [ , properties ] = mockRecordEvent.mock.calls[ 0 ];
		expect( properties ).toMatchObject( { range_type: 'custom' } );
		expect( properties ).not.toHaveProperty( 'preset' );
	} );

	it( 'records the comparison preset, defaulting to previous-period', () => {
		apply( { ...LAST_7_DAYS, ...COMPARISON, compare_preset: 'previous-year' } );
		apply( { ...LAST_7_DAYS, ...COMPARISON } );

		expect( mockRecordEvent.mock.calls.map( ( [ , p ] ) => p.comparison ) ).toEqual( [
			'previous-year',
			'previous-period',
		] );
	} );

	it( 'records no comparison on a surface that does not show one', () => {
		apply( { ...LAST_7_DAYS, ...COMPARISON }, { surface: 'post_detail', offersComparison: false } );

		expect( mockRecordEvent ).toHaveBeenCalledWith( EVENT, {
			surface: 'post_detail',
			range_type: 'preset',
			preset: 'last-7-days',
			interval: 'day',
			comparison: 'none',
		} );
	} );

	it( 'records nothing when nothing was committed', () => {
		expect( apply( undefined ) ).toBeUndefined();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );
