import { render, screen } from '@testing-library/react';
import DisabledEdit from '..';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
} ) );

describe( 'DisabledEdit', () => {
	it( 'explains that Jetpack AI is off', () => {
		render( <DisabledEdit /> );

		expect( screen.getByText( 'Jetpack AI Search' ) ).toBeInTheDocument();
		// Placeholder renders its instructions twice, once visually hidden for screen readers.
		expect( screen.getAllByText( /Jetpack AI is turned off for this site/ ) ).not.toHaveLength( 0 );
	} );
} );
