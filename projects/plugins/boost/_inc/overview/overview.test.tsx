/* eslint-disable testing-library/prefer-user-event */
import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { useState } from 'react';
import { useSingleModuleState } from '../../app/assets/src/js/features/module/lib/stores';
import { useDismissibleAlertState as useLegacyAlertState } from '../../app/assets/src/js/features/performance-history/lib/hooks';
import PopOut from '../../app/assets/src/js/features/speed-score/pop-out/pop-out';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import { observeLegacyModulesState } from './lib/modules-state-bridge';
import { getHistoryWindow } from './lib/history-days';
import * as speedScores from './lib/use-speed-scores';
import Overview from './overview';
import ScoreCard from './score-card';
import ScoreCards from './score-cards';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-boost-score-api', () => ( {
	...jest.requireActual( '@automattic/jetpack-boost-score-api' ),
	requestSpeedScores: jest.fn(),
} ) );
// The dashboard route and legacy Settings bundle have separate Data Sync singletons.
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	...jest.requireActual( '@automattic/jetpack-react-data-sync-client' ),
	queryClient: new ( jest.requireActual( '@tanstack/react-query' ).QueryClient )(),
} ) );
const { queryClient: legacyQueryClient } = jest.requireActual(
	'@automattic/jetpack-react-data-sync-client'
);
jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn(),
} ) );
jest.mock( '../../app/assets/src/js/features/performance-history/lib/hooks', () => ( {
	...jest.requireActual( '../../app/assets/src/js/features/performance-history/lib/hooks' ),
	useDismissibleAlertState: jest.fn(),
} ) );
jest.mock( '@react-spring/web', () => ( {
	animated: { div: 'div' },
	useSpring: ( { to }: { to: { right: string } } ) => ( {
		visibility: to.right === '0%' ? 'visible' : 'hidden',
	} ),
} ) );
jest.mock( '../../app/assets/src/js/lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );
jest.mock( './upgrade-cta', () => ( {
	__esModule: true,
	default: () => <button>Upgrade now</button>,
} ) );

function recordedPeriod( startDate: number ) {
	return {
		timestamp: startDate + 12 * 3600000,
		dimensions: {
			desktop_overall_score: 90,
			mobile_overall_score: 80,
			desktop_cls: 0.01,
			desktop_lcp: 1.2,
			desktop_tbt: 0.2,
			mobile_cls: 0.03,
			mobile_lcp: 2.4,
			mobile_tbt: 0.4,
		},
	};
}

const scores = {
	current: { desktop: 91, mobile: 81 },
	noBoost: { desktop: 81, mobile: 80 },
	isStale: false,
};

beforeEach( () => {
	jest.clearAllMocks();
	jest.mocked( useViewportMatch ).mockReturnValue( false );
	Object.assign( window, {
		Jetpack_Boost: { site: { url: 'https://example.org', online: true, myJetpack: true } },
		wpApiSettings: { root: 'https://example.org/wp-json/', nonce: 'wp-nonce' },
		jetpack_boost_ds: {
			rest_api: { value: 'https://example.org/wp-json/jetpack-boost-ds', nonce: 'wp-nonce' },
			modules_state: {
				nonce: 'modules-nonce',
				value: { performance_history: { available: true, active: true } },
			},
			performance_history: { nonce: 'history-nonce' },
			dismissed_alerts: { nonce: 'alerts-nonce', value: { performance_history_fresh_start: true } },
		},
	} );
	jest.mocked( requestSpeedScores ).mockResolvedValue( scores );
	jest.mocked( apiFetch ).mockImplementation( async ( { url, data } ) => ( {
		status: 'success',
		JSON: url?.includes( 'modules-state' )
			? window.jetpack_boost_ds!.modules_state!.value
			: url?.includes( 'dismissed-alerts' )
				? ( data?.JSON ?? window.jetpack_boost_ds!.dismissed_alerts!.value )
				: null,
	} ) );
} );

const queryClients: QueryClient[] = [];

function createQueryClient() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	queryClients.push( client );
	return client;
}

afterEach( () => {
	queryClients.forEach( client => client.clear() );
	queryClients.length = 0;
} );

function queryWrapper() {
	const client = createQueryClient();
	return ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}

function OverviewWithHeader( { isVisible }: { isVisible?: boolean } ) {
	const [ action, setAction ] = useState< ReactNode >( null );
	return (
		<>
			<header>{ action }</header>
			<Overview isVisible={ isVisible } onHeaderActionChange={ setAction } />
		</>
	);
}

function renderOverview() {
	const client = createQueryClient();
	const view = render(
		<QueryClientProvider client={ client }>
			<OverviewWithHeader />
		</QueryClientProvider>
	);
	return { ...view, client };
}

test( 'contains a render failure with the Overview error fallback', () => {
	const scoreHook = jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
		throw new Error( 'Score rendering failed' );
	} );
	const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	let view: ReturnType< typeof renderOverview > | undefined;
	try {
		view = renderOverview();
		expect(
			screen.getByText( 'Unable to display performance scores', { selector: 'span' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Score rendering failed' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
	} finally {
		view?.unmount();
		scoreHook.mockRestore();
		consoleError.mockRestore();
		view?.client.clear();
	}
} );

test.each( [
	[ 'score', 'Failed to load speed scores' ],
	[ 'performance-history', 'Failed to load performance history' ],
	[ 'modules-state', 'Failed to load module settings' ],
	[ 'offline', 'Website is not publicly available' ],
	[ 'fallback', 'Unable to display performance scores' ],
] )( 'keeps %s errors silent while the Overview is hidden', async ( source, message ) => {
	/* eslint-disable testing-library/no-node-access */
	const regionId = `a11y-speak-${ source === 'offline' ? 'polite' : 'assertive' }`;
	const region = document.getElementById( regionId ) ?? document.createElement( 'div' );
	region.id = regionId;
	region.className = 'a11y-speak-region';
	region.textContent = '';
	document.body.appendChild( region );
	/* eslint-enable testing-library/no-node-access */
	const error = new Error( `${ source } request failed` );
	const scoreHook =
		source === 'fallback'
			? jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
					throw error;
				} )
			: undefined;
	const consoleError =
		source === 'fallback'
			? jest.spyOn( console, 'error' ).mockImplementation( () => {} )
			: undefined;
	if ( source === 'offline' ) {
		Jetpack_Boost.site.online = false;
	} else if ( source === 'score' ) {
		jest.mocked( requestSpeedScores ).mockRejectedValue( error );
	} else if ( source !== 'fallback' ) {
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest
			.mocked( apiFetch )
			.mockImplementation( options =>
				options.url?.endsWith( `/${ source }${ source === 'performance-history' ? '/set' : '' }` )
					? Promise.reject( error )
					: fetch( options )
			);
	}
	const client = createQueryClient();
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
	let view: ReturnType< typeof render > | undefined;
	try {
		view = render(
			<div hidden>
				<Overview isVisible={ false } onHeaderActionChange={ () => {} } />
			</div>,
			{ wrapper }
		);
		await waitFor( () => {
			expect( client.isFetching() ).toBe( 0 );
			if ( source !== 'performance-history' ) {
				// Hidden history is not requested until the Overview becomes visible.
				// eslint-disable-next-line jest/no-conditional-expect
				expect(
					screen.getByText( source === 'offline' ? message : error.message )
				).toBeInTheDocument();
			}
		} );
		expect( region ).toBeEmptyDOMElement();
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		view.rerender(
			<div>
				<Overview isVisible onHeaderActionChange={ () => {} } />
			</div>
		);
		await waitFor( () => expect( region ).toHaveTextContent( message ) );
	} finally {
		view?.unmount();
		scoreHook?.mockRestore();
		consoleError?.mockRestore();
		client.clear();
	}
} );

test( 'moves focus from Run speed test to the error fallback when a render failure removes it', async () => {
	const { client, rerender, unmount } = renderOverview();
	let scoreHook: jest.SpyInstance | undefined;
	let consoleError: jest.SpyInstance | undefined;
	try {
		await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
				'aria-disabled',
				'false'
			)
		);
		const action = screen.getByRole( 'button', { name: 'Run speed test' } );
		act( () => action.focus() );
		fireEvent.click( action );
		await waitFor( () => expect( requestSpeedScores ).toHaveBeenCalledTimes( 2 ) );
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveFocus();
		scoreHook = jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
			throw new Error( 'Score rendering failed' );
		} );
		consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		rerender(
			<QueryClientProvider client={ client }>
				<OverviewWithHeader />
			</QueryClientProvider>
		);
		expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
		const fallback = screen.getByText( 'Score rendering failed' );
		// eslint-disable-next-line testing-library/no-node-access
		expect( fallback.closest( '[tabindex="-1"]' ) ).toHaveFocus();
	} finally {
		unmount();
		scoreHook?.mockRestore();
		consoleError?.mockRestore();
		client.clear();
	}
} );

test( 'leaves focus alone when a render failure removes Run speed test without focus', async () => {
	const client = createQueryClient();
	const dashboard = () => (
		<QueryClientProvider client={ client }>
			<button>Overview</button>
			<OverviewWithHeader />
		</QueryClientProvider>
	);
	const view = render( dashboard() );
	let scoreHook: jest.SpyInstance | undefined;
	let consoleError: jest.SpyInstance | undefined;
	try {
		await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
		const tab = screen.getByRole( 'button', { name: 'Overview' } );
		act( () => tab.focus() );
		scoreHook = jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
			throw new Error( 'Score rendering failed' );
		} );
		consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		view.rerender( dashboard() );
		expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Score rendering failed' ) ).toBeInTheDocument();
		expect( tab ).toHaveFocus();
	} finally {
		view.unmount();
		scoreHook?.mockRestore();
		consoleError?.mockRestore();
		client.clear();
	}
} );

test( 'loads online scores and regenerates them with refresh tracking and history invalidation', async () => {
	const { client } = renderOverview();
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	expect( requestSpeedScores ).toHaveBeenCalledWith(
		false,
		wpApiSettings.root,
		Jetpack_Boost.site.url,
		wpApiSettings.nonce,
		{ signal: expect.any( AbortSignal ) }
	);
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Run speed test' } ) );
	await waitFor( () =>
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			true,
			wpApiSettings.root,
			Jetpack_Boost.site.url,
			wpApiSettings.nonce,
			{ signal: expect.any( AbortSignal ) }
		)
	);
	expect(
		jest
			.mocked( recordBoostEvent )
			.mock.calls.filter( ( [ event ] ) => event.includes( 'refresh' ) )
	).toEqual( [ [ 'speed_score_refresh_clicked', { source: 'header' } ] ] );
	expect( requestSpeedScores ).toHaveBeenCalledTimes( 2 );
	await waitFor( () =>
		expect( invalidate ).toHaveBeenCalledWith(
			expect.objectContaining( { queryKey: [ 'performance_history' ] } )
		)
	);
} );

test( 'offers Run speed test in the page header only while the Overview is visible', async () => {
	const client = createQueryClient();
	const dashboard = ( isVisible: boolean ) => (
		<QueryClientProvider client={ client }>
			<OverviewWithHeader isVisible={ isVisible } />
		</QueryClientProvider>
	);
	const view = render( dashboard( true ) );
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	expect(
		within( screen.getByRole( 'banner' ) ).getByRole( 'button', { name: 'Run speed test' } )
	).toBeEnabled();
	expect( screen.queryByRole( 'button', { name: 'Refresh' } ) ).not.toBeInTheDocument();
	view.rerender( dashboard( false ) );
	expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
	view.rerender( dashboard( true ) );
	expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toBeEnabled();
	const scoreHook = jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
		throw new Error( 'Score rendering failed' );
	} );
	const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	try {
		view.rerender( dashboard( true ) );
		expect( screen.getByText( 'Score rendering failed' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
	} finally {
		scoreHook.mockRestore();
		consoleError.mockRestore();
		client.clear();
	}
} );

test.each( [ 'critical_css_state', 'lcp_state' ] as const )(
	'relays %s polls and writes without refetching',
	async key => {
		const status = key === 'critical_css_state' ? 'generated' : 'analyzed';
		window.jetpack_boost_ds!.modules_state!.value = {
			[ key === 'critical_css_state' ? 'critical_css' : 'lcp' ]: { available: true, active: true },
			performance_history: { available: true, active: true },
		};
		window.jetpack_boost_ds![ key ] = { nonce: 'css-nonce', value: undefined };
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest
			.mocked( apiFetch )
			.mockImplementation( options =>
				options.url?.endsWith( key.replace( /_/g, '-' ) )
					? Promise.resolve( { status: 'success', JSON: { status, updated: 1 } } )
					: fetch( options )
			);
		legacyQueryClient.clear();
		legacyQueryClient.setQueryData( [ key ], { status, updated: 1 } );
		const stopObserving = observeLegacyModulesState( legacyQueryClient );
		const { client } = renderOverview();
		try {
			await waitFor( () => expect( client.getQueryState( [ key ] )?.dataUpdateCount ).toBe( 1 ) );
			await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
			jest.mocked( apiFetch ).mockClear();
			await act( async () => {
				await legacyQueryClient.fetchQuery( {
					queryKey: [ key ],
					queryFn: async () => ( { status: 'pending', updated: 2 } ),
				} );
			} );
			expect( apiFetch ).not.toHaveBeenCalled();
			expect( client.getQueryData( [ key ] ) ).toEqual( { status: 'pending', updated: 2 } );

			act( () => {
				legacyQueryClient.setQueryData( [ key ], {
					status,
					updated: 3,
				} );
			} );
			await waitFor( () => expect( client.getQueryState( [ key ] )?.dataUpdateCount ).toBe( 3 ) );
			expect( apiFetch ).not.toHaveBeenCalled();
			expect( client.getQueryData( [ key ] ) ).toEqual( { status, updated: 3 } );
		} finally {
			stopObserving();
			legacyQueryClient.clear();
		}
	}
);

test( 'regenerates scores after a Settings toggle and return to the mounted Overview', async () => {
	const initialModules = {
		performance_history: { available: true, active: true },
		defer_js: { available: true, active: false },
	};
	let savedModules = initialModules;
	window.jetpack_boost_ds!.modules_state!.value = initialModules;
	legacyQueryClient.clear();
	const stopObserving = observeLegacyModulesState( legacyQueryClient );
	const hadFetch = Object.hasOwn( globalThis, 'fetch' );
	if ( ! hadFetch ) {
		Object.defineProperty( globalThis, 'fetch', {
			configurable: true,
			writable: true,
			value: jest.fn(),
		} );
	}
	const fetchSpy = jest.spyOn( globalThis, 'fetch' ).mockImplementation( async ( url, options ) => {
		if ( options.method === 'POST' ) {
			savedModules = JSON.parse( options.body as string ).JSON;
		}
		return {
			ok: true,
			text: async () => JSON.stringify( { status: 'success', JSON: savedModules } ),
		} as Response;
	} );
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	jest
		.mocked( apiFetch )
		.mockImplementation( options =>
			options.url?.endsWith( '/modules-state' )
				? Promise.resolve( { status: 'success', JSON: savedModules } )
				: fetch( options )
		);
	function SettingsToggle() {
		const [ state, setState ] = useSingleModuleState( 'defer_js' );
		return (
			<button onClick={ () => setState( ! state?.active ) }>Defer Non-Essential JavaScript</button>
		);
	}
	const client = createQueryClient();
	const dashboard = ( isOverview: boolean ) => (
		<>
			<div hidden={ ! isOverview }>
				<QueryClientProvider client={ client }>
					<Overview isVisible={ isOverview } onHeaderActionChange={ () => {} } />
				</QueryClientProvider>
			</div>
			<div hidden={ isOverview }>
				<QueryClientProvider client={ legacyQueryClient }>
					<SettingsToggle />
				</QueryClientProvider>
			</div>
		</>
	);
	const view = render( dashboard( true ) );
	try {
		await expect( screen.findByText( '91' ) ).resolves.toBeVisible();
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		view.rerender( dashboard( false ) );
		jest.mocked( requestSpeedScores ).mockResolvedValue( {
			...scores,
			current: { desktop: 95, mobile: 85 },
		} );
		fireEvent.click( screen.getByRole( 'button', { name: 'Defer Non-Essential JavaScript' } ) );
		await waitFor( () => expect( savedModules.defer_js.active ).toBe( true ) );
		view.rerender( dashboard( true ) );
		await waitFor( () => expect( screen.getByText( '95' ) ).toBeVisible(), { timeout: 4000 } );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 2 );
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			true,
			wpApiSettings.root,
			Jetpack_Boost.site.url,
			wpApiSettings.nonce,
			{ signal: expect.any( AbortSignal ) }
		);
	} finally {
		stopObserving();
		view.unmount();
		client.clear();
		legacyQueryClient.clear();
		fetchSpy.mockRestore();
		if ( ! hadFetch ) {
			Reflect.deleteProperty( globalThis, 'fetch' );
		}
	}
} );

test( 'keeps offline sites out of score and Data Sync requests', async () => {
	Jetpack_Boost.site.online = false;
	renderOverview();
	expect(
		screen.getByText( 'Website is not publicly available', { selector: 'span' } )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Run speed test' } ) ).not.toBeInTheDocument();
	expect( requestSpeedScores ).not.toHaveBeenCalled();
	expect( apiFetch ).not.toHaveBeenCalled();
	const { result } = renderHook( () => speedScores.useSpeedScores(), { wrapper: queryWrapper() } );
	await act( async () => result.current[ 1 ]( true ) );
	expect( requestSpeedScores ).not.toHaveBeenCalled();
} );

test( 'tracks score errors and offers a successful retry', async () => {
	jest
		.mocked( requestSpeedScores )
		.mockRejectedValueOnce( new Error( 'Score service unavailable' ) );
	const { container } = renderOverview();
	await expect( screen.findByText( 'Score service unavailable' ) ).resolves.toBeTruthy();
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	const card = within( container.querySelector( '.jetpack-boost-overview__scores-card' )! );
	expect( card.getByText( 'Failed to load speed scores', { selector: 'span' } ) ).toBeVisible();
	expect( card.getByText( 'Score service unavailable' ) ).toBeVisible();
	expect( screen.queryByText( '91' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'region', { name: 'Desktop' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toBeEnabled();
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'speed_score_request_error', {
		error_message: 'Score service unavailable',
	} );
	fireEvent.click( card.getByRole( 'button', { name: 'Try again' } ) );
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	expect( requestSpeedScores ).toHaveBeenLastCalledWith(
		true,
		wpApiSettings.root,
		Jetpack_Boost.site.url,
		wpApiSettings.nonce,
		{ signal: expect.any( AbortSignal ) }
	);
	expect(
		jest
			.mocked( recordBoostEvent )
			.mock.calls.filter( ( [ event ] ) => event.includes( 'refresh' ) )
	).toEqual( [ [ 'speed_score_refresh_clicked', { source: 'score_card' } ] ] );
	expect( screen.queryByText( 'Score service unavailable' ) ).not.toBeInTheDocument();
} );

test( 'retains loaded scores and Run speed test alongside a subsequent score error', async () => {
	const { container } = renderOverview();
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	let rejectRefresh: ( error: Error ) => void = () => {};
	jest.mocked( requestSpeedScores ).mockReturnValueOnce(
		new Promise( ( _, reject ) => {
			rejectRefresh = reject;
		} )
	);
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Run speed test' } ) );
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		)
	);
	expect( screen.getByText( '91' ) ).toBeVisible();
	expect( screen.queryByText( 'Calculating…' ) ).not.toBeInTheDocument();
	await act( async () => rejectRefresh( new Error( 'Refresh failed' ) ) );
	await expect( screen.findByText( 'Refresh failed' ) ).resolves.toBeTruthy();
	expect( screen.getByText( '91' ) ).toBeInTheDocument();
	expect( screen.getByText( '81' ) ).toBeInTheDocument();
	const card = within(
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		container.querySelector< HTMLElement >( '.jetpack-boost-overview__scores-card' )!
	);
	expect(
		card
			.getByText( 'Refresh failed' )
			.compareDocumentPosition( card.getByRole( 'region', { name: 'Desktop' } ) )
	).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	// The header re-enables in a later render than the notice, and a click on it while aria-disabled is ignored.
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Run speed test' } ) );
	await waitFor( () => expect( requestSpeedScores ).toHaveBeenCalledTimes( 3 ) );
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	);
	await waitFor( () => expect( screen.queryByText( 'Refresh failed' ) ).not.toBeInTheDocument() );
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
} );

test( 'does not present initial loading scores as measured scores', () => {
	jest.mocked( requestSpeedScores ).mockReturnValue( new Promise( () => {} ) );
	renderOverview();
	expect( screen.queryByText( '91' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '81' ) ).not.toBeInTheDocument();
	expect( screen.getByText( 'Calculating…' ) ).toBeVisible();
	expect( screen.queryByRole( 'region', { name: 'Desktop' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Run speed test' } ) );
	expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
} );

test.each( [
	[ 40, 'Poor' ],
	[ 60, 'Could improve' ],
	[ 90, 'Good' ],
] as const )( 'renders score %i with its tier, bar, and delta', ( score, tier ) => {
	render(
		<ScoreCard
			icon={ null }
			label="Desktop"
			value={ score }
			score={ score }
			noBoost={ score - 10 }
		/>
	);
	expect( screen.getByText( String( score ) ) ).toBeInTheDocument();
	expect( screen.getByRole( 'progressbar', { name: 'Desktop' } ) ).toHaveValue( score );
	expect( screen.getByText( '+10 points compared with Boost disabled' ) ).toBeInTheDocument();
	expect( screen.getByText( tier ) ).toBeInTheDocument();
} );

test( 'opens the overall grade explanation and dismisses it with Escape', async () => {
	render( <ScoreCards scores={ scores } /> );
	const trigger = within( screen.getByRole( 'region', { name: 'Overall' } ) ).getByRole( 'button', {
		name: 'How the overall grade is calculated',
	} );
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	fireEvent.click( trigger );
	const tooltip = await screen.findByRole( 'dialog' );
	expect( tooltip ).toHaveTextContent(
		'Your overall score is a summary of your first Cornerstone Page across both mobile and desktop devices.'
	);
	expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	fireEvent.keyDown( tooltip, { key: 'Escape' } );
	await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
	expect( trigger ).toHaveFocus();
} );

test( 'hides a negative baseline delta while preserving the current measured bar', () => {
	render( <ScoreCard icon={ null } label="Mobile" value={ 40 } score={ 40 } noBoost={ 60 } /> );
	expect( screen.getByRole( 'progressbar', { name: 'Mobile' } ) ).toHaveValue( 40 );
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
	expect( screen.getByText( 'Poor' ) ).toBeInTheDocument();
} );

test( 'hides stale and absent baselines while preserving measured scores', () => {
	const { rerender } = render( <ScoreCards scores={ scores } /> );
	expect( screen.getByText( /\+10 points/ ) ).toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, isStale: true } } /> );
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
	expect( screen.getByText( '91' ) ).toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, noBoost: null } } /> );
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
} );

test( 'shows the free history upgrade without requesting history', async () => {
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { available: false, active: false },
	};
	renderOverview();
	await expect( screen.findByRole( 'button', { name: 'Upgrade now' } ) ).resolves.toBeTruthy();
	expect(
		screen.getByText( 'Learn more about your site performance over time.', { exact: false } )
	).toBeInTheDocument();
	expect( screen.queryByTestId( 'history-chart' ) ).not.toBeInTheDocument();
	await expect( screen.findByText( '91' ) ).resolves.toBeVisible();
	expect( apiFetch ).not.toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history',
		} )
	);
	expect( screen.queryByText( /Performance history will appear/ ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Show score history preview' } ) ).toHaveAttribute(
		'aria-expanded',
		'false'
	);
	expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
} );

test( 'omits the history notice when My Jetpack is unavailable on a free site', async () => {
	window.Jetpack_Boost.site.myJetpack = false;
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { available: false, active: false },
	};
	renderOverview();
	await expect( screen.findByText( '91' ) ).resolves.toBeVisible();
	await waitFor( () =>
		expect(
			screen.queryByRole( 'button', { name: 'Show score history preview' } )
		).not.toBeInTheDocument()
	);
	expect(
		screen.queryByText( 'Learn more about your site performance over time.', { exact: false } )
	).not.toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
	expect( screen.queryByTestId( 'history-chart' ) ).not.toBeInTheDocument();
	expect( apiFetch ).not.toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history',
		} )
	);
} );

test( 'keeps the paid history chart when My Jetpack is unavailable', async () => {
	window.Jetpack_Boost.site.myJetpack = false;
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { available: true, active: true },
	};
	renderOverview();
	await expect( screen.findByTestId( 'history-chart' ) ).resolves.toBeInTheDocument();
	expect( screen.getByRole( 'heading', { name: /Last \d+ days/ } ) ).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
} );

test( 'retains the free history state when a modules refetch fails with a fresh-start alert', async () => {
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { available: false, active: false },
	};
	window.jetpack_boost_ds!.dismissed_alerts!.value = {
		performance_history_fresh_start: false,
	};
	const { client } = renderOverview();
	await expect( screen.findByRole( 'button', { name: 'Upgrade now' } ) ).resolves.toBeTruthy();
	await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	jest.mocked( apiFetch ).mockRejectedValueOnce( new Error( 'Module settings unavailable' ) );
	await act( async () => {
		await client.refetchQueries( { queryKey: [ 'modules_state' ] } );
	} );
	await expect( screen.findByText( 'Module settings unavailable' ) ).resolves.toBeTruthy();
	expect( screen.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeInTheDocument();
	expect(
		screen.queryByText( /Jetpack Boost premium has been activated/ )
	).not.toBeInTheDocument();
} );

test.each( [
	{
		scoresAt: undefined,
		currentDays: 0,
		copy: 'No scores recorded before the feature was unlocked.',
	},
	{
		scoresAt: undefined,
		currentDays: 2,
		copy: 'No scores recorded before the feature was unlocked.',
	},
	{ scoresAt: 1, currentDays: 0, copy: 'No scores recorded for this day.' },
	{ scoresAt: 3, currentDays: 0, copy: 'No scores recorded for this day.' },
	{ scoresAt: 6, currentDays: 0, copy: 'No scores recorded for this day.' },
] )(
	'checks older history when the window opens empty ($currentDays current days, older window $scoresAt)',
	async ( { scoresAt, currentDays, copy } ) => {
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest.mocked( apiFetch ).mockImplementation( options => {
			const window = options.data?.JSON;
			if (
				options.url?.endsWith( '/performance-history/set' ) &&
				currentDays === 2 &&
				window.startDate === getHistoryWindow( 0 ).startDate
			) {
				return Promise.resolve( {
					status: 'success',
					JSON: {
						...window,
						periods: [
							recordedPeriod( window.endDate - 2 * 86400000 ),
							recordedPeriod( window.endDate - 86400000 ),
						],
						annotations: [],
					},
				} );
			}
			if (
				options.url?.endsWith( '/performance-history/set' ) &&
				scoresAt !== undefined &&
				window.startDate <= getHistoryWindow( scoresAt ).startDate &&
				window.endDate >= getHistoryWindow( scoresAt ).endDate
			) {
				return Promise.resolve( {
					status: 'success',
					JSON: {
						...window,
						periods: [ recordedPeriod( getHistoryWindow( scoresAt ).startDate ) ],
					},
				} );
			}
			return fetch( options );
		} );

		const geometry = jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockReturnValue( {
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: 800,
			bottom: 300,
			width: 800,
			height: 300,
			toJSON: () => ( {} ),
		} );
		const resizeObserver = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class {
			constructor( private callback: ResizeObserverCallback ) {}
			observe( target: Element ) {
				this.callback(
					[ { target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry ],
					this
				);
			}
			unobserve() {}
			disconnect() {}
		};
		const requested = ( offset: number ) =>
			jest
				.mocked( apiFetch )
				.mock.calls.some(
					( [ options ] ) => options.data?.JSON?.startDate === getHistoryWindow( offset ).startDate
				);
		try {
			const { client } = renderOverview();
			await waitFor( () => expect( requested( 6 ) ).toBe( true ) );
			await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
			expect( [ 1, 2, 3, 4, 5, 7 ].some( requested ) ).toBe( false );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					data: {
						JSON: expect.objectContaining( {
							startDate: getHistoryWindow( 6 ).startDate,
							endDate: getHistoryWindow( 1 ).endDate,
							olderWindows: Array.from( { length: 6 }, ( _, index ) =>
								getHistoryWindow( index + 1 )
							),
						} ),
					},
				} )
			);
			const charts = await screen.findAllByRole( 'grid', { name: 'Bar chart' } );
			fireEvent.keyDown( charts[ 0 ], { key: 'ArrowRight' } );
			await expect( screen.findByText( copy ) ).resolves.toBeInTheDocument();
			expect(
				screen
					.getByRole( 'button', { name: 'Previous 30 days' } )
					.getAttribute( 'aria-disabled' ) === 'true'
			).toBe( scoresAt === undefined );
			expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Show score history preview' } )
			).not.toBeInTheDocument();
		} finally {
			geometry.mockRestore();
			globalThis.ResizeObserver = resizeObserver;
		}
	}
);

test( 'labels empty days as locked only after older history absence is confirmed', async () => {
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	let completeOlderHistory: () => void;
	jest.mocked( apiFetch ).mockImplementation( options => {
		if ( options.url?.endsWith( '/performance-history/set' ) ) {
			const range = options.data.JSON;
			if ( range.checkOlderWindows ) {
				return new Promise( resolve => {
					completeOlderHistory = () =>
						resolve( { status: 'success', JSON: { ...range, periods: [], annotations: [] } } );
				} );
			}
			return Promise.resolve( {
				status: 'success',
				JSON: {
					...range,
					periods: [ recordedPeriod( getHistoryWindow( 0 ).endDate - 86400000 ) ],
					annotations: [],
				},
			} );
		}
		return fetch( options );
	} );
	const geometry = jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockReturnValue( {
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: 800,
		bottom: 300,
		width: 800,
		height: 300,
		toJSON: () => ( {} ),
	} );
	const resizeObserver = globalThis.ResizeObserver;
	globalThis.ResizeObserver = class {
		constructor( private callback: ResizeObserverCallback ) {}
		observe( target: Element ) {
			this.callback(
				[ { target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry ],
				this
			);
		}
		unobserve() {}
		disconnect() {}
	};
	try {
		renderOverview();
		await waitFor( () => expect( completeOlderHistory ).toBeDefined() );
		const charts = await screen.findAllByRole( 'grid', { name: 'Bar chart' } );
		fireEvent.keyDown( charts[ 0 ], { key: 'ArrowRight' } );
		await expect(
			screen.findByText( 'No scores recorded for this day.' )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( 'No scores recorded before the feature was unlocked.' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Previous 30 days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await act( async () => completeOlderHistory() );
		await expect(
			screen.findByText( 'No scores recorded before the feature was unlocked.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Previous 30 days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} finally {
		geometry.mockRestore();
		globalThis.ResizeObserver = resizeObserver;
	}
} );

test( 'keeps the older-history check cached when a speed test reloads scores', async () => {
	const requests = ( offset: number ) =>
		jest
			.mocked( apiFetch )
			.mock.calls.filter(
				( [ options ] ) => options.data?.JSON?.startDate === getHistoryWindow( offset ).startDate
			).length;
	const { client } = renderOverview();
	await waitFor( () => expect( requests( 6 ) ).toBe( 1 ) );
	await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	const currentRequests = requests( 0 );
	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'Run speed test' } ) ).toHaveAttribute(
			'aria-disabled',
			'false'
		)
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Run speed test' } ) );
	await waitFor( () => expect( requests( 0 ) ).toBeGreaterThan( currentRequests ) );
	await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	expect( [ 1, 2, 3, 4, 5, 6 ].map( requests ) ).toEqual( [ 0, 0, 0, 0, 0, 1 ] );
} );

test( 'shows a single-day header and disables Previous for a first-slot record with no older history', async () => {
	window.jetpack_boost_ds!.dismissed_alerts!.value = { performance_history_fresh_start: false };
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	jest.mocked( apiFetch ).mockImplementation( options => {
		if ( options.url?.endsWith( '/performance-history/set' ) ) {
			const range = options.data.JSON;
			return Promise.resolve( {
				status: 'success',
				JSON: {
					...range,
					periods:
						range.startDate === getHistoryWindow( 0 ).startDate
							? [ recordedPeriod( getHistoryWindow( 0 ).startDate ) ]
							: [],
					annotations: [],
				},
			} );
		}
		return fetch( options );
	} );
	const { client } = renderOverview();
	await expect( screen.findByTestId( 'history-chart' ) ).resolves.toBeInTheDocument();
	await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	expect(
		screen.getByText( dateI18n( 'M j, Y', getHistoryWindow( 0 ).startDate, false ) )
	).toBeInTheDocument();
	expect( apiFetch ).toHaveBeenCalledWith(
		expect.objectContaining( {
			data: { JSON: expect.objectContaining( { checkOlderWindows: true } ) },
		} )
	);
	expect(
		screen.queryByText( /Jetpack Boost premium has been activated/ )
	).not.toBeInTheDocument();
	const previous = screen.getByRole( 'button', { name: 'Previous 30 days' } );
	expect( previous ).toHaveAttribute( 'aria-disabled', 'true' );
	jest.mocked( apiFetch ).mockClear();
	fireEvent.click( previous );
	expect( apiFetch ).not.toHaveBeenCalled();
} );

test.each( [ 'pending', 'error' ] )(
	'keeps the range and disables Previous only while the older-history check is pending (%s)',
	async status => {
		window.jetpack_boost_ds!.dismissed_alerts!.value = { performance_history_fresh_start: false };
		const period = recordedPeriod( getHistoryWindow( 0 ).endDate - 86400000 );
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest.mocked( apiFetch ).mockImplementation( options => {
			if ( options.url?.endsWith( '/performance-history/set' ) ) {
				const range = options.data.JSON;
				if ( range.checkOlderWindows ) {
					return status === 'pending'
						? new Promise( () => {} )
						: Promise.reject( new Error( 'Older history unavailable' ) );
				}
				return Promise.resolve( {
					status: 'success',
					JSON: { ...range, periods: [ period ], annotations: [] },
				} );
			}
			return fetch( options );
		} );
		const { client } = renderOverview();
		await expect( screen.findByTestId( 'history-chart' ) ).resolves.toBeInTheDocument();
		await waitFor( () =>
			expect(
				client.getQueryCache().find( {
					queryKey: [ 'performance_history', 'older' ],
					exact: false,
				} )?.state.status
			).toBe( status )
		);
		const { startDate, endDate } = getHistoryWindow( 0 );
		expect(
			screen.getByText(
				`${ dateI18n( 'M j', startDate, false ) } – ${ dateI18n( 'M j, Y', endDate, false ) }`
			)
		).toBeInTheDocument();
		const previous = screen.getByRole( 'button', { name: 'Previous 30 days' } );
		expect( previous ).toHaveAttribute( 'aria-disabled', String( status === 'pending' ) );
		jest.mocked( apiFetch ).mockClear();
		fireEvent.click( previous );
		await waitFor( () =>
			expect( jest.mocked( apiFetch ).mock.calls.length > 0 ).toBe( status === 'error' )
		);
	}
);

test.each( [ 'pending', 'error' ] )(
	'keeps loading history paging disabled with a date range when initial history is %s',
	async status => {
		window.jetpack_boost_ds!.dismissed_alerts!.value = { performance_history_fresh_start: false };
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest.mocked( apiFetch ).mockImplementation( options => {
			if ( options.url?.endsWith( '/performance-history/set' ) ) {
				return status === 'pending'
					? new Promise( () => {} )
					: Promise.reject( new Error( 'History unavailable' ) );
			}
			return fetch( options );
		} );
		const { client } = renderOverview();
		const { startDate, endDate } = getHistoryWindow( 0 );
		await waitFor( () =>
			expect( client.getQueryState( [ 'performance_history', startDate, endDate ] )?.status ).toBe(
				status
			)
		);
		expect(
			screen.getByText(
				`${ dateI18n( 'M j', startDate, false ) } – ${ dateI18n( 'M j, Y', endDate, false ) }`
			)
		).toBeInTheDocument();
		const previous = screen.getByRole( 'button', { name: 'Previous 30 days' } );
		expect( previous ).toHaveAttribute( 'aria-disabled', 'true' );
		jest.mocked( apiFetch ).mockClear();
		fireEvent.click( previous );
		expect( apiFetch ).not.toHaveBeenCalled();
	}
);

test( 'enables multi-day history paging with a date range without checking older history', async () => {
	const { startDate, endDate } = getHistoryWindow( 0 );
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	jest.mocked( apiFetch ).mockImplementation( options => {
		if ( options.url?.endsWith( '/performance-history/set' ) ) {
			return Promise.resolve( {
				status: 'success',
				JSON: {
					...options.data.JSON,
					periods: [ recordedPeriod( startDate ), recordedPeriod( startDate + 86400000 ) ],
					annotations: [],
				},
			} );
		}
		return fetch( options );
	} );
	const { client } = renderOverview();
	await expect( screen.findByTestId( 'history-chart' ) ).resolves.toBeInTheDocument();
	await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	expect(
		screen.getByText(
			`${ dateI18n( 'M j', startDate, false ) } – ${ dateI18n( 'M j, Y', endDate, false ) }`
		)
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Previous 30 days' } ) ).toHaveAttribute(
		'aria-disabled',
		'false'
	);
	expect(
		jest.mocked( apiFetch ).mock.calls.some( ( [ options ] ) => options.data?.JSON?.olderWindows )
	).toBe( false );
} );

test( 'debounces optimization changes and waits for generation to finish', async () => {
	jest.useFakeTimers();
	try {
		const { result, rerender, unmount } = renderHook(
			state => speedScores.useSpeedScores( state ),
			{
				initialProps: { config: 'modules-active:1,updated:10', isPending: false },
				wrapper: queryWrapper(),
			}
		);
		await waitFor( () => expect( result.current[ 0 ].status ).toBe( 'loaded' ) );
		rerender( { config: 'modules-active:1,updated:20', isPending: true } );
		act( () => jest.advanceTimersByTime( 2000 ) );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
		rerender( { config: 'modules-active:1,updated:20', isPending: false } );
		act( () => jest.advanceTimersByTime( 1999 ) );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 2 );
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			true,
			wpApiSettings.root,
			Jetpack_Boost.site.url,
			wpApiSettings.nonce,
			{ signal: expect.any( AbortSignal ) }
		);
		unmount();
	} finally {
		jest.useRealTimers();
	}
} );

test( 'passes the history server error message to the notice', async () => {
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	jest
		.mocked( apiFetch )
		.mockImplementation( options =>
			options.url?.endsWith( '/performance-history/set' )
				? Promise.resolve( { status: 'error', message: 'History service unavailable' } )
				: fetch( options )
		);
	renderOverview();
	await expect( screen.findByText( 'History service unavailable' ) ).resolves.toBeTruthy();
	expect( apiFetch ).toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history/set',
			method: 'POST',
			data: {
				JSON: { ...getHistoryWindow( 0 ), periods: [], annotations: [], surfaceErrors: true },
			},
		} )
	);
	await expect( screen.findByRole( 'button', { name: 'Try again' } ) ).resolves.toBeEnabled();
} );

const decreasedScores = {
	current: { desktop: 60, mobile: 60 },
	noBoost: { desktop: 80, mobile: 80 },
	isStale: false,
};

test( 'shows a score decrease with guidance and persists permanent dismissal', async () => {
	jest.mocked( requestSpeedScores ).mockResolvedValue( decreasedScores );
	renderOverview();
	await waitFor( () => expect( screen.getByText( 'Speed score has fallen' ) ).toBeVisible() );
	expect( screen.getByRole( 'link', { name: /Read the guide/ } ) ).toHaveAttribute(
		'href',
		expect.stringContaining( 'boost-improve-site-speed-score' )
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Do not show me again' } ) );
	await waitFor( () =>
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				url: 'https://example.org/wp-json/jetpack-boost-ds/dismissed-alerts/merge',
				method: 'POST',
				data: { JSON: { score_decrease: true } },
			} )
		)
	);
	await waitFor( () => expect( screen.getByText( 'Speed score has fallen' ) ).not.toBeVisible() );
} );

test( 'temporarily closes the score decrease without persisting dismissal', async () => {
	jest.mocked( requestSpeedScores ).mockResolvedValue( decreasedScores );
	renderOverview();
	await waitFor( () => expect( screen.getByText( 'Speed score has fallen' ) ).toBeVisible() );
	fireEvent.click( screen.getByRole( 'link', { name: 'Dismiss' } ) );
	expect( screen.getByText( 'Speed score has fallen' ) ).not.toBeVisible();
	expect( apiFetch ).not.toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/dismissed-alerts/set',
			method: 'POST',
		} )
	);
	expect( apiFetch ).toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history/set',
			method: 'POST',
			data: {
				JSON: { ...getHistoryWindow( 0 ), periods: [], annotations: [], surfaceErrors: true },
			},
		} )
	);
} );

test.each( [
	{ name: 'dismissed', scoreFixture: decreasedScores, dismissed: true },
	{
		name: 'unchanged',
		scoreFixture: { ...decreasedScores, current: { desktop: 80, mobile: 80 } },
		dismissed: false,
	},
	{ name: 'stale', scoreFixture: { ...decreasedScores, isStale: true }, dismissed: false },
] )( 'does not show a $name score decrease alert', async ( { scoreFixture, dismissed } ) => {
	window.jetpack_boost_ds!.dismissed_alerts!.value = {
		performance_history_fresh_start: true,
		score_decrease: dismissed,
	};
	jest.mocked( requestSpeedScores ).mockResolvedValue( scoreFixture );
	renderOverview();
	await expect( screen.findByRole( 'region', { name: 'Desktop' } ) ).resolves.toBeVisible();
	expect(
		screen.queryByRole( 'heading', { name: 'Speed score has fallen' } )
	).not.toBeInTheDocument();
	expect( recordBoostEvent ).not.toHaveBeenCalledWith(
		'speed_score_alert_shown',
		expect.anything()
	);
} );

test( 'uses the legacy dismissal hook when no alert adapter is supplied', () => {
	const dismiss = jest.fn();
	jest.mocked( useLegacyAlertState ).mockReturnValue( [ false, dismiss ] );
	const { rerender } = render( <PopOut scoreChange={ -20 } /> );
	expect( useLegacyAlertState ).toHaveBeenCalledWith( 'score_decrease' );
	expect( screen.getByText( 'Speed score has fallen' ) ).toBeVisible();
	fireEvent.click( screen.getByRole( 'button', { name: 'Do not show me again' } ) );
	expect( dismiss ).toHaveBeenCalledTimes( 1 );
	jest.mocked( useLegacyAlertState ).mockReturnValue( [ true, dismiss ] );
	rerender( <PopOut scoreChange={ -20 } /> );
	expect( screen.getByText( 'Speed score has fallen' ) ).not.toBeVisible();
} );

test( 'reports module request errors independently and retries only modules', async () => {
	window.jetpack_boost_ds!.modules_state!.value = undefined;
	jest.mocked( apiFetch ).mockImplementation( async ( { url } ) => {
		if ( url?.includes( 'modules-state' ) ) {
			throw new Error( 'Module settings unavailable' );
		}
		return { status: 'success', JSON: null };
	} );
	const { container } = renderOverview();
	await expect( screen.findByText( 'Module settings unavailable' ) ).resolves.toBeTruthy();
	expect(
		screen.getByText( 'Failed to load module settings', { selector: 'span' } )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
	expect( apiFetch ).not.toHaveBeenCalledWith(
		expect.objectContaining( { url: expect.stringContaining( 'performance-history/set' ) } )
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	expect( container.querySelector( '.jetpack-boost-overview__chart-loading' ) ).toBeNull();
	jest.mocked( apiFetch ).mockClear();
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	expect( apiFetch ).toHaveBeenCalledWith(
		expect.objectContaining( { url: expect.stringContaining( 'modules-state' ) } )
	);
} );

test.each( [
	[ 100, 'A', 'Good' ],
	[ 90, 'B', 'Good' ],
	[ 76, 'B', 'Good' ],
	[ 75, 'C', 'Good' ],
	[ 71, 'C', 'Good' ],
	[ 70, 'C', 'Could improve' ],
	[ 50, 'D', 'Poor' ],
	[ 30, 'E', 'Poor' ],
	[ 0, 'F', 'Poor' ],
] )( 'shows the Overall letter with its band at score %s', ( score, grade, band ) => {
	render(
		<ScoreCards
			scores={ {
				current: { desktop: Number( score ), mobile: Number( score ) },
				noBoost: null,
				isStale: false,
			} }
		/>
	);
	const overall = within( screen.getByRole( 'region', { name: 'Overall' } ) );
	expect( overall.getByText( String( grade ) ) ).toBeInTheDocument();
	expect( overall.getByText( String( band ) ) ).toBeInTheDocument();
} );

test( 'keeps numeric device tiers when the Overall letter is C', () => {
	render(
		<ScoreCards
			scores={ { current: { desktop: 71, mobile: 71 }, noBoost: null, isStale: false } }
		/>
	);
	for ( const name of [ 'Desktop', 'Mobile' ] ) {
		expect( within( screen.getByRole( 'region', { name } ) ).getByText( 'Good' ) ).toHaveClass(
			'jetpack-boost-overview__tier--good'
		);
	}
} );

test( 'owns history paging, retry, and the responsive fifteen-day window', async () => {
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	let failPrevious = true;
	jest.mocked( apiFetch ).mockImplementation( options => {
		if ( options.url?.endsWith( '/performance-history/set' ) ) {
			if ( options.data.JSON.startDate === getHistoryWindow( 1 ).startDate && failPrevious ) {
				failPrevious = false;
				return Promise.reject( new Error( 'Previous window unavailable' ) );
			}
			const periods = [
				recordedPeriod( options.data.JSON.startDate ),
				recordedPeriod( options.data.JSON.startDate + 86400000 ),
			];
			return Promise.resolve( { status: 'success', JSON: { ...options.data.JSON, periods } } );
		}
		return fetch( options );
	} );
	const { client, unmount, rerender } = renderOverview();
	const resize = ( isNarrow: boolean ) => {
		jest.mocked( useViewportMatch ).mockReturnValue( isNarrow );
		rerender(
			<QueryClientProvider client={ client }>
				<OverviewWithHeader />
			</QueryClientProvider>
		);
	};
	const expectWindow = async ( offset: number, dayCount: 15 | 30 ) => {
		await waitFor( () =>
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history/set',
					data: {
						JSON: {
							...getHistoryWindow( offset, new Date(), dayCount ),
							periods: [],
							annotations: [],
							surfaceErrors: true,
						},
					},
				} )
			)
		);
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
	};
	try {
		await expectWindow( 0, 30 );
		expect(
			jest.mocked( apiFetch ).mock.calls.some( ( [ options ] ) => options.data?.JSON?.olderWindows )
		).toBe( false );
		expect( useViewportMatch ).toHaveBeenCalledWith( 'small', '<' );
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous 30 days' } ) );
		await expect( screen.findByText( 'Previous window unavailable' ) ).resolves.toBeInTheDocument();
		fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		await expectWindow( 1, 30 );
		resize( true );
		await expectWindow( 0, 15 );
		expect( screen.getByRole( 'button', { name: 'Next 15 days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous 15 days' } ) );
		await expectWindow( 1, 15 );
		fireEvent.click( screen.getByRole( 'button', { name: 'Next 15 days' } ) );
		expect( screen.getByRole( 'button', { name: 'Next 15 days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous 15 days' } ) );
		resize( false );
		await expectWindow( 0, 30 );
		expect( screen.getByRole( 'button', { name: 'Next 30 days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} finally {
		unmount();
		client.clear();
	}
} );
