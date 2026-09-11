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
import { useSingleModuleState } from '../../app/assets/src/js/features/module/lib/stores';
import { useDismissibleAlertState as useLegacyAlertState } from '../../app/assets/src/js/features/performance-history/lib/hooks';
import PopOut from '../../app/assets/src/js/features/speed-score/pop-out/pop-out';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import { observeLegacyModulesState } from './lib/modules-state-bridge';
import * as speedScores from './lib/use-speed-scores';
import Overview from './overview';
import ScoreCard from './score-card';
import ScoreCards from './score-cards';

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

const scores = {
	current: { desktop: 91, mobile: 81 },
	noBoost: { desktop: 81, mobile: 80 },
	isStale: false,
};

beforeEach( () => {
	jest.clearAllMocks();
	Object.assign( window, {
		Jetpack_Boost: { site: { url: 'https://example.org', online: true } },
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
			? data?.JSON ?? window.jetpack_boost_ds!.dismissed_alerts!.value
			: null,
	} ) );
} );

function queryWrapper() {
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	return ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}

function renderOverview() {
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	const view = render(
		<QueryClientProvider client={ client }>
			<Overview />
		</QueryClientProvider>
	);
	return { ...view, client };
}

test( 'contains a render failure with the Overview error fallback', () => {
	const scoreHook = jest.spyOn( speedScores, 'useSpeedScores' ).mockImplementation( () => {
		throw new Error( 'Score rendering failed' );
	} );
	const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	try {
		renderOverview();
		expect(
			screen.getByText( 'Unable to display performance scores', { selector: 'span' } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Score rendering failed' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Refresh' } ) ).not.toBeInTheDocument();
	} finally {
		scoreHook.mockRestore();
		consoleError.mockRestore();
	}
} );

test.each( [
	[ 'score', 'Failed to load Speed Scores' ],
	[ 'performance-history', 'Failed to load performance history' ],
	[ 'modules-state', 'Failed to load module settings' ],
] )( 'keeps %s errors silent while the Overview is hidden', async ( source, message ) => {
	/* eslint-disable testing-library/no-node-access */
	const region =
		document.getElementById( 'a11y-speak-assertive' ) ?? document.createElement( 'div' );
	region.id = 'a11y-speak-assertive';
	region.className = 'a11y-speak-region';
	region.textContent = '';
	document.body.appendChild( region );
	/* eslint-enable testing-library/no-node-access */
	const error = new Error( `${ source } request failed` );
	if ( source === 'score' ) {
		jest.mocked( requestSpeedScores ).mockRejectedValue( error );
	} else {
		const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
		jest
			.mocked( apiFetch )
			.mockImplementation( options =>
				options.url?.endsWith( `/${ source }` ) ? Promise.reject( error ) : fetch( options )
			);
	}
	const { rerender } = render(
		<div hidden>
			<Overview isVisible={ false } />
		</div>,
		{ wrapper: queryWrapper() }
	);
	await expect( screen.findByText( error.message ) ).resolves.toBeInTheDocument();
	expect( region ).toBeEmptyDOMElement();
	rerender(
		<div>
			<Overview isVisible />
		</div>
	);
	expect( region ).toHaveTextContent( message );
} );

test( 'loads online scores and regenerates them with refresh tracking and history invalidation', async () => {
	const { client } = renderOverview();
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	expect( requestSpeedScores ).toHaveBeenCalledWith(
		false,
		wpApiSettings.root,
		Jetpack_Boost.site.url,
		wpApiSettings.nonce
	);
	const invalidate = jest.spyOn( client, 'invalidateQueries' );
	fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );
	await waitFor( () =>
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			true,
			wpApiSettings.root,
			Jetpack_Boost.site.url,
			wpApiSettings.nonce
		)
	);
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'speed_score_refresh_clicked', {} );
	await waitFor( () =>
		expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ 'performance_history' ] } )
	);
} );

test( 'ignores legacy polls and refetches only the key written by the legacy cache', async () => {
	window.jetpack_boost_ds!.modules_state!.value = {
		critical_css: { available: true, active: true },
		performance_history: { available: true, active: true },
	};
	window.jetpack_boost_ds!.critical_css_state = { nonce: 'css-nonce', value: undefined };
	const fetch = jest.mocked( apiFetch ).getMockImplementation()!;
	jest
		.mocked( apiFetch )
		.mockImplementation( options =>
			options.url?.endsWith( '/critical-css-state' )
				? Promise.resolve( { status: 'success', JSON: { status: 'generated', updated: 1 } } )
				: fetch( options )
		);
	legacyQueryClient.clear();
	legacyQueryClient.setQueryData( [ 'critical_css_state' ], { status: 'generated', updated: 1 } );
	const stopObserving = observeLegacyModulesState( legacyQueryClient );
	const { client } = renderOverview();
	try {
		await waitFor( () =>
			expect( client.getQueryState( [ 'critical_css_state' ] )?.dataUpdateCount ).toBe( 1 )
		);
		await waitFor( () => expect( client.isFetching() ).toBe( 0 ) );
		jest.mocked( apiFetch ).mockClear();
		await act( async () => {
			await legacyQueryClient.fetchQuery( {
				queryKey: [ 'critical_css_state' ],
				queryFn: async () => ( { status: 'generated', updated: 1 } ),
			} );
		} );
		expect( apiFetch ).not.toHaveBeenCalled();

		act( () => {
			legacyQueryClient.setQueryData( [ 'critical_css_state' ], {
				status: 'generated',
				updated: 2,
			} );
		} );
		await waitFor( () =>
			expect( client.getQueryState( [ 'critical_css_state' ] )?.dataUpdateCount ).toBe( 2 )
		);
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { url: expect.stringContaining( '/critical-css-state' ) } )
		);
	} finally {
		stopObserving();
		legacyQueryClient.clear();
	}
} );

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
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	const dashboard = ( isOverview: boolean ) => (
		<>
			<div hidden={ ! isOverview }>
				<QueryClientProvider client={ client }>
					<Overview isVisible={ isOverview } />
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
			wpApiSettings.nonce
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
	expect( screen.queryByRole( 'button', { name: 'Refresh' } ) ).not.toBeInTheDocument();
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
	renderOverview();
	await expect( screen.findByText( 'Score service unavailable' ) ).resolves.toBeTruthy();
	expect( screen.queryByText( '91' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '81' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	for ( const name of [ 'Overall grade', 'Desktop', 'Mobile' ] ) {
		expect( screen.getByRole( 'region', { name } ) ).toHaveAttribute( 'aria-busy', 'false' );
	}
	expect( screen.getByRole( 'button', { name: 'Refresh' } ) ).toBeEnabled();
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'speed_score_request_error', {
		error_message: 'Score service unavailable',
	} );
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	expect( screen.queryByText( 'Score service unavailable' ) ).not.toBeInTheDocument();
} );

test( 'retains loaded scores and Refresh alongside a subsequent score error', async () => {
	renderOverview();
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
	jest.mocked( requestSpeedScores ).mockRejectedValueOnce( new Error( 'Refresh failed' ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );
	await expect( screen.findByText( 'Refresh failed' ) ).resolves.toBeTruthy();
	expect( screen.getByText( '91' ) ).toBeInTheDocument();
	expect( screen.getByText( '81' ) ).toBeInTheDocument();
	expect( screen.getByRole( 'region', { name: 'Desktop' } ) ).toHaveAttribute(
		'aria-busy',
		'false'
	);
	expect( screen.getByRole( 'button', { name: 'Refresh' } ) ).toBeEnabled();
	fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );
	await waitFor( () => expect( screen.queryByText( 'Refresh failed' ) ).not.toBeInTheDocument() );
	await expect( screen.findByText( '91' ) ).resolves.toBeTruthy();
} );

test( 'does not present initial loading scores as measured scores', () => {
	jest.mocked( requestSpeedScores ).mockReturnValue( new Promise( () => {} ) );
	renderOverview();
	expect( screen.queryByText( '91' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '81' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'region', { name: 'Desktop' } ) ).toHaveAttribute(
		'aria-busy',
		'true'
	);
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Refresh' } ) );
	expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
} );

test.each( [
	[ 40, 'Poor' ],
	[ 60, 'Could be improved' ],
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
	expect(
		within( screen.getByRole( 'region', { name: 'Overall grade' } ) ).queryByText(
			/Good|Could be improved|Poor/
		)
	).not.toBeInTheDocument();
	const trigger = within( screen.getByRole( 'region', { name: 'Overall grade' } ) ).getByRole(
		'button',
		{ name: 'How the overall grade is calculated' }
	);
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	fireEvent.click( trigger );
	const tooltip = await screen.findByRole( 'dialog' );
	expect( tooltip ).toHaveTextContent(
		"Your Overall Score is a summary of your first Cornerstone Page across both mobile and desktop devices. It gives a general idea of your site's overall performance."
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
	await expect( screen.findByText( '91' ) ).resolves.toBeVisible();
	expect( apiFetch ).not.toHaveBeenCalledWith(
		expect.objectContaining( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history',
		} )
	);
	expect( screen.queryByText( /Performance history will appear/ ) ).not.toBeInTheDocument();
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

test( 'selects the paid empty history state using module availability', async () => {
	renderOverview();
	await expect( screen.findByText( /Performance history will appear/ ) ).resolves.toBeTruthy();
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
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
			wpApiSettings.nonce
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
			options.url?.endsWith( '/performance-history' )
				? Promise.resolve( { status: 'error', message: 'History service unavailable' } )
				: fetch( options )
		);
	renderOverview();
	await expect( screen.findByText( 'History service unavailable' ) ).resolves.toBeTruthy();
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
	expect( apiFetch ).not.toHaveBeenCalledWith( expect.objectContaining( { method: 'POST' } ) );
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
	await waitFor( () =>
		expect( screen.getByRole( 'region', { name: 'Desktop' } ) ).toHaveAttribute(
			'aria-busy',
			'false'
		)
	);
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
	expect( screen.getByText( /Performance history will appear/ ) ).toBeVisible();
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
	[ 100, 'A' ],
	[ 90, 'B' ],
	[ 76, 'B' ],
	[ 75, 'C' ],
	[ 71, 'C' ],
	[ 50, 'D' ],
	[ 30, 'E' ],
	[ 0, 'F' ],
] )( 'shows the Overall letter without a tier at score %s', ( score, grade ) => {
	render(
		<ScoreCards
			scores={ {
				current: { desktop: Number( score ), mobile: Number( score ) },
				noBoost: null,
				isStale: false,
			} }
		/>
	);
	const overall = within( screen.getByRole( 'region', { name: 'Overall grade' } ) );
	expect( overall.getByText( String( grade ) ) ).toBeInTheDocument();
	expect( overall.queryByText( /Good|Could be improved|Poor/ ) ).not.toBeInTheDocument();
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
