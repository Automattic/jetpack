/* eslint-disable testing-library/no-node-access */
import 'jetpack-js-tools/jest/setup-jest-dom';
// Test dependencies come from the plugin, not the wp-build route package.
// eslint-disable-next-line import/no-extraneous-dependencies
import { act, render, screen, within } from '@testing-library/react';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import {
	observeLegacyModulesState,
	ONBOARDING_SAVE_META,
} from '../../_inc/overview/lib/modules-state-bridge';
import { ONBOARDING_CHANGE_EVENT } from '../../_inc/runtime-contract';
import { stage as Stage } from './stage';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
const mockScrollIntoView = jest.fn();
const mockDisconnect = jest.fn();
let resizeCallback: ResizeObserverCallback;
let resizeObserver: ResizeObserver;

beforeEach( () => {
	Element.prototype.scrollIntoView = mockScrollIntoView;
	mockScrollIntoView.mockClear();
	mockDisconnect.mockClear();
	jest.spyOn( window, 'ResizeObserver' ).mockImplementation( callback => {
		resizeCallback = callback;
		resizeObserver = { observe: jest.fn(), unobserve: jest.fn(), disconnect: mockDisconnect };
		return resizeObserver;
	} );
} );

jest.mock( '../../_inc/overview/overview', () => {
	const { useEffect } = jest.requireActual< typeof import( 'react' ) >( 'react' );
	return {
		__esModule: true,
		default: function MockOverview( {
			isVisible,
			scoresEnabled,
			onHeaderActionChange,
		}: {
			isVisible: boolean;
			scoresEnabled: boolean;
			onHeaderActionChange: ( action: ReactNode ) => void;
		} ) {
			useEffect( () => {
				if ( ! isVisible ) {
					return undefined;
				}
				onHeaderActionChange( <button>Run speed test</button> );
				return () => onHeaderActionChange( null );
			}, [ isVisible, onHeaderActionChange ] );
			return (
				<div data-visible={ isVisible } data-scores-enabled={ scoresEnabled }>
					Performance Overview
				</div>
			);
		},
	};
} );

// The router keeps its route, path and query, inside the `p` wp-admin arg; a tab beside it is not a route.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => {
		const route = new URLSearchParams( globalThis.location.search ).get( 'p' ) ?? '/';
		return { tab: new URLSearchParams( route.split( '?' )[ 1 ] ).get( 'tab' ) };
	},
	useNavigate: () => mockNavigate,
} ) );

const SETTINGS_ARG = '&p=%2F%3Ftab%3Dsettings';

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
} );

const changeOnboarding = ( value: boolean ) =>
	window.dispatchEvent( new CustomEvent( ONBOARDING_CHANGE_EVENT, { detail: value } ) );

const observeLegacyGettingStarted = ( value: boolean ) => {
	const legacy = new QueryClient();
	legacy.setQueryData( [ 'getting_started' ], value );
	return { legacy, stopObserving: observeLegacyModulesState( legacy ) };
};

const setGettingStarted = ( value: boolean ) => {
	window.jetpack_boost_ds = {
		rest_api: { nonce: 'test-nonce', value: 'https://example.org/wp-json/jetpack-boost-ds' },
		getting_started: { nonce: 'test-nonce', value },
	};
};

describe( 'Boost dashboard stage', () => {
	it.each( [ '', SETTINGS_ARG, '&tab=settings', '&p=%2F%3Ftab%3Doverview' ] )(
		'renders one page for %s and scrolls to its destination',
		query => {
			window.history.replaceState( null, '', `/?page=jetpack-boost${ query }` );
			render( <Stage /> );
			const section = screen.getByRole( 'region', { name: 'Optimize your speed' } );
			expect( section ).toContainElement( getSettingsMount() );
			expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute(
				'data-visible',
				'true'
			);
			expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute(
				'data-scores-enabled',
				'true'
			);
			expect( screen.getByText( 'Performance Overview' ).compareDocumentPosition( section ) ).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect( getSubpageMount()?.hidden ).toBe( true );
			const target = mockScrollIntoView.mock.contexts.at( -1 );
			expect( target ).toBe(
				query === SETTINGS_ARG ? section : section.closest( '.jetpack-boost-page__content' )
			);
			const header = within( screen.getByRole( 'banner' ) );
			expect( header.getByText( 'Improve your site speed and performance.' ) ).toBeInTheDocument();
			expect( header.getByRole( 'button', { name: 'Run speed test' } ) ).toBeInTheDocument();
		}
	);

	it.each(
		subpages.flatMap( hash => [
			[ hash, '' ],
			[ hash, SETTINGS_ARG ],
		] )
	)( 'shows #%s in the full-page slot with query %s', ( hash, query ) => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ query }#/${ hash }` );
		render( <Stage /> );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( mockScrollIntoView ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'false' );
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute(
			'data-scores-enabled',
			'false'
		);
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

	it.each( [ 'cache-debug-log', 'critical-css-advanced' ] )(
		'does not navigate again when leaving #%s for a Settings URL',
		hash => {
			const settings = '/?page=jetpack-boost&p=%2F%3Ftab%3Dsettings';
			window.history.replaceState( null, '', `${ settings }#/${ hash }` );
			render( <Stage /> );

			act( () => window.history.pushState( null, '', settings ) );
			expect( mockNavigate ).not.toHaveBeenCalled();
			expect( getSubpageMount()?.hidden ).toBe( true );

			act( () => {
				window.history.replaceState( null, '', `${ settings }#/${ hash }` );
				window.dispatchEvent( new PopStateEvent( 'popstate' ) );
			} );
			expect( getSubpageMount()?.hidden ).toBe( false );
			act( () => {
				window.history.replaceState( null, '', settings );
				window.dispatchEvent( new PopStateEvent( 'popstate' ) );
			} );
			expect( mockNavigate ).not.toHaveBeenCalled();
			expect( getSubpageMount()?.hidden ).toBe( true );
		}
	);

	it( 'navigates to Settings when leaving a subpage for an Overview URL', () => {
		window.history.replaceState(
			null,
			'',
			`/?page=jetpack-boost${ SETTINGS_ARG }#/cache-debug-log`
		);
		render( <Stage /> );

		act( () => {
			window.history.pushState( null, '', '/?page=jetpack-boost&p=%2F%3Ftab%3Doverview' );
		} );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: true } );
		expect( getSubpageMount()?.hidden ).toBe( true );
	} );

	it( 'follows pushState navigation into and out of a subpage', () => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ SETTINGS_ARG }` );
		render( <Stage /> );
		expect( getSubpageMount()?.hidden ).toBe( true );

		act( () => {
			window.history.pushState(
				null,
				'',
				`/?page=jetpack-boost${ SETTINGS_ARG }#/critical-css-advanced`
			);
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( screen.queryAllByRole( 'tablist' ) ).toHaveLength( 0 );
		expect( mockNavigate ).not.toHaveBeenCalled();

		act( () => {
			window.history.pushState( null, '', `/?page=jetpack-boost${ SETTINGS_ARG }#/` );
		} );

		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'keeps Overview and both mount nodes across scroll destinations and subpage visits', () => {
		const { rerender } = render( <Stage /> );
		const overview = screen.getByText( 'Performance Overview' );
		const settingsMount = getSettingsMount();
		const subpageMount = getSubpageMount();

		for ( const url of [
			`/?page=jetpack-boost${ SETTINGS_ARG }`,
			`/?page=jetpack-boost${ SETTINGS_ARG }#/critical-css-advanced`,
			`/?page=jetpack-boost${ SETTINGS_ARG }#/`,
			'/?page=jetpack-boost',
		] ) {
			act( () => {
				window.history.replaceState( null, '', url );
				window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
			} );
			rerender( <Stage /> );

			expect( screen.getByText( 'Performance Overview' ) ).toBe( overview );
			expect( screen.queryAllByRole( 'button', { name: 'Run speed test' } ) ).toHaveLength(
				url.includes( 'critical-css-advanced' ) ? 0 : 1
			);
			expect( getSettingsMount() ).toBe( settingsMount );
			expect( getSubpageMount() ).toBe( subpageMount );
		}
	} );

	it( 'keeps the section aligned during loading and stops when the user scrolls', () => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ SETTINGS_ARG }` );
		const { unmount } = render( <Stage /> );
		mockScrollIntoView.mockClear();
		act( () => resizeCallback( [], resizeObserver ) );
		expect( mockScrollIntoView.mock.contexts[ 0 ] ).toBe(
			screen.getByRole( 'region', { name: 'Optimize your speed' } )
		);
		act( () => window.dispatchEvent( new Event( 'wheel' ) ) );
		expect( mockDisconnect ).toHaveBeenCalled();
		unmount();
	} );

	it( 'stops following after a programmatic scroll until the next activation', () => {
		const { rerender } = render( <Stage /> );
		const content = screen.getByRole( 'region', { name: 'Optimize your speed' } ).parentElement!;
		content.parentElement!.scrollTop = 900;
		mockScrollIntoView.mockClear();
		act( () => resizeCallback( [], resizeObserver ) );
		expect( mockDisconnect ).toHaveBeenCalled();
		expect( mockScrollIntoView ).not.toHaveBeenCalled();

		content.parentElement!.scrollTop = 0;
		act( () => resizeCallback( [], resizeObserver ) );
		expect( mockScrollIntoView ).not.toHaveBeenCalled();

		act( () => window.history.replaceState( null, '', `/?page=jetpack-boost${ SETTINGS_ARG }` ) );
		rerender( <Stage /> );
		expect( mockScrollIntoView ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'retires the loading observer after a bounded interval', () => {
		jest.useFakeTimers();
		const { unmount } = render( <Stage /> );
		mockScrollIntoView.mockClear();
		act( () => jest.advanceTimersByTime( 5000 ) );
		expect( mockDisconnect ).toHaveBeenCalled();
		act( () => resizeCallback( [], resizeObserver ) );
		expect( mockScrollIntoView ).not.toHaveBeenCalled();
		unmount();
		jest.useRealTimers();
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

		act( () => {
			window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		} );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( getSubpageMount() ).toBeEmptyDOMElement();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();
		expect( routeReady ).not.toHaveBeenCalled();
		window.removeEventListener( 'jetpack-boost:route-ready', routeReady );
	} );

	it( 'keeps the loader through a pending save until it lands', async () => {
		setGettingStarted( true );
		window.history.replaceState( null, '', '/?page=jetpack-boost#/getting-started' );
		const { legacy, stopObserving } = observeLegacyGettingStarted( true );
		render( <Stage /> );
		const saves: Array< { resolve: ( value: boolean ) => void; reject: ( e: Error ) => void } > =
			[];
		const save = () =>
			new MutationObserver< boolean, Error, boolean >( legacy, {
				meta: ONBOARDING_SAVE_META,
				mutationFn: () =>
					new Promise< boolean >( ( resolve, reject ) => saves.push( { resolve, reject } ) ),
				onMutate: () => legacy.setQueryData( [ 'getting_started' ], false ),
				onSuccess: ( value: boolean ) => legacy.setQueryData( [ 'getting_started' ], value ),
				onError: () => legacy.setQueryData( [ 'getting_started' ], true ),
			} )
				.mutate( false )
				.catch( () => undefined );

		await act( async () => {
			void save();
			window.history.replaceState( null, '', '/?page=jetpack-boost' );
		} );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();

		await act( async () => saves[ 0 ].reject( new Error( 'Save failed' ) ) );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();

		await act( async () => {
			void save();
		} );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();

		await act( async () => saves[ 1 ].resolve( false ) );
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'true' );
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
		stopObserving();
	} );

	it( "follows the webpack app's getting_started value both ways", () => {
		setGettingStarted( false );
		render( <Stage /> );

		act( () => changeOnboarding( true ) );
		expect( screen.getByRole( 'status', { name: 'Loading' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Performance Overview' ) ).not.toBeInTheDocument();

		act( () => changeOnboarding( false ) );
		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'true' );
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'after Continue', true ],
		[ 'without navigating', false ],
	] )(
		'leaves Purchase Success for Overview %s once the webpack app reads onboarding as done',
		async ( _, navigate ) => {
			setGettingStarted( true );
			window.history.replaceState( null, '', '/?page=jetpack-boost#/purchase-successful' );
			const { legacy, stopObserving } = observeLegacyGettingStarted( true );
			render( <Stage /> );

			await act( async () => {
				await legacy.fetchQuery( { queryKey: [ 'getting_started' ], queryFn: async () => false } );
			} );
			if ( navigate ) {
				act( () => window.history.pushState( null, '', '/?page=jetpack-boost' ) );
			}

			await expect( screen.findByText( 'Performance Overview' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
			stopObserving();
		}
	);

	it( 'shows Overview without a loader once onboarding is done', () => {
		setGettingStarted( false );
		render( <Stage /> );

		expect( screen.getByText( 'Performance Overview' ) ).toHaveAttribute( 'data-visible', 'true' );
		expect( screen.queryByRole( 'status', { name: 'Loading' } ) ).not.toBeInTheDocument();
	} );

	it( 'does not re-navigate when the Settings redirect rewrites history', () => {
		mockNavigate.mockImplementation( () => {
			window.history.replaceState( null, '', `/?page=jetpack-boost${ SETTINGS_ARG }#/` );
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
