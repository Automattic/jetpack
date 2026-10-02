import { render, screen, within } from '@testing-library/react';
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
	const bar = within( screen.getByTestId( 'score-bar' ) );
	expect( bar.getByText( 'C' ) ).toBeVisible();
	expect( bar.getByText( 'Good' ) ).toBeVisible();
	const [ desktop, mobile ] = bar.getAllByRole( 'progressbar', { hidden: true } );
	expect( desktop ).toHaveValue( 80 );
	expect( mobile ).toHaveValue( 68 );
	expect( bar.getByText( '+10' ) ).toBeVisible();
	expect( bar.getByText( '0' ) ).toBeVisible();
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
	expect( screen.queryByText( '+10' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
} );

test.each( [ { status: 'loading' as const, isRunning: true }, { hasScores: false } ] )(
	'shows generating instead of scores without another announcement: %j',
	pending => {
		render( <ScoreBar state={ { ...state, ...pending } } /> );
		expect( screen.getByText( 'Calculating score…' ) ).toBeVisible();
		expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar', { hidden: true } ) ).not.toBeInTheDocument();
	}
);

test( 'shows an error instead of generating when no scores have loaded', () => {
	render(
		<ScoreBar
			state={ {
				...state,
				status: 'error',
				hasScores: false,
				error: new Error( 'Request failed' ),
			} }
		/>
	);
	expect( screen.getByText( 'Failed to load speed scores' ) ).toBeVisible();
	expect( screen.queryByText( 'Calculating score…' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'alert', { hidden: true } ) ).not.toBeInTheDocument();
} );

test( 'keeps the previous scores after a failed refresh and marks the failure', () => {
	const error = new Error( 'Refresh failed' );
	render(
		<>
			<ScoreCards scores={ state.scores } hasScores error={ error } />
			<ScoreBar state={ { ...state, status: 'error', error } } />
		</>
	);
	const bar = within( screen.getByTestId( 'score-bar' ) );
	expect( bar.getByText( '80' ) ).toBeVisible();
	expect( bar.getByText( 'Failed to load speed scores' ) ).toBeVisible();
	expect( bar.getByText( '+10' ) ).toBeVisible();
	expect(
		within( screen.getByRole( 'region', { name: 'Desktop' } ) ).getByText( '80' )
	).toBeVisible();
} );

test( 'retains scores during a plain refetch, matching the card', () => {
	render(
		<>
			<ScoreCards scores={ state.scores } isLoading hasScores />
			<ScoreBar state={ { ...state, status: 'loading' } } />
		</>
	);
	const bar = screen.getByTestId( 'score-bar' );
	expect( bar ).toHaveAttribute( 'aria-hidden', 'true' );
	expect( within( bar ).getByText( '80' ) ).toBeVisible();
	expect(
		within( screen.getByRole( 'region', { name: 'Desktop' } ) ).getByText( '80' )
	).toBeVisible();
	expect( screen.queryByText( 'Calculating score…' ) ).not.toBeInTheDocument();
} );
