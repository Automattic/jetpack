import { act, renderHook } from '@testing-library/react';
import {
	resetTracksIdentityForTesting,
	useTrackCustomize,
	useTrackDateRangeApply,
} from '../use-track-event';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

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

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {} ),
} ) );

const widget = ( uuid: string, type = `jpa/${ uuid }` ) => ( { uuid, type } ) as DashboardWidget;

/**
 * The Tracks events recorded so far, in order.
 *
 * @return Event name and properties pairs.
 */
function events() {
	return mockRecordEvent.mock.calls;
}

beforeEach( () => {
	jest.clearAllMocks();
	resetTracksIdentityForTesting();
} );

describe( 'useTrackCustomize', () => {
	const before = [ widget( 'a' ), widget( 'b' ) ];
	const after = [ widget( 'a' ), widget( 'c' ), widget( 'd', 'jpa/b' ) ];

	it( 'records a save and a saved exit when Done commits a changed layout', () => {
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () => {
			result.current.start();
			result.current.layoutChange( before, after );
			result.current.exit();
		} );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_start', { surface: 'dashboard', section: 'traffic' } ],
			[
				'jetpack_premium_analytics_customize_save',
				{
					surface: 'dashboard',
					section: 'traffic',
					widget_count: 3,
					widgets_added: 'jpa/c,jpa/b',
					widgets_removed: 'jpa/b',
				},
			],
			[
				'jetpack_premium_analytics_customize_exit',
				{ surface: 'dashboard', section: 'traffic', saved: true },
			],
		] );
	} );

	it( 'records an unsaved exit on Cancel', () => {
		const { result } = renderHook( () => useTrackCustomize( 'post_detail' ) );

		act( () => result.current.exit() );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_exit', { surface: 'post_detail', saved: false } ],
		] );
	} );

	it( 'does not count an inline autosave as a save', async () => {
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () => result.current.layoutChange( before, after ) );
		await Promise.resolve();
		act( () => result.current.exit() );

		expect( events().map( ( [ name ] ) => name ) ).toEqual( [
			'jetpack_premium_analytics_customize_exit',
		] );
		expect( events()[ 0 ][ 1 ] ).toMatchObject( { saved: false } );
	} );

	it( 'records a confirmed reset', () => {
		const { result } = renderHook( () => useTrackCustomize( 'video_detail' ) );

		act( () => result.current.reset() );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_reset', { surface: 'video_detail' } ],
		] );
	} );
} );

describe( 'useTrackDateRangeApply', () => {
	it( 'records a preset with its interval and comparison', () => {
		const onApply = jest.fn( () => ( {
			preset: 'last-7-days' as const,
			from: '2026-09-15T00:00:00+00:00',
			to: '2026-09-21T23:59:59+00:00',
			interval: 'day' as const,
			comp: '1' as const,
			compare_from: '2026-09-08T00:00:00+00:00',
			compare_to: '2026-09-14T23:59:59+00:00',
			compare_preset: 'previous-period' as const,
		} ) );
		const { result } = renderHook( () =>
			useTrackDateRangeApply( onApply, 'dashboard', 'traffic' )
		);

		act( () => {
			result.current();
		} );

		expect( onApply ).toHaveBeenCalledTimes( 1 );
		expect( events() ).toEqual( [
			[
				'jetpack_premium_analytics_date_range_apply',
				{
					surface: 'dashboard',
					section: 'traffic',
					range_type: 'preset',
					preset: 'last-7-days',
					interval: 'day',
					comparison: 'previous-period',
				},
			],
		] );
	} );

	it( 'records a custom range without a preset', () => {
		const onApply = () => ( {
			preset: 'custom' as const,
			from: '2026-09-01T00:00:00+00:00',
			to: '2026-09-03T23:59:59+00:00',
		} );
		const { result } = renderHook( () => useTrackDateRangeApply( onApply, 'post_detail' ) );

		act( () => {
			result.current();
		} );

		expect( events() ).toEqual( [
			[
				'jetpack_premium_analytics_date_range_apply',
				{ surface: 'post_detail', range_type: 'custom', interval: 'day', comparison: 'none' },
			],
		] );
	} );

	it( 'records nothing when there was nothing to apply', () => {
		const { result } = renderHook( () => useTrackDateRangeApply( () => undefined, 'dashboard' ) );

		act( () => {
			result.current();
		} );

		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );
