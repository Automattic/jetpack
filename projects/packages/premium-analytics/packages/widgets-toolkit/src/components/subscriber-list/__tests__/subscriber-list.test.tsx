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

		expect( screen.getByRole( 'link', { name: /Ada Lovelace/ } ) ).toHaveAttribute(
			'target',
			'_blank'
		);
	} );
} );
