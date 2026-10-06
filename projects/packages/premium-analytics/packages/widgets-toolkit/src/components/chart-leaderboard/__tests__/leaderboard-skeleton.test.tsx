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

	it.each( [
		// The default matches a chart drawn `withOverlayLabel`, which every widget but
		// `sales-by-utm` uses.
		[ 'a label and its value on one line by default', undefined, 'skeleton-value', 'skeleton-bar' ],
		[
			'the label over its bar for the plain chart',
			'bars' as const,
			'skeleton-bar',
			'skeleton-value',
		],
	] )( 'draws %s', ( _shape, variant, drawn, absent ) => {
		render( <LeaderboardSkeleton rows={ 2 } variant={ variant } /> );

		expect( screen.getAllByTestId( drawn ) ).toHaveLength( 2 );
		expect( screen.queryByTestId( absent ) ).not.toBeInTheDocument();
	} );
} );
