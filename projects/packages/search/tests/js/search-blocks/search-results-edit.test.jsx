import { render, screen } from '@testing-library/react';
import SearchResultsEdit from '../../../src/search-blocks/blocks/search-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'SearchResultsEdit', () => {
	it( 'does not show author names in the compact preview', () => {
		render( <SearchResultsEdit attributes={ { layout: 'compact' } } /> );

		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Apr 1, 2026' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Ada Lovelace' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Grace Hopper' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Katherine Johnson' ) ).not.toBeInTheDocument();
	} );
} );
