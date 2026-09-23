/**
 * External dependencies
 */
import { computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { resetTracksIdentityForTesting, useTrackedDateRangeApply } from '../use-track-event';

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

type Filters = Parameters< typeof useTrackedDateRangeApply >[ 0 ];
type Context = Parameters< typeof useTrackedDateRangeApply >[ 1 ];

const EVENT = 'jetpack_premium_analytics_date_range_apply';
const LAST_30_DAYS = computePrimaryRange( 'last-30-days', 'UTC' )!;
const LAST_7_DAYS = computePrimaryRange( 'last-7-days', 'UTC' )!;
const DASHBOARD: Context = { surface: 'dashboard', section: 'traffic', offersComparison: true };

// The controller as a render left it: the range applied before the click, by weeks.
function renderTracked( overrides: Partial< Filters > = {}, context: Context = DASHBOARD ) {
	const filters: Filters = {
		onChange: jest.fn(),
		onApply: jest.fn(),
		presetId: 'last-30-days',
		range: LAST_30_DAYS,
		interval: 'week',
		comparisonPresetId: undefined,
		...overrides,
	};
	const { result } = renderHook( () => useTrackedDateRangeApply( filters, context ) );

	return { filters, tracked: result.current };
}

function trackedProperties() {
	expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
	return mockRecordEvent.mock.calls[ 0 ][ 1 ];
}

describe( 'useTrackedDateRangeApply', () => {
	beforeEach( () => {
		mockRecordEvent.mockClear();
		resetTracksIdentityForTesting();
	} );

	it( 'records a quick preset staged and applied in the same tick', () => {
		const { filters, tracked } = renderTracked();

		act( () => {
			tracked.onChange( LAST_7_DAYS, 'last-7-days' );
			tracked.onApply();
		} );

		expect( filters.onChange ).toHaveBeenCalledWith( LAST_7_DAYS, 'last-7-days' );
		expect( filters.onApply ).toHaveBeenCalledTimes( 1 );
		// Last 7 days allows days only, so the staged weeks coerce as `buildRangePatch` does.
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
		const { tracked } = renderTracked();

		act( () => tracked.onChange( LAST_7_DAYS, 'custom' ) );
		act( () => tracked.onApply() );

		const properties = trackedProperties();
		expect( properties ).toMatchObject( { range_type: 'custom' } );
		expect( properties ).not.toHaveProperty( 'preset' );
	} );

	it( 'falls back to the rendered range when nothing was staged since the last apply', () => {
		const { tracked } = renderTracked();

		act( () => {
			tracked.onChange( LAST_7_DAYS, 'last-7-days' );
			tracked.onApply();
		} );
		mockRecordEvent.mockClear();
		act( () => tracked.onApply() );

		expect( trackedProperties() ).toMatchObject( { preset: 'last-30-days', interval: 'week' } );
	} );

	it( 'records the comparison the new range keeps', () => {
		const { tracked } = renderTracked( { comparisonPresetId: 'previous-year' } );

		act( () => {
			tracked.onChange( LAST_7_DAYS, 'last-7-days' );
			tracked.onApply();
		} );

		expect( trackedProperties() ).toMatchObject( { comparison: 'previous-year' } );
	} );

	it( 'records the previous period when the new range drops the comparison preset', () => {
		const { tracked } = renderTracked( {
			presetId: 'last-7-days',
			range: LAST_7_DAYS,
			interval: 'day',
			comparisonPresetId: 'previous-week',
		} );

		act( () => {
			tracked.onChange( LAST_30_DAYS, 'last-30-days' );
			tracked.onApply();
		} );

		expect( trackedProperties() ).toMatchObject( { comparison: 'previous-period' } );
	} );

	it( 'records no comparison on a surface that does not show one', () => {
		const { tracked } = renderTracked(
			{ comparisonPresetId: 'previous-year' },
			{ surface: 'post_detail', offersComparison: false }
		);

		act( () => {
			tracked.onChange( LAST_7_DAYS, 'last-7-days' );
			tracked.onApply();
		} );

		expect( mockRecordEvent ).toHaveBeenCalledWith( EVENT, {
			surface: 'post_detail',
			range_type: 'preset',
			preset: 'last-7-days',
			interval: 'day',
			comparison: 'none',
		} );
	} );
} );
