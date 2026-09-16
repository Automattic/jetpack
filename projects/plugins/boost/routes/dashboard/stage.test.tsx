/* eslint-disable testing-library/no-node-access */
import 'jetpack-js-tools/jest/setup-jest-dom';
// Test dependencies come from the plugin, not the wp-build route package.
// eslint-disable-next-line import/no-extraneous-dependencies
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { requestDataSync } from '../../_inc/overview/lib/use-modules-state';
import { stage as Stage } from './stage';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();

jest.mock( '../../_inc/overview/lib/use-modules-state', () => ( {
	requestDataSync: jest.fn(),
} ) );

jest.mock( '../../_inc/overview/overview', () => {
	const { useEffect } = jest.requireActual< typeof import('react') >( 'react' );
	return {
		__esModule: true,
		default: function MockOverview( {
			isVisible,
			onHeaderActionChange,
		}: {
			isVisible: boolean;
			onHeaderActionChange: ( action: ReactNode ) => void;
		} ) {
			useEffect( () => {
				if ( ! isVisible ) {
					return undefined;
				}
				onHeaderActionChange( <button>Run speed test</button> );
				return () => onHeaderActionChange( null );
			}, [ isVisible, onHeaderActionChange ] );
			return <div data-visible={ isVisible }>Performance Overview</div>;
		},
	};
} );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( { tab: new URLSearchParams( globalThis.location.search ).get( 'tab' ) } ),
	useNavigate: () => mockNavigate,
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( {
		title,
		subTitle,
		actions,
		children,
	}: {
		title: string;
		subTitle: string;
		actions: ReactNode;
		children: ReactNode;
	} ) => (
		<main>
			<header>
				<h1>{ title }</h1>
				<p>{ subTitle }</p>
				{ actions }
			</header>
			{ children }
		</main>
	),
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
	jest.mocked( requestDataSync ).mockReset();
} );

afterEach( () => {
	jest.useRealTimers();
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
		const header = within( screen.getByRole( 'banner' ) );
		expect( header.getByText( 'Improve your site speed and performance.' ) ).toBeInTheDocument();
		expect( header.queryAllByRole( 'button', { name: 'Run speed test' } ) ).toHaveLength(
			tab === 'Overview' ? 1 : 0
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
			expect( screen.queryAllByRole( 'button', { name: 'Run speed test' } ) ).toHaveLength(
				url === '/?page=jetpack-boost' ? 1 : 0
			);
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

	it( 'shows a loader instead of Overview while onboarding', () => {
		setGettingStarted( true );
		const routeReady = jest.fn();
		window.addEventListener( 'jetpack-boost:route-ready', routeReady );
		render( <Stage /> );

		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( getSettingsMount() ).not.toBeNull();
		expect( requestDataSync ).not.toHaveBeenCalled();

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( routeReady ).not.toHaveBeenCalled();
		window.removeEventListener( 'jetpack-boost:route-ready', routeReady );
	} );

	it( 'keeps the loader until a read after leaving Getting Started reports false', async () => {
		jest.useFakeTimers();
		setGettingStarted( true );
		jest.mocked( requestDataSync ).mockResolvedValueOnce( true ).mockResolvedValue( false );
		window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		render( <Stage /> );

		await act( async () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );

		expect( requestDataSync ).toHaveBeenCalledTimes( 1 );
		expect( requestDataSync ).toHaveBeenCalledWith( 'getting_started' );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 1000 );
		} );

		expect( requestDataSync ).toHaveBeenCalledTimes( 2 );
		await expect( screen.findByText( 'Performance Overview' ) ).resolves.toHaveAttribute(
			'data-visible',
			'true'
		);
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 5000 );
		} );
		expect( requestDataSync ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'stops polling after fifteen seconds and keeps the loader', async () => {
		jest.useFakeTimers();
		setGettingStarted( true );
		jest.mocked( requestDataSync ).mockResolvedValue( true );
		window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		render( <Stage /> );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 2000 );
		} );
		expect( requestDataSync ).not.toHaveBeenCalled();

		await act( async () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
			await jest.advanceTimersByTimeAsync( 16000 );
		} );
		const requestCount = jest.mocked( requestDataSync ).mock.calls.length;
		expect( requestCount ).toBeGreaterThanOrEqual( 14 );
		expect( requestCount ).toBeLessThanOrEqual( 17 );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 5000 );
		} );
		expect( requestDataSync ).toHaveBeenCalledTimes( requestCount );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
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
