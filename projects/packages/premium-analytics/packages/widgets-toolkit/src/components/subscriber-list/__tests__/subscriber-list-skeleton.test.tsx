/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SubscriberListSkeleton } from '../subscriber-list-skeleton';

describe( 'SubscriberListSkeleton', () => {
	it( 'draws the rows the widget asked for', () => {
		render( <SubscriberListSkeleton rows={ 3 } /> );

		expect( screen.getAllByTestId( 'skeleton-row' ) ).toHaveLength( 3 );
	} );

	it( 'fills the tile when the widget asks for every row', () => {
		// Widgets pass their own row count through, and a `max` of 0 means "all
		// rows" — drawing it literally would leave an empty loading state.
		render( <SubscriberListSkeleton rows={ 0 } /> );

		expect( screen.getAllByTestId( 'skeleton-row' ).length ).toBeGreaterThan( 1 );
	} );

	it( 'puts the trailing line after the avatar and the name', () => {
		// Order is the whole point of a content-shaped skeleton: the loaded row
		// reads avatar, name, then the "since" time.
		render( <SubscriberListSkeleton rows={ 1 } /> );

		const avatar = screen.getByTestId( 'skeleton-avatar' );
		const name = screen.getByTestId( 'skeleton-name' );
		const secondary = screen.getByTestId( 'skeleton-secondary' );

		expect( avatar.compareDocumentPosition( name ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( name.compareDocumentPosition( secondary ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
