import { act, render, screen, within } from '@testing-library/react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScoreCardVisibility } from './lib/use-score-card-visibility';
import ScoreBar from './score-bar';
import ScoreCards from './score-cards';
import type { SpeedScoreState } from './lib/use-speed-scores';

const state: SpeedScoreState = {
	status: 'loaded',
	hasScores: true,
	isRunning: false,
	scores: {
		current: { desktop: 80, mobile: 68 },
		noBoost: { desktop: 70, mobile: 78 },
		isStale: false,
	},
};

test( 'shows the shared grade, device scores and baseline-relative compact badges', () => {
	render( <ScoreBar state={ state } /> );
	const bar = within( screen.getByRole( 'region', { name: 'Site speed summary' } ) );
	expect( bar.getByText( 'C' ) ).toBeVisible();
	expect( bar.getByText( 'Good' ) ).toBeVisible();
	expect( bar.getByRole( 'progressbar', { name: 'Desktop' } ) ).toHaveValue( 80 );
	expect( bar.getByRole( 'progressbar', { name: 'Mobile' } ) ).toHaveValue( 68 );
	expect( bar.getByText( '+10' ) ).toBeVisible();
	expect( bar.getByText( '0' ) ).toBeVisible();
	expect( bar.getByText( '+10 points' ) ).toBeInTheDocument();
	expect( bar.getByText( '0 points' ) ).toBeInTheDocument();
} );

test.each( [ true, false ] )( 'omits unavailable comparisons (stale=%s)', isStale => {
	render(
		<ScoreBar
			state={ {
				...state,
				scores: { ...state.scores, isStale, noBoost: isStale ? state.scores.noBoost : null },
			} }
		/>
	);
	expect( screen.queryByText( /points/ ) ).not.toBeInTheDocument();
} );

test.each( [
	{ status: 'loading' as const, isRunning: true },
	{ status: 'loading' as const, isRunning: false },
	{ hasScores: false },
] )( 'shows generating instead of scores without another announcement: %j', pending => {
	render( <ScoreBar state={ { ...state, ...pending } } /> );
	expect( screen.getByText( 'Calculating score…' ) ).toBeVisible();
	expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
} );

test( 'shows an error instead of generating or scores without another alert', () => {
	render(
		<ScoreBar state={ { ...state, status: 'error', error: new Error( 'Refresh failed' ) } } />
	);
	expect( screen.getByText( 'Failed to load speed scores' ) ).toBeVisible();
	expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
} );

function Dashboard( { enabled = true, scoreState = state } ) {
	const cardRef = useRef< HTMLDivElement >( null );
	const { slot, isAboveViewport } = useScoreCardVisibility( cardRef, enabled );
	return (
		<div className="jp-admin-page__page">
			<header>Boost header</header>
			<div style={ { overflowY: 'auto' } } data-testid="dashboard-scroller">
				<div ref={ cardRef }>
					<ScoreCards
						scores={ scoreState.scores }
						isRunning={ scoreState.isRunning }
						hasScores={ scoreState.hasScores }
					/>
				</div>
			</div>
			{ enabled &&
				slot &&
				isAboveViewport &&
				createPortal( <ScoreBar state={ scoreState } />, slot ) }
		</div>
	);
}

test( 'observes the dashboard scroller, shows only above it, and cleans up on subpages', () => {
	let intersect: IntersectionObserverCallback;
	const observe = jest.fn();
	const disconnect = jest.fn();
	const original = window.IntersectionObserver;
	const constructor = jest.fn( callback => {
		intersect = callback;
		return { observe, disconnect };
	} );
	window.IntersectionObserver = constructor as unknown as typeof IntersectionObserver;
	try {
		const { rerender, unmount } = render( <Dashboard /> );
		expect( constructor ).toHaveBeenCalledWith( expect.any( Function ), {
			root: screen.getByTestId( 'dashboard-scroller' ),
			threshold: 0,
		} );
		expect( observe ).toHaveBeenCalledTimes( 1 );
		const report = ( isIntersecting: boolean, bottom: number ) =>
			act( () =>
				intersect(
					[
						{
							isIntersecting,
							boundingClientRect: { bottom },
							rootBounds: { top: 100 },
						} as IntersectionObserverEntry,
					],
					{} as IntersectionObserver
				)
			);
		report( false, 1200 );
		expect(
			screen.queryByRole( 'region', { name: 'Site speed summary' } )
		).not.toBeInTheDocument();
		report( true, 101 );
		expect(
			screen.queryByRole( 'region', { name: 'Site speed summary' } )
		).not.toBeInTheDocument();
		report( false, 99 );
		expect( screen.getByRole( 'region', { name: 'Site speed summary' } ) ).toBeVisible();
		rerender( <Dashboard scoreState={ { ...state, status: 'loading', isRunning: true } } /> );
		expect( screen.getAllByRole( 'status' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Calculating…' );
		expect( screen.getByText( 'Calculating score…' ) ).toBeVisible();
		report( true, 150 );
		expect(
			screen.queryByRole( 'region', { name: 'Site speed summary' } )
		).not.toBeInTheDocument();
		report( false, 99 );
		rerender( <Dashboard enabled={ false } /> );
		expect(
			screen.queryByRole( 'region', { name: 'Site speed summary' } )
		).not.toBeInTheDocument();
		expect( disconnect ).toHaveBeenCalledTimes( 1 );
		unmount();
	} finally {
		window.IntersectionObserver = original;
	}
} );
