/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, within } from '@testing-library/react';
import ScoreCards from './score-cards';

test( 'the Overall information popover shows every grade and its score range', async () => {
	render(
		<ScoreCards
			scores={ {
				current: { mobile: 68, desktop: 80 },
				noBoost: null,
				isStale: false,
			} }
		/>
	);

	expect( screen.getByRole( 'heading', { level: 2, name: 'Performance scores' } ) ).toBeVisible();
	for ( const label of [ 'Overall grade', 'Desktop', 'Mobile' ] ) {
		const region = screen.getByRole( 'region', { name: label } );
		expect( region ).toHaveAttribute(
			'aria-labelledby',
			within( region ).getByRole( 'heading', { level: 3, name: label } ).id
		);
	}
	expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'How the overall grade is calculated' } ) );
	const popover = within( await screen.findByRole( 'dialog', { name: 'Overall grade' } ) );
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

test.each( [
	[ 91, 'A' ],
	[ 90, 'B' ],
	[ 75, 'C' ],
	[ 50, 'D' ],
	[ 35, 'E' ],
	[ 25, 'F' ],
] )( 'shows the Overall letter for score %s without a tier', ( score, grade ) => {
	render(
		<ScoreCards
			scores={ {
				current: { mobile: Number( score ), desktop: Number( score ) },
				noBoost: null,
				isStale: false,
			} }
		/>
	);
	const overall = within( screen.getByRole( 'region', { name: 'Overall grade' } ) );
	expect( overall.getByText( String( grade ) ) ).toBeVisible();
	expect( overall.queryByText( /Good|Could be improved|Poor/ ) ).not.toBeInTheDocument();
} );

test.each( [
	[ 75, 'Good', 'good' ],
	[ 60, 'Could be improved', 'medium' ],
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
		expect( progress.closest( '.jetpack-boost-overview__progress' ) ).toHaveClass(
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

test( 'announces unavailable scores without marking idle placeholders busy', () => {
	const scores = {
		current: { desktop: 80, mobile: 60 },
		noBoost: { desktop: 70, mobile: 70 },
		isStale: false,
	};
	const { rerender } = render(
		<ScoreCards scores={ scores } isLoading={ false } showPlaceholder />
	);
	for ( const label of [ 'Overall grade', 'Desktop', 'Mobile' ] ) {
		expect( screen.getByRole( 'region', { name: label } ) ).toHaveAttribute( 'aria-busy', 'false' );
	}
	expect( screen.getAllByText( 'Score unavailable' ) ).toHaveLength( 3 );
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( /compared with Boost disabled/ ) ).not.toBeInTheDocument();
	rerender( <ScoreCards scores={ scores } isLoading={ false } showPlaceholder={ false } /> );
	for ( const label of [ 'Overall grade', 'Desktop', 'Mobile' ] ) {
		expect( screen.getByRole( 'region', { name: label } ) ).toHaveAttribute( 'aria-busy', 'false' );
	}
	expect( screen.getByRole( 'progressbar', { name: 'Desktop' } ) ).toHaveValue( 80 );
} );

test( 'defaults placeholders to the loading state', () => {
	const scores = {
		current: { desktop: 80, mobile: 60 },
		noBoost: null,
		isStale: false,
	};
	const { rerender } = render( <ScoreCards scores={ scores } isLoading /> );
	for ( const label of [ 'Overall grade', 'Desktop', 'Mobile' ] ) {
		expect( screen.getByRole( 'region', { name: label } ) ).toHaveAttribute( 'aria-busy', 'true' );
	}
	expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( '80' ) ).not.toBeInTheDocument();
	rerender( <ScoreCards scores={ scores } isLoading={ false } /> );
	expect( screen.getByRole( 'region', { name: 'Desktop' } ) ).toHaveAttribute(
		'aria-busy',
		'false'
	);
	expect( screen.getByRole( 'progressbar', { name: 'Desktop' } ) ).toHaveValue( 80 );
} );
