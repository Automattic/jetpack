import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import FiltersProductEdit from '../../../src/search-blocks/blocks/filters-product/edit';

jest.mock( '@wordpress/block-editor', () => {
	const mockInnerBlocks = jest.fn( () => <div data-testid="filters-product-inner-blocks" /> );
	mockInnerBlocks.ButtonBlockAppender = () => null;
	return {
		useBlockProps: props => ( { ...props, className: props?.className } ),
		InnerBlocks: mockInnerBlocks,
	};
} );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'FiltersProductEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
	} );

	it( 'renders InnerBlocks with the default WC filter template + allowedBlocks contract', () => {
		render( <FiltersProductEdit /> );

		expect( screen.getByTestId( 'filters-product-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.allowedBlocks ).toEqual( [
			'jetpack-search/active-filters',
			'jetpack-search/clear-filters',
			'jetpack-search/filter-wc-stock-status',
			'jetpack-search/filter-wc-rating',
			'jetpack-search/filter-wc-price',
			'jetpack-search/filter-wc-attribute',
			'jetpack-search/filter-checkbox',
			'jetpack-search/filter-date',
		] );
	} );

	it( 'bounds the insertion target with a persistent ButtonBlockAppender', () => {
		render( <FiltersProductEdit /> );

		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.renderAppender ).toBe( InnerBlocks.ButtonBlockAppender );
	} );

	it( 'shows the "Product Filters" boundary label', () => {
		render( <FiltersProductEdit /> );

		expect( screen.getByText( 'Product Filters' ) ).toBeInTheDocument();
	} );
} );
