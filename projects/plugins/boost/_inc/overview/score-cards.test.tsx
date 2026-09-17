/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from '@testing-library/react';
import GradeExplanation from './grade-explanation';
import ScoreCards from './score-cards';

test( 'the Overall information popover shows the summary sentence and every grade range', async () => {
	render(
		<ScoreCards
			scores={ {
				current: { mobile: 68, desktop: 80 },
				noBoost: null,
				isStale: false,
			} }
		/>
	);

	expect( screen.getByRole( 'heading', { level: 2, name: 'Your site speed' } ) ).toBeVisible();
	for ( const label of [ 'Overall', 'Desktop', 'Mobile' ] ) {
		const region = screen.getByRole( 'region', { name: label } );
		expect( region ).toHaveAttribute(
			'aria-labelledby',
			within( region ).getByRole( 'heading', { level: 3, name: label } ).id
		);
	}
	expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'How the overall grade is calculated' } ) );
	const dialog = await screen.findByRole( 'dialog', { name: 'Overall grade' } );
	const popover = within( dialog );
	expect(
		popover.getByText(
			'Your overall score is a summary of your first Cornerstone Page across both mobile and desktop devices.'
		)
	).toBeVisible();
	expect( dialog ).not.toHaveTextContent( /general idea/ );
	expect( popover.getAllByRole( 'table' ) ).toHaveLength( 2 );
	for ( const [ grade, range ] of [
		[ 'A', '90+' ],
		[ 'B', '75 - 90' ],
		[ 'C', '50 - 75' ],
		[ 'D', '35 - 50' ],
		[ 'E', '25 - 35' ],
		[ 'F', '0 - 25' ],
	] ) {
		const row = within( popover.getByRole( 'row', { name: `${ grade } ${ range }` } ) );
		expect( row.getByRole( 'cell', { name: range } ) ).toBeVisible();
	}
} );

test( 'the legacy grade explanation keeps its full default description', () => {
	render( <GradeExplanation /> );
	expect(
		screen.getByText(
			"Your Overall Score is a summary of your first Cornerstone Page across both mobile and desktop devices. It gives a general idea of your site's overall performance."
		)
	).toBeInTheDocument();
} );

test.each( [
	[ 80, 68, 'C', 'Good', 'good' ],
	[ 80, 40, 'C', 'Could improve', 'medium' ],
	[ 60, 30, 'D', 'Poor', 'poor' ],
] )(
	'shows desktop %s and mobile %s as Overall %s with the device mean band %s',
	( desktopScore, mobileScore, grade, label, tier ) => {
		render(
			<ScoreCards
				scores={ {
					current: { desktop: Number( desktopScore ), mobile: Number( mobileScore ) },
					noBoost: null,
					isStale: false,
				} }
			/>
		);
		const overall = within( screen.getByRole( 'region', { name: 'Overall' } ) );
		expect( overall.getByText( String( grade ) ) ).toBeVisible();
		expect( overall.getByText( String( label ) ) ).toHaveClass(
			`jetpack-boost-overview__tier--${ tier }`
		);
		expect( overall.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	}
);

test.each( [
	[ 75, 'Good', 'good' ],
	[ 60, 'Could improve', 'medium' ],
	[ 40, 'Poor', 'poor' ],
] )( 'renders device score %s with its tier and progress color', ( score, label, tier ) => {
	render(
		<ScoreCards
			scores={ {
				current: { mobile: Number( score ), desktop: Number( score ) },
				noBoost: null,
				isStale: false,
			} }
		/>
	);
	for ( const device of [ 'Desktop', 'Mobile' ] ) {
		const card = within( screen.getByRole( 'region', { name: device } ) );
		expect( card.getByText( String( label ) ) ).toHaveClass(
			`jetpack-boost-overview__tier--${ tier }`
		);
		const progress = card.getByRole( 'progressbar', { name: device } );
		expect( progress ).toHaveValue( Number( score ) );
		// eslint-disable-next-line testing-library/no-node-access -- ProgressBar applies color classes to its wrapper.
		expect( progress.parentElement ).toHaveClass(
			'jetpack-boost-overview__progress',
			`jetpack-boost-overview__progress--${ tier }`
		);
	}
} );

test( 'shows positive baseline deltas only for current scores', () => {
	const scores = {
		current: { desktop: 80, mobile: 60 },
		noBoost: { desktop: 70, mobile: 70 },
		isStale: false,
	};
	const { rerender } = render( <ScoreCards scores={ scores } /> );
	expect( screen.getByText( '+10 points compared with Boost disabled' ) ).toBeVisible();
	expect(
		within( screen.getByRole( 'region', { name: 'Mobile' } ) ).queryByText(
			/compared with Boost disabled/
		)
	).not.toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, isStale: true } } /> );
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
	rerender( <ScoreCards scores={ { ...scores, noBoost: scores.current } } /> );
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
} );

test( 'omits an unchanged device delta while preserving the improved device delta', () => {
	render(
		<ScoreCards
			scores={ {
				current: { desktop: 80, mobile: 60 },
				noBoost: { desktop: 70, mobile: 60 },
				isStale: false,
			} }
		/>
	);
	expect(
		within( screen.getByRole( 'region', { name: 'Desktop' } ) ).getByText(
			'+10 points compared with Boost disabled'
		)
	).toBeVisible();
	expect(
		within( screen.getByRole( 'region', { name: 'Mobile' } ) ).queryByText(
			/compared with Boost disabled/
		)
	).not.toBeInTheDocument();
} );

test( 'shows one calculating status instead of the score sections before scores load', () => {
	const { container } = render(
		<ScoreCards
			scores={ { current: { desktop: 80, mobile: 60 }, noBoost: null, isStale: false } }
			isLoading
			hasScores={ false }
		/>
	);
	expect( screen.getByRole( 'heading', { level: 2, name: 'Your site speed' } ) ).toBeVisible();
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Calculating…' );
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	expect( container.querySelectorAll( '.components-spinner' ) ).toHaveLength( 1 );
	expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
} );

test( 'keeps loaded scores visible while they refresh', () => {
	render(
		<ScoreCards
			scores={ { current: { desktop: 80, mobile: 60 }, noBoost: null, isStale: false } }
			isLoading
		/>
	);
	expect( screen.queryByText( 'Calculating…' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'progressbar', { name: 'Desktop' } ) ).toHaveValue( 80 );
} );

test( 'shows a failure without scores inside the card and retries from it', () => {
	const onRetry = jest.fn();
	const { container } = render(
		<ScoreCards
			scores={ { current: { desktop: 80, mobile: 60 }, noBoost: null, isStale: false } }
			hasScores={ false }
			error={ new Error( 'Timed out while waiting for speed-score.' ) }
			onRetry={ onRetry }
		/>
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	const card = within( container.querySelector( '.jetpack-boost-overview__scores-card' )! );
	expect( card.getByRole( 'heading', { level: 2, name: 'Your site speed' } ) ).toBeVisible();
	expect( card.getByText( 'Failed to load speed scores' ) ).toBeVisible();
	expect( card.getByText( 'Timed out while waiting for speed-score.' ) ).toBeVisible();
	expect( screen.queryByRole( 'region' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( 'Calculating…' ) ).not.toBeInTheDocument();
	fireEvent.click( card.getByRole( 'button', { name: 'Try again' } ) );
	expect( onRetry ).toHaveBeenCalledTimes( 1 );
} );

test( 'shows a failed refresh inside the card above the retained scores', () => {
	const { container } = render(
		<ScoreCards
			scores={ { current: { desktop: 80, mobile: 60 }, noBoost: null, isStale: false } }
			error={ new Error( 'Refresh failed' ) }
		/>
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	const card = within( container.querySelector( '.jetpack-boost-overview__scores-card' )! );
	const notice = card.getByText( 'Failed to load speed scores' );
	const desktop = card.getByRole( 'region', { name: 'Desktop' } );
	expect( within( desktop ).getByRole( 'progressbar' ) ).toHaveValue( 80 );
	expect( notice.compareDocumentPosition( desktop ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
} );
