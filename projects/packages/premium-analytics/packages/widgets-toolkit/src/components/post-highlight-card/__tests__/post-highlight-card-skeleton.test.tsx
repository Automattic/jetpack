/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PostHighlightCardSkeleton } from '../post-highlight-card-skeleton';

describe( 'PostHighlightCardSkeleton', () => {
	it( 'draws the card fields both widgets always render', () => {
		render( <PostHighlightCardSkeleton /> );

		expect( screen.getAllByTestId( 'skeleton-title-line' ) ).toHaveLength( 2 );
		// Latest post and Popular post both render views, likes, and comments.
		expect( screen.getAllByTestId( 'skeleton-stat' ) ).toHaveLength( 3 );
	} );

	it( 'stacks each stat label above its value, as the loaded card does', () => {
		render( <PostHighlightCardSkeleton /> );

		const [ label ] = screen.getAllByTestId( 'skeleton-stat-label' );
		const [ value ] = screen.getAllByTestId( 'skeleton-stat-value' );

		expect( label.compareDocumentPosition( value ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
