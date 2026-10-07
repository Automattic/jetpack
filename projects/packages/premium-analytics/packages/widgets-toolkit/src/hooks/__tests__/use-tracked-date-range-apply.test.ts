/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { computePrimaryRange, localTZDate } from '@jetpack-premium-analytics/datetime';
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { resetTracksIdentityForTesting, useTrackedDateRangeApply } from '../use-track-event';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const recordEvent = jest.mocked( analytics.tracks.recordEvent );

type State = Parameters< typeof useTrackedDateRangeApply >[ 0 ];
type Context = Parameters< typeof useTrackedDateRangeApply >[ 1 ];

const EVENT = 'jetpack_premium_analytics_date_range_apply';
const LAST_30_DAYS = computePrimaryRange( 'last-30-days', 'UTC' )!;
const LAST_7_DAYS = computePrimaryRange( 'last-7-days', 'UTC' )!;
const DASHBOARD: Context = { surface: 'dashboard', section: 'traffic', offersComparison: true };

// The date filters as a render left them: the range applied before the click, by weeks.
function renderTracked( overrides: Partial< State > = {}, context: Context = DASHBOARD ) {
	const state: State = {
		presetId: 'last-30-days',
		range: LAST_30_DAYS,
		interval: 'week',
		comparisonPresetId: undefined,
		appliedComparisonRange: undefined,
		...overrides,
	};
	const { result } = renderHook( () => useTrackedDateRangeApply( state, context ) );

	return result.current;
}

function trackedProperties() {
	expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	return recordEvent.mock.calls[ 0 ][ 1 ];
}

describe( 'useTrackedDateRangeApply', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		resetTracksIdentityForTesting();
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
	} );

	it( 'records a quick preset staged and applied in the same tick', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked();

		act( () => {
			trackedOnChange( LAST_7_DAYS, 'last-7-days' );
			trackedOnApply();
		} );

		// Last 7 days allows days only, so the staged weeks coerce as `buildRangePatch` does.
		expect( recordEvent ).toHaveBeenCalledWith( EVENT, {
			surface: 'dashboard',
			section: 'traffic',
			range_type: 'preset',
			preset: 'last-7-days',
			interval: 'day',
			comparison: 'none',
		} );
	} );

	it( 'records the new preset default when switching from a preset that allowed the rendered interval', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked( {
			presetId: 'year-to-date',
			range: computePrimaryRange( 'year-to-date', 'UTC' )!,
			interval: 'week',
		} );

		act( () => {
			trackedOnChange( LAST_30_DAYS, 'last-30-days' );
			trackedOnApply();
		} );

		expect( trackedProperties() ).toMatchObject( { preset: 'last-30-days', interval: 'day' } );
	} );

	// Over a year allows months only; the rendered 30 days would keep weeks.
	it( 'records a custom range staged in the same tick from its own dates', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked();

		act( () => {
			trackedOnChange(
				{ from: localTZDate( '2025-01-01', 'UTC' ), to: localTZDate( '2026-02-04', 'UTC' ) },
				'custom'
			);
			trackedOnApply();
		} );

		const properties = trackedProperties();
		expect( properties ).toMatchObject( { range_type: 'custom', interval: 'month' } );
		expect( properties ).not.toHaveProperty( 'preset' );
	} );

	it( 'falls back to the rendered range when nothing was staged since the last apply', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked();

		act( () => {
			trackedOnChange( LAST_7_DAYS, 'last-7-days' );
			trackedOnApply();
		} );
		recordEvent.mockClear();
		act( () => trackedOnApply() );

		expect( trackedProperties() ).toMatchObject( { preset: 'last-30-days', interval: 'week' } );
	} );

	it( 'records the comparison the new range keeps', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked( {
			comparisonPresetId: 'previous-year',
		} );

		act( () => {
			trackedOnChange( LAST_7_DAYS, 'last-7-days' );
			trackedOnApply();
		} );

		expect( trackedProperties() ).toMatchObject( { comparison: 'previous-year' } );
	} );

	it( 'records the previous period when the new range drops the comparison preset', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked( {
			presetId: 'last-7-days',
			range: LAST_7_DAYS,
			interval: 'day',
			comparisonPresetId: 'previous-week',
		} );

		act( () => {
			trackedOnChange( LAST_30_DAYS, 'last-30-days' );
			trackedOnApply();
		} );

		expect( trackedProperties() ).toMatchObject( { comparison: 'previous-period' } );
	} );

	it( 'records the previous period for a comparison linked without a preset', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked( {
			appliedComparisonRange: computePrimaryRange( 'last-month', 'UTC' )!,
		} );

		act( () => {
			trackedOnChange( LAST_7_DAYS, 'last-7-days' );
			trackedOnApply();
		} );

		expect( trackedProperties() ).toMatchObject( { comparison: 'previous-period' } );
	} );

	it( 'records no comparison on a surface that does not show one', () => {
		const { trackedOnChange, trackedOnApply } = renderTracked(
			{ comparisonPresetId: 'previous-year' },
			{ surface: 'post_detail', offersComparison: false }
		);

		act( () => {
			trackedOnChange( LAST_7_DAYS, 'last-7-days' );
			trackedOnApply();
		} );

		expect( recordEvent ).toHaveBeenCalledWith( EVENT, {
			surface: 'post_detail',
			range_type: 'preset',
			preset: 'last-7-days',
			interval: 'day',
			comparison: 'none',
		} );
	} );
} );
