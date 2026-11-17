/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { planGatesScriptData } from '../tests/js/plan-gates-test-utils';
import { useStatsDateLimits } from './use-stats-date-limits';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
const mockTrackEvent = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => mockTrackEvent,
} ) );

const LOCKED = {
	description: 'See more than the last 7 days of your stats.',
	support_url: '',
	upgrade_url: 'https://wordpress.com/checkout/example.com/personal',
};

beforeEach( () => {
	( getScriptData as jest.Mock ).mockReturnValue(
		planGatesScriptData( { 'recent-7-days': LOCKED } )
	);
} );

afterEach( () => {
	jest.useRealTimers();
	mockTrackEvent.mockClear();
} );

it( 'hands a limited surface its locks and the server upsell', () => {
	const { result } = renderHook( () => useStatsDateLimits( true ) );

	expect( result.current.offersComparison ).toBe( false );
	expect( result.current.dateLimits ).toMatchObject( {
		lockedPresetIds: expect.arrayContaining( [ 'last-30-days' ] ),
		upsell: {
			description: LOCKED.description,
			supportUrl: '',
			upgradeUrl: LOCKED.upgrade_url,
		},
	} );
} );

it.each( [
	[ 'upsell', 'recent-7-days' ],
	[ 'intervalUpsell', 'intervals' ],
] as const )( 'tracks the %s upgrade click under %s', ( upsell, feature ) => {
	( getScriptData as jest.Mock ).mockReturnValue(
		planGatesScriptData( { 'recent-7-days': LOCKED, intervals: LOCKED } )
	);
	const { result } = renderHook( () => useStatsDateLimits( true ) );

	result.current.dateLimits?.[ upsell ]?.onUpgradeClick?.();

	expect( mockTrackEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_plan_upgrade_click', {
		feature,
		source: 'locked_date_control',
	} );
} );

it( 'hands an unlimited surface nothing', () => {
	const { result } = renderHook( () => useStatsDateLimits( false ) );

	expect( result.current ).toEqual( { offersComparison: true } );
} );

it( 'moves the limits forward when the site’s day turns over', () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T23:59:00Z' ) );
	const { result } = renderHook( () => useStatsDateLimits( true ) );
	const before = result.current.dateLimits?.earliestDate?.getTime() ?? 0;

	act( () => {
		jest.advanceTimersByTime( 2 * 60 * 1000 );
	} );

	expect( result.current.dateLimits?.earliestDate?.getTime() ).toBe( before + 24 * 60 * 60 * 1000 );
} );
