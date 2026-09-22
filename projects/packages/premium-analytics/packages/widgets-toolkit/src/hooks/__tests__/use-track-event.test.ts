import { act, renderHook } from '@testing-library/react';
import { resetTracksIdentityForTesting, useTrackCustomize } from '../use-track-event';
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
			result.current.save( before, after );
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

	it( 'forgets a save once the session it belonged to has ended', () => {
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () => {
			result.current.save( before, after );
			result.current.exit();
			result.current.start();
			result.current.exit();
		} );

		expect( events().at( -1 )?.[ 1 ] ).toMatchObject( { saved: false } );
	} );

	it( 'records a confirmed reset', () => {
		const { result } = renderHook( () => useTrackCustomize( 'video_detail' ) );

		act( () => result.current.reset() );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_reset', { surface: 'video_detail' } ],
		] );
	} );
} );
