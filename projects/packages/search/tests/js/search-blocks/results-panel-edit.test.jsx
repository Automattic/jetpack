import { render, screen } from '@testing-library/react';
import { InnerBlocks } from '@wordpress/block-editor';
import ResultsPanelEdit from '../../../src/search-blocks/blocks/results-panel/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: jest.fn( () => <div data-testid="results-panel-inner-blocks" /> ),
} ) );

describe( 'ResultsPanelEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
	} );

	it( 'renders InnerBlocks with the default result-stack template + allowedBlocks contract', () => {
		render( <ResultsPanelEdit /> );

		expect( screen.getByTestId( 'results-panel-inner-blocks' ) ).toBeInTheDocument();
		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.template ).toEqual( [
			[
				'core/group',
				{ layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } },
				[ [ 'jetpack/results-count' ], [ 'jetpack/sort-control' ] ],
			],
			[ 'jetpack/search-results' ],
			[ 'jetpack/load-more' ],
		] );
		expect( props.allowedBlocks ).toEqual( [
			'core/group',
			'jetpack/results-count',
			'jetpack/sort-control',
			'jetpack/search-results',
			'jetpack/load-more',
		] );
	} );
} );
