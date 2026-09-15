import { render, screen } from '@testing-library/react';
import AiDisabledPlaceholder from '..';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
} ) );

describe( 'AiDisabledPlaceholder', () => {
	it( 'shows the block name and the explanation it is given', () => {
		render( <AiDisabledPlaceholder label="AI Assistant" instructions="Jetpack AI is off." /> );

		expect( screen.getByText( 'AI Assistant' ) ).toBeInTheDocument();
		// Placeholder renders its instructions twice, once visually hidden for screen readers.
		expect( screen.getAllByText( 'Jetpack AI is off.' ) ).not.toHaveLength( 0 );
	} );

	it( 'offers no button or link', () => {
		render( <AiDisabledPlaceholder label="AI Assistant" instructions="Jetpack AI is off." /> );

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
