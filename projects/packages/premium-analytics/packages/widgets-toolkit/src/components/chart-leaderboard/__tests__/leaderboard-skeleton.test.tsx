/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LeaderboardSkeleton } from '../leaderboard-skeleton';

describe( 'LeaderboardSkeleton', () => {
	it( 'draws the rows the widget asked for', () => {
		render( <LeaderboardSkeleton rows={ 3 } /> );

		expect( screen.getAllByTestId( 'skeleton-row' ) ).toHaveLength( 3 );
	} );

	it( 'fills the tile when the widget asks for every row', () => {
		// Widgets pass their `max` straight through, and `max = 0` means "all
		// rows" — drawing it literally would leave an empty loading state.
		render( <LeaderboardSkeleton rows={ 0 } /> );

		expect( screen.getAllByTestId( 'skeleton-row' ) ).toHaveLength( 12 );
	} );

	it( 'draws a label and its value on one line by default', () => {
		// The default matches a chart drawn `withOverlayLabel`, which every
		// widget but `sales-by-utm` uses.
		render( <LeaderboardSkeleton rows={ 2 } /> );

		expect( screen.getAllByTestId( 'skeleton-list-label' ) ).toHaveLength( 2 );
		expect( screen.getAllByTestId( 'skeleton-value' ) ).toHaveLength( 2 );
		expect( screen.queryByTestId( 'skeleton-bar' ) ).not.toBeInTheDocument();
	} );

	it( 'stacks the label over its bar for the plain chart', () => {
		render( <LeaderboardSkeleton rows={ 2 } variant="bars" /> );

		expect( screen.getAllByTestId( 'skeleton-bar-label' ) ).toHaveLength( 2 );
		expect( screen.getAllByTestId( 'skeleton-bar' ) ).toHaveLength( 2 );
		expect( screen.queryByTestId( 'skeleton-value' ) ).not.toBeInTheDocument();
	} );
} );
