/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SubscriberList } from '../subscriber-list';

describe( 'SubscriberList', () => {
	it( 'opens a row link in a new tab when the item does not set openInNewTab', () => {
		render(
			<SubscriberList
				items={ [ { id: 'ada', name: 'Ada Lovelace', href: 'https://example.com/ada' } ] }
			/>
		);

		const link = screen.getByRole( 'link', { name: /Ada Lovelace/ } );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'keeps a row link in the same tab when the item opts out', () => {
		render(
			<SubscriberList
				items={ [
					{ id: 'ada', name: 'Ada Lovelace', href: 'https://example.com/ada', openInNewTab: false },
				] }
			/>
		);

		// One link only: a new-tab link rendered beside it would carry a target.
		const links = screen.getAllByRole( 'link' );
		expect( links ).toHaveLength( 1 );
		expect( links[ 0 ] ).not.toHaveAttribute( 'target' );
	} );
} );
