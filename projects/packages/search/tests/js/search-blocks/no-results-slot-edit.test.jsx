import { render, screen } from '@testing-library/react';
import { InnerBlocks, store as blockEditorStore } from '@wordpress/block-editor';
import NoResultsSlotEdit, {
	conditionLabel,
} from '../../../src/search-blocks/blocks/no-results/slot/edit';

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

	// Selecting by store object rather than the 'core/block-editor' string survives a store rename.
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

	// The class is the contract with `render.php`, which puts it on the same element via
	// `get_block_wrapper_attributes()`.
	it( 'puts the front-end default class on the wrapper only while empty', () => {
		const { unmount } = render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		const wrapper = screen.getByTestId( 'no-results-variant' );
		expect( wrapper ).toHaveClass( 'jetpack-search-no-results__variant' );
		expect( wrapper ).toHaveClass( 'jetpack-search-no-results--default' );
		unmount();

		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		const authored = screen.getByTestId( 'no-results-variant' );
		expect( authored ).toHaveClass( 'jetpack-search-no-results__variant' );
		expect( authored ).not.toHaveClass( 'jetpack-search-no-results--default' );
	} );

	it( 'drops the preview once the variant has inner blocks', () => {
		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.queryByText( UNFILTERED_DEFAULT ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );

	it( 'offers no control over the condition', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.queryByTestId( 'inspector' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the unscoped condition for an unknown saved value', () => {
		render( <NoResultsSlotEdit attributes={ { condition: 'bogus' } } clientId="v-1" /> );

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	it( 'paints no condition label on the canvas', () => {
		render( <NoResultsSlotEdit attributes={ { condition: 'filtered' } } clientId="v-1" /> );

		expect( screen.queryByText( 'Filters are active' ) ).not.toBeInTheDocument();
	} );

	// Unconditional, matching core's own handling of a custom appender and the two `filters` blocks.
	// Gating it on selection would leave an untouched variant with no way in, and every variant ships
	// untouched.
	it( 'renders the bounded appender whether or not the variant is selected', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( InnerBlocks.mock.calls[ 0 ][ 0 ].renderAppender ).toBe(
			InnerBlocks.ButtonBlockAppender
		);
		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );

	// Unmounting it would make a drag onto the variant resolve to the container, whose
	// `allowedBlocks` rejects everything but a variant.
	it( 'keeps the inner drop target mounted while the variant is empty', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );
} );

describe( 'conditionLabel', () => {
	it.each( [
		[ 'any', 'Any empty search' ],
		[ 'filtered', 'Filters are active' ],
		[ 'error', 'Search failed' ],
	] )( 'names the %s condition', ( condition, label ) => {
		expect( conditionLabel( { condition } ) ).toBe( label );
	} );

	it.each( [
		[ 'no saved condition', {} ],
		[ 'an unknown condition', { condition: 'bogus' } ],
		[ 'no attributes', undefined ],
	] )( 'falls back to the unscoped label for %s', ( _label, attributes ) => {
		expect( conditionLabel( attributes ) ).toBe( 'Any empty search' );
	} );
} );
