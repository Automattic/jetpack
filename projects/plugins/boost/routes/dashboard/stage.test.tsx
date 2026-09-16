/* eslint-disable testing-library/no-node-access */
import 'jetpack-js-tools/jest/setup-jest-dom';
// Test dependencies come from the plugin, not the wp-build route package.
// eslint-disable-next-line import/no-extraneous-dependencies
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { stage as Stage } from './stage';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();

jest.mock( '../../_inc/overview/overview', () => ( {
	__esModule: true,
	default: ( { isVisible }: { isVisible: boolean } ) => (
		<div data-visible={ isVisible }>Performance Overview</div>
	),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( { tab: new URLSearchParams( globalThis.location.search ).get( 'tab' ) } ),
	useNavigate: () => mockNavigate,
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <main>{ children }</main>,
} ) );

const subpages = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
];

const getSettingsMount = () => document.getElementById( 'jb-settings-tab-mount' );
const getSubpageMount = () => document.getElementById( 'jb-subpage-mount' );

beforeEach( () => {
	window.history.replaceState( null, '', '/?page=jetpack-boost' );
	Object.assign( window, { wpApiSettings: { root: '/wp-json/', nonce: 'test-nonce' } } );
	mockNavigate.mockReset();
	setGettingStarted( false );
	jest.spyOn( globalThis, 'fetch' ).mockImplementation( jest.fn() );
} );

afterEach( () => {
	jest.useRealTimers();
	jest.mocked( globalThis.fetch ).mockRestore();
} );

const setGettingStarted = ( value: boolean ) => {
	window.jetpack_boost_ds = {
		rest_api: { nonce: 'test-nonce', value: 'https://example.org/wp-json/jetpack-boost-ds' },
		getting_started: { nonce: 'test-nonce', value },
	};
};

describe( 'Boost dashboard stage', () => {
	it.each( [
		[ '', 'Overview' ],
		[ '&tab=settings', 'Settings' ],
	] )( 'selects %s as the %s tab', ( query, tab ) => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ query }` );
		render( <Stage /> );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toBe(
			screen.getByRole( 'tab', { name: tab } )
		);
		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute(
			'data-visible',
			String( tab === 'Overview' )
		);
		expect( getSettingsMount() ).not.toBeNull();
		expect( screen.getByRole( 'tabpanel' ).tabIndex ).toBe( 0 );
		expect( screen.getByRole( 'tabpanel' ).contains( getSettingsMount() ) ).toBe(
			tab === 'Settings'
		);
	} );

	it.each(
		subpages.flatMap( hash => [
			[ hash, '' ],
			[ hash, '&tab=settings' ],
		] )
	)( 'shows #%s in the full-page slot with query %s', ( hash, query ) => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ query }#/${ hash }` );
		render( <Stage /> );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'false' );
		expect( getSubpageMount()?.closest( '[role="tabpanel"]' ) ).toBeNull();
		expect( screen.queryAllByRole( 'tablist' ) ).toHaveLength( 0 );
		expect( getSettingsMount() ).not.toBeNull();
	} );

	it.each( [ 'cache-debug-log', 'critical-css-advanced' ] )(
		'returns to Settings when leaving #%s',
		hash => {
			window.history.replaceState( null, '', `/?page=jetpack-boost#/${ hash }` );
			render( <Stage /> );

			act( () => {
				window.history.replaceState( null, '', '/?page=jetpack-boost#/' );
				window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
			} );

			expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: true } );
			expect( getSubpageMount()?.hidden ).toBe( true );
		}
	);

	it( 'follows pushState navigation into and out of a subpage', () => {
		window.history.replaceState( null, '', '/?page=jetpack-boost&tab=settings' );
		render( <Stage /> );
		expect( getSubpageMount()?.hidden ).toBe( true );

		act( () => {
			window.history.pushState(
				null,
				'',
				'/?page=jetpack-boost&tab=settings#/critical-css-advanced'
			);
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.queryAllByRole( 'tablist' ) ).toHaveLength( 0 );
		expect( mockNavigate ).not.toHaveBeenCalled();

		act( () => {
			window.history.pushState( null, '', '/?page=jetpack-boost&tab=settings#/' );
		} );

		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: true } );
	} );

	it( 'keeps Overview and both mount nodes across tab changes and subpage visits', () => {
		const { rerender } = render( <Stage /> );
		const overview = screen.getByText( 'Performance Overview' );
		const settingsMount = getSettingsMount();
		const subpageMount = getSubpageMount();

		for ( const url of [
			'/?page=jetpack-boost&tab=settings',
			'/?page=jetpack-boost&tab=settings#/critical-css-advanced',
			'/?page=jetpack-boost&tab=settings#/',
			'/?page=jetpack-boost',
		] ) {
			act( () => {
				window.history.replaceState( null, '', url );
				window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
			} );
			rerender( <Stage /> );

			expect( screen.getByText( 'Performance Overview' ) ).toBe( overview );
			expect( getSettingsMount() ).toBe( settingsMount );
			expect( getSubpageMount() ).toBe( subpageMount );
		}
	} );

	it( 'uses the route query when selecting a tab', () => {
		render( <Stage /> );

		// This suite uses fireEvent because Boost does not depend on user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: false } );
	} );

	it( 'keeps the loader when the live onboarding value stays true after leaving Getting Started', async () => {
		setGettingStarted( true );
		let resolveRequest!: ( response: Response ) => void;
		const request = new Promise< Response >( resolve => {
			resolveRequest = resolve;
		} );
		jest.mocked( globalThis.fetch ).mockReturnValueOnce( request );
		const routeReady = jest.fn();
		window.addEventListener( 'jetpack-boost:route-ready', routeReady );
		render( <Stage /> );

		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( getSettingsMount() ).not.toBeNull();

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );

		expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		expect( globalThis.fetch ).toHaveBeenCalledWith(
			'https://example.org/wp-json/jetpack-boost-ds/getting-started',
			expect.objectContaining( { method: 'GET' } )
		);
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		const text = jest.fn().mockResolvedValue( JSON.stringify( { status: 'success', JSON: true } ) );
		await act( async () => {
			resolveRequest( { ok: true, text } as unknown as Response );
		} );
		await waitFor( () => expect( text ).toHaveBeenCalled() );

		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		} );
		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( routeReady ).not.toHaveBeenCalled();
		window.removeEventListener( 'jetpack-boost:route-ready', routeReady );
	} );

	it( 'shows Overview when the live onboarding value is false after leaving Getting Started', async () => {
		setGettingStarted( true );
		let resolveRequest!: ( response: Response ) => void;
		const request = new Promise< Response >( resolve => {
			resolveRequest = resolve;
		} );
		jest.mocked( globalThis.fetch ).mockReturnValueOnce( request );
		const routeReady = jest.fn();
		window.addEventListener( 'jetpack-boost:route-ready', routeReady );
		render( <Stage /> );

		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( getSettingsMount() ).not.toBeNull();

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );

		expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		expect( globalThis.fetch ).toHaveBeenCalledWith(
			'https://example.org/wp-json/jetpack-boost-ds/getting-started',
			expect.objectContaining( { method: 'GET' } )
		);
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		const text = jest
			.fn()
			.mockResolvedValue( JSON.stringify( { status: 'success', JSON: false } ) );
		await act( async () => {
			resolveRequest( { ok: true, text } as unknown as Response );
		} );
		await waitFor( () => expect( text ).toHaveBeenCalled() );

		await expect( screen.findByText( 'Performance Overview' ) ).resolves.toHaveAttribute(
			'data-visible',
			'true'
		);
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( routeReady ).not.toHaveBeenCalled();
		window.removeEventListener( 'jetpack-boost:route-ready', routeReady );
	} );

	it( 'polls until the onboarding save finishes after navigation', async () => {
		jest.useFakeTimers();
		setGettingStarted( true );
		let persistedGettingStarted = true;
		jest.mocked( globalThis.fetch ).mockImplementation( async () => {
			return {
				ok: true,
				text: async () => JSON.stringify( { status: 'success', JSON: persistedGettingStarted } ),
			} as Response;
		} );
		window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		const { unmount } = render( <Stage /> );

		await act( async () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );

		expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		persistedGettingStarted = false;
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 1000 );
		} );

		expect( globalThis.fetch ).toHaveBeenCalledTimes( 2 );
		await expect( screen.findByText( 'Performance Overview' ) ).resolves.toHaveAttribute(
			'data-visible',
			'true'
		);
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 5000 );
		} );
		expect( globalThis.fetch ).toHaveBeenCalledTimes( 2 );
		unmount();
	} );

	it( 'stops polling after fifteen seconds and keeps the onboarding loader', async () => {
		jest.useFakeTimers();
		setGettingStarted( true );
		jest.mocked( globalThis.fetch ).mockResolvedValue( {
			ok: true,
			text: async () => JSON.stringify( { status: 'success', JSON: true } ),
		} as Response );
		window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		const { unmount } = render( <Stage /> );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 2000 );
		} );
		expect( globalThis.fetch ).not.toHaveBeenCalled();

		await act( async () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );
		expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );

		for ( let second = 0; second < 16; second++ ) {
			await act( async () => {
				await jest.advanceTimersByTimeAsync( 1000 );
			} );
		}
		const requestCount = jest.mocked( globalThis.fetch ).mock.calls.length;
		expect( requestCount ).toBeGreaterThanOrEqual( 14 );
		expect( requestCount ).toBeLessThanOrEqual( 16 );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 5000 );
		} );
		expect( globalThis.fetch ).toHaveBeenCalledTimes( requestCount );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		unmount();
	} );

	it( 'shows Overview without a loader once onboarding is done', () => {
		setGettingStarted( false );
		render( <Stage /> );

		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'true' );
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
	} );

	it( 'does not re-navigate when the Settings redirect rewrites history', () => {
		mockNavigate.mockImplementation( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost&tab=settings#/' );
		} );
		render( <Stage /> );

		act( () => {
			window.history.pushState( null, '', '/?page=jetpack-boost#/cache-debug-log' );
		} );

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/' );
		} );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: true } );
	} );
} );
