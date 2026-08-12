import { render, screen } from '@testing-library/react';
import { InnerBlocks, store as blockEditorStore } from '@wordpress/block-editor';
import NoResultsSlotEdit from '../../../src/search-blocks/blocks/no-results/slot/edit';

const mockSelectedStores = [];

jest.mock( '@wordpress/block-editor', () => {
	const mockInnerBlocks = jest.fn( () => <div data-testid="variant-inner-blocks" /> );
	mockInnerBlocks.ButtonBlockAppender = () => null;
	return {
		store: { name: 'core/block-editor' },
		useBlockProps: props => ( { ...props, className: props?.className } ),
		InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
		InnerBlocks: mockInnerBlocks,
	};
} );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

let mockInnerBlockCount = 0;
jest.mock( '@wordpress/data', () => ( {
	useSelect: callback =>
		callback( store => {
			mockSelectedStores.push( store );
			return { getBlockCount: () => mockInnerBlockCount };
		} ),
} ) );

const UNFILTERED_DEFAULT = 'No results found. Try a different search.';
const FILTERED_DEFAULT =
	'No results match these filters. Try clearing some, or searching for something else.';
const ERROR_DEFAULT = 'Something went wrong. Please try again.';

describe( 'NoResultsSlotEdit', () => {
	beforeEach( () => {
		InnerBlocks.mockClear();
		mockInnerBlockCount = 0;
	} );

	// The canvas preview mirrors render.php's fallback, so an author can see
	// what a visitor gets from a variant they haven't filled in yet.
	// Selecting by store object rather than the 'core/block-editor' string
	// keeps the dependency explicit and survives a store rename.
	it( 'selects state through the block-editor store object', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( mockSelectedStores ).toContain( blockEditorStore );
	} );

	it( 'previews the filter-aware pair for an empty unscoped variant', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	it( 'narrows the preview to the matching message for a scoped variant', () => {
		const { unmount } = render(
			<NoResultsSlotEdit attributes={ { condition: 'filtered' } } clientId="v-1" />
		);
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		unmount();

		render( <NoResultsSlotEdit attributes={ { condition: 'error' } } clientId="v-1" /> );
		expect( screen.getByText( ERROR_DEFAULT ) ).toBeInTheDocument();
		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
	} );

	// Authored content is what renders, so the preview has to get out of the
	// way — otherwise the canvas shows copy no visitor will ever see.
	it( 'drops the preview once the variant has inner blocks', () => {
		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );

	// Every condition already has a variant, so repointing one could only
	// duplicate a condition or vacate another — there is nothing to offer.
	it( 'offers no control over the condition', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.queryByTestId( 'inspector' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the unscoped condition for an unknown saved value', () => {
		render( <NoResultsSlotEdit attributes={ { condition: 'bogus' } } clientId="v-1" /> );

		expect( screen.getAllByText( 'Any empty search' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	// Several variants in one container look identical on the canvas without
	// this, so the label carries the condition.
	it( 'labels the variant with its condition on the canvas', () => {
		render( <NoResultsSlotEdit attributes={ { condition: 'filtered' } } clientId="v-1" /> );

		expect( screen.getAllByText( 'Filters are active' ).length ).toBeGreaterThan( 0 );
	} );
} );
