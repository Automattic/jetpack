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
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'keeps a row link in the same tab when the item opts out', () => {
		render(
			<SubscriberList
				items={ [
					{ id: 'ada', name: 'Ada Lovelace', href: 'https://example.com/ada', openInNewTab: false },
				] }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Ada Lovelace' } ) ).not.toHaveAttribute( 'target' );
	} );
} );
