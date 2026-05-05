import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import CommonFiltersEdit from '../../../src/search-blocks/blocks/common-filters/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="common-filters-inner-blocks" /> ),
} ) );

describe( 'CommonFiltersEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
	} );

	it( 'renders InnerBlocks with the default filter template + allowedBlocks contract', () => {
		render( <CommonFiltersEdit /> );

		expect( screen.getByTestId( 'common-filters-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[ 'jetpack/active-filters' ],
			[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
			[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
			[ 'jetpack/filter-checkbox', { filterType: 'author' } ],
			[ 'jetpack/filter-checkbox', { filterType: 'post_type' } ],
			[ 'jetpack/filter-date', { interval: 'year' } ],
			[ 'jetpack/post-type-filter' ],
		] );
		expect( props.allowedBlocks ).toEqual( [
			'jetpack/active-filters',
			'jetpack/filter-checkbox',
			'jetpack/filter-date',
			'jetpack/post-type-filter',
		] );
	} );
} );
