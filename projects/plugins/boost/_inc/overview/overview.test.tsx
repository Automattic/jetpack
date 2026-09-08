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
import { useDismissibleAlertState as useLegacyAlertState } from '../../app/assets/src/js/features/performance-history/lib/hooks';
import PopOut from '../../app/assets/src/js/features/speed-score/pop-out/pop-out';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import * as speedScores from './lib/use-speed-scores';
import Overview from './overview';
import ScoreCard from './score-card';
import ScoreCards from './score-cards';

jest.mock( '@automattic/jetpack-boost-score-api', () => ( {
	...jest.requireActual( '@automattic/jetpack-boost-score-api' ),
	requestSpeedScores: jest.fn(),
} ) );
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
	expect( screen.getByText( '+10 points compared to without Boost' ) ).toBeInTheDocument();
	expect( screen.getByText( tier ) ).toBeInTheDocument();
} );

test( 'opens the overall grade explanation and dismisses it with Escape', async () => {
	render( <ScoreCards scores={ scores } /> );
	expect(
		within( screen.getByRole( 'region', { name: 'Overall grade' } ) ).getByText( 'Good' )
	).toBeInTheDocument();
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

test( 'renders a negative baseline delta alongside the current measured bar', () => {
	render( <ScoreCard icon={ null } label="Mobile" value={ 40 } score={ 40 } noBoost={ 60 } /> );
	expect( screen.getByRole( 'progressbar', { name: 'Mobile' } ) ).toHaveValue( 40 );
	expect( screen.getByText( '−20 points compared to without Boost' ) ).toBeInTheDocument();
	expect( screen.getByText( 'Poor' ) ).toBeInTheDocument();
} );

test( 'hides stale and absent baselines while preserving measured scores', () => {
	const { rerender } = render( <ScoreCards scores={ scores } /> );
	expect( screen.getByText( /\+10 points/ ) ).toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, isStale: true } } /> );
	expect( screen.queryByText( /compared to without Boost/ ) ).not.toBeInTheDocument();
	expect( screen.getByText( '91' ) ).toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, noBoost: null } } /> );
	expect( screen.queryByText( /compared to without Boost/ ) ).not.toBeInTheDocument();
} );

test( 'selects the free history upgrade using module availability', async () => {
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { available: false, active: false },
	};
	renderOverview();
	await expect( screen.findByRole( 'button', { name: 'Upgrade now' } ) ).resolves.toBeTruthy();
	expect( screen.queryByText( /Performance history will appear/ ) ).not.toBeInTheDocument();
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
				url: 'https://example.org/wp-json/jetpack-boost-ds/dismissed-alerts/set',
				method: 'POST',
				data: { JSON: { performance_history_fresh_start: true, score_decrease: true } },
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
	jest.mocked( apiFetch ).mockImplementation( async ( { url } ) => {
		if ( url?.includes( 'modules-state' ) ) {
			throw new Error( 'Module settings unavailable' );
		}
		return { status: 'success', JSON: null };
	} );
	renderOverview();
	await expect( screen.findByText( 'Module settings unavailable' ) ).resolves.toBeTruthy();
	expect(
		screen.getByText( 'Failed to load module settings', { selector: 'span' } )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
	jest.mocked( apiFetch ).mockClear();
	fireEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	expect( apiFetch ).toHaveBeenCalledWith(
		expect.objectContaining( { url: expect.stringContaining( 'modules-state' ) } )
	);
} );
