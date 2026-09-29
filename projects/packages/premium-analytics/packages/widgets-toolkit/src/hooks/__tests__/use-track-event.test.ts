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
	const context = { surface: 'dashboard', section: 'traffic' };
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
			[ 'jetpack_premium_analytics_customize_start', context ],
			[
				'jetpack_premium_analytics_widget_add',
				{ ...context, widget_type: 'jpa/c', widget_count: 3 },
			],
			[
				'jetpack_premium_analytics_widget_add',
				{ ...context, widget_type: 'jpa/b', widget_count: 3 },
			],
			[
				'jetpack_premium_analytics_widget_remove',
				{ ...context, widget_type: 'jpa/b', widget_count: 3 },
			],
			[
				'jetpack_premium_analytics_customize_save',
				{
					...context,
					widget_count: 3,
					widgets_added: 'jpa/c,jpa/b',
					widgets_removed: 'jpa/b',
				},
			],
			[ 'jetpack_premium_analytics_customize_exit', { ...context, saved: true } ],
		] );
	} );

	it( 'records an unsaved exit on Cancel', () => {
		const { result } = renderHook( () => useTrackCustomize( 'post_detail' ) );

		act( () => result.current.exit() );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_exit', { surface: 'post_detail', saved: false } ],
		] );
	} );

	// Upstream flushes a pending inline widget edit when edit mode turns on, and that
	// commit reaches the page with no exit behind it.
	it( 'leaves an inline widget edit saving itself out of the session', async () => {
		const edited = [ { ...before[ 0 ], attributes: { view: 'table' } }, before[ 1 ] ];
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () => result.current.start() );
		act( () => result.current.layoutChange( before, edited ) );
		await act( async () => {
			await Promise.resolve();
		} );
		act( () => result.current.exit() );

		expect( events().map( ( [ name ] ) => name ) ).toEqual( [
			'jetpack_premium_analytics_customize_start',
			'jetpack_premium_analytics_customize_exit',
		] );
		expect( events().at( -1 )?.[ 1 ] ).toMatchObject( { saved: false } );
	} );

	it( 'tells widget instances apart by id, not by type', () => {
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () =>
			result.current.layoutChange( [ widget( 'a', 'jpa/x' ) ], [ widget( 'b', 'jpa/x' ) ] )
		);

		expect( events() ).toEqual( [
			[
				'jetpack_premium_analytics_widget_add',
				{ ...context, widget_type: 'jpa/x', widget_count: 1 },
			],
			[
				'jetpack_premium_analytics_widget_remove',
				{ ...context, widget_type: 'jpa/x', widget_count: 1 },
			],
		] );
	} );

	it( 'records no widget event for a commit that only rearranges', () => {
		const { result } = renderHook( () => useTrackCustomize( 'dashboard', 'traffic' ) );

		act( () => {
			result.current.layoutChange( before, [ before[ 1 ], before[ 0 ] ] );
			result.current.exit();
		} );

		expect( events() ).toEqual( [
			[
				'jetpack_premium_analytics_customize_save',
				{ ...context, widget_count: 2, widgets_added: '', widgets_removed: '' },
			],
			[ 'jetpack_premium_analytics_customize_exit', { ...context, saved: true } ],
		] );
	} );

	it( 'records a confirmed reset', () => {
		const { result } = renderHook( () => useTrackCustomize( 'video_detail' ) );

		act( () => result.current.reset() );

		expect( events() ).toEqual( [
			[ 'jetpack_premium_analytics_customize_reset', { surface: 'video_detail' } ],
		] );
	} );
} );
