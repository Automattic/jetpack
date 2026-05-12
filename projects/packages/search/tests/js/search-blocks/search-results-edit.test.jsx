import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import SearchResultsEdit from '../../../src/search-blocks/blocks/search-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="search-results-inner-blocks" /> ),
} ) );

describe( 'SearchResultsEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
	} );

	it( 'renders InnerBlocks with the default result-stack template + allowedBlocks contract', () => {
		render( <SearchResultsEdit /> );

		expect( screen.getByTestId( 'search-results-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[
				'core/group',
				{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
				[ [ 'jetpack-search/results-count' ], [ 'jetpack-search/results-sort' ] ],
			],
			[ 'jetpack-search/results-list' ],
			[ 'jetpack-search/results-load-more' ],
			[ 'jetpack-search/powered-by' ],
		] );
		expect( props.allowedBlocks ).toEqual( [
			'core/group',
			'jetpack-search/results-count',
			'jetpack-search/results-sort',
			'jetpack-search/results-list',
			'jetpack-search/results-load-more',
			'jetpack-search/powered-by',
		] );
	} );
} );
