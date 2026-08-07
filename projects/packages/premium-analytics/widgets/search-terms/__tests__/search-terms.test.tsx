/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import SearchTermsWidget from '../render';
import useSearchTermViews from '../use-search-term-views';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-search-term-views' );

const mockUseSearchTermViews = jest.mocked( useSearchTermViews );

describe( 'SearchTermsWidget', () => {
	beforeEach( () => {
		mockUseSearchTermViews.mockReturnValue( {
			data: [],
			isLoading: false,
			isFetching: false,
			isError: false,
			error: null,
			hasComparison: false,
			refetch: jest.fn(),
		} );
	} );

	it( 'links to the Search Terms report', () => {
		render( <SearchTermsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/search-terms' )
		);
	} );
} );
