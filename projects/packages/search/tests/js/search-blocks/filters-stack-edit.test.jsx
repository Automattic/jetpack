import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import FiltersStackEdit from '../../../src/search-blocks/blocks/filters-stack/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="filters-stack-inner-blocks" /> ),
} ) );

describe( 'FiltersStackEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
	} );

	it( 'renders InnerBlocks with the default filter template + allowedBlocks contract', () => {
		render( <FiltersStackEdit /> );

		expect( screen.getByTestId( 'filters-stack-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[ 'jetpack-search/active-filters' ],
			[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
			[ 'jetpack-search/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
			[ 'jetpack-search/filter-checkbox', { filterType: 'author' } ],
			[ 'jetpack-search/filter-checkbox', { filterType: 'post_type' } ],
			[ 'jetpack-search/filter-date', { interval: 'year' } ],
			[ 'jetpack-search/filter-post-type' ],
		] );
		expect( props.allowedBlocks ).toEqual( [
			'jetpack-search/active-filters',
			'jetpack-search/filter-checkbox',
			'jetpack-search/filter-date',
			'jetpack-search/filter-post-type',
		] );
	} );
} );
