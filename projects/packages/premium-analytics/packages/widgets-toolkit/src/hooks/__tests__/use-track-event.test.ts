import { act, renderHook } from '@testing-library/react';
import {
	resetTracksIdentityForTesting,
	useTrackCustomize,
	useTrackEvent,
} from '../use-track-event';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const mockSetUser = jest.fn();
const mockIdentifyUser = jest.fn();
const mockAssignSuperProps = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: ( ...args: unknown[] ) => mockSetUser( ...args ),
		identifyUser: () => mockIdentifyUser(),
		assignSuperProps: ( ...args: unknown[] ) => mockAssignSuperProps( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

const mockGetScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => mockGetScriptData(),
} ) );

const CONNECTED_READER = {
	site: { wpcom: { blog_id: 42 } },
	user: { current_user: { wpcom: { ID: 7, login: 'reader' } } },
};

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
	mockGetScriptData.mockReturnValue( {} );
} );

describe( 'useTrackEvent', () => {
	/**
	 * Records an event through a freshly mounted consumer, as each component does.
	 *
	 * @param name - The event name.
	 */
	function recordFromNewConsumer( name: string ) {
		const { result } = renderHook( () => useTrackEvent() );
		result.current( name );
	}

	it( 'identifies the reader and pins blog_id once, not per event or consumer', () => {
		mockGetScriptData.mockReturnValue( CONNECTED_READER );

		recordFromNewConsumer( 'jetpack_premium_analytics_first' );
		recordFromNewConsumer( 'jetpack_premium_analytics_second' );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockSetUser ).toHaveBeenCalledTimes( 1 );
		expect( mockSetUser ).toHaveBeenCalledWith( 7, 'reader' );
		expect( mockIdentifyUser ).toHaveBeenCalledTimes( 1 );
		expect( mockAssignSuperProps ).toHaveBeenCalledTimes( 1 );
		expect( mockAssignSuperProps ).toHaveBeenCalledWith( { blog_id: 42 } );
	} );

	it( 'identifies before the first event reaches Tracks', () => {
		mockGetScriptData.mockReturnValue( CONNECTED_READER );

		recordFromNewConsumer( 'jetpack_premium_analytics_first' );

		expect( mockIdentifyUser.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockRecordEvent.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'still records when the site carries no WPCOM identity', () => {
		recordFromNewConsumer( 'jetpack_premium_analytics_first' );

		expect( mockSetUser ).not.toHaveBeenCalled();
		expect( mockIdentifyUser ).not.toHaveBeenCalled();
		expect( mockAssignSuperProps ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_first', undefined );
	} );

	it( 'skips the blog_id super prop when the site is not connected', () => {
		mockGetScriptData.mockReturnValue( { user: CONNECTED_READER.user } );

		recordFromNewConsumer( 'jetpack_premium_analytics_first' );

		expect( mockSetUser ).toHaveBeenCalledWith( 7, 'reader' );
		expect( mockAssignSuperProps ).not.toHaveBeenCalled();
	} );
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
