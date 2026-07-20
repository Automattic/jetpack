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

jest.mock( '@wordpress/components', () => ( {
	Notice: ( { children } ) => <div role="status">{ children }</div>,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// Simulates the `core/block-editor` store: `mockBlockEditorStore` controls
// whether a stray filter-family block sits outside this block's own
// InnerBlocks (a sibling in the parent, rather than a child).
let mockBlockEditorStore;

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => mockBlockEditorStore ),
} ) );

const THIS_CLIENT_ID = 'filters-product-block-client-id';

describe( 'FiltersProductEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		// Default: no siblings at all — no stray filter block.
		mockBlockEditorStore = {
			getBlockRootClientId: () => undefined,
			getBlocks: () => [],
		};
	} );

	it( 'renders InnerBlocks with the default WC filter template + allowedBlocks contract', () => {
		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

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
		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

		const props = InnerBlocks.mock.calls[ 0 ][ 0 ];
		expect( props.renderAppender ).toBe( InnerBlocks.ButtonBlockAppender );
	} );

	it( 'shows the "Filters Product" boundary label', () => {
		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

		expect( screen.getByText( 'Filters Product' ) ).toBeInTheDocument();
	} );

	it( 'shows no warning when no stray filter block sits outside the container', () => {
		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'warns when a WC filter block sits as a sibling instead of a child', () => {
		mockBlockEditorStore = {
			getBlockRootClientId: clientId =>
				clientId === THIS_CLIENT_ID ? 'parent-column' : undefined,
			getBlocks: parentClientId =>
				parentClientId === 'parent-column'
					? [
							{ clientId: THIS_CLIENT_ID, name: 'jetpack-search/filters-product' },
							{ clientId: 'stray-block', name: 'jetpack-search/filter-wc-price' },
					  ]
					: [],
		};

		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( /sits outside this container/ );
	} );

	it( 'does not warn about unrelated sibling blocks', () => {
		mockBlockEditorStore = {
			getBlockRootClientId: clientId =>
				clientId === THIS_CLIENT_ID ? 'parent-column' : undefined,
			getBlocks: parentClientId =>
				parentClientId === 'parent-column'
					? [
							{ clientId: THIS_CLIENT_ID, name: 'jetpack-search/filters-product' },
							{ clientId: 'unrelated-block', name: 'core/paragraph' },
					  ]
					: [],
		};

		render( <FiltersProductEdit clientId={ THIS_CLIENT_ID } /> );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );
} );
