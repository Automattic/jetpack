import { render, screen } from '@testing-library/react';
import DisabledEdit from '..';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { 'data-testid': 'ai-assistant-disabled', className: 'wp-block' } ),
} ) );

describe( 'DisabledEdit', () => {
	it( 'renders an empty block with the block props applied', () => {
		render( <DisabledEdit /> );

		const block = screen.getByTestId( 'ai-assistant-disabled' );
		expect( block ).toHaveClass( 'wp-block' );
		expect( block ).toBeEmptyDOMElement();
	} );
} );
