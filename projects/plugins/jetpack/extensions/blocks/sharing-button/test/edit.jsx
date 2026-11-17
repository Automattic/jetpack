import { render, screen } from '@testing-library/react';
import metadata from '../block.json';
import SharingButtonEdit from '../edit';
import variations from '../variations';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => props,
} ) );

describe( 'Sharing Button', () => {
	// Core only falls back to the block's example when a variation doesn't set its own key.
	it.each( variations )( 'has an inserter preview for $name', variation => {
		const example = Object.hasOwn( variation, 'example' ) ? variation.example : metadata.example;
		expect( example ).toBeTruthy();
	} );

	it( 'renders with the icon and text style when rendered without its parent', () => {
		render(
			<SharingButtonEdit attributes={ { service: 'bluesky', label: 'Bluesky' } } context={ {} } />
		);

		const button = screen.getByRole( 'button', { name: 'Bluesky' } );
		expect( button ).toHaveClass( 'style-icon-text', 'share-bluesky' );
	} );
} );
