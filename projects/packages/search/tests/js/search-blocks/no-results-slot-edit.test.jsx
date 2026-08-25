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
let mockIsSelected = false;
jest.mock( '@wordpress/data', () => ( {
	useSelect: callback =>
		callback( store => {
			mockSelectedStores.push( store );
			return {
				getBlockCount: () => mockInnerBlockCount,
				isBlockSelected: () => mockIsSelected,
				hasSelectedInnerBlock: () => false,
			};
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
		mockIsSelected = false;
	} );

	// The canvas preview mirrors render.php's fallback, so an author can see
	// what a visitor gets from a variant they haven't filled in yet.
	// Selecting by store object rather than the 'core/block-editor' string
	// keeps the dependency explicit and survives a store rename.
	it( 'selects state through the block-editor store object', () => {
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( mockSelectedStores ).toContain( blockEditorStore );
	} );

	// WYSIWYG at all times: the default selection state shows the full preview
	// without the variant ever being clicked (SEARCH-341).
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

	// The `--default` modifier lands on the block wrapper itself — the same
	// element render.php gives it via `get_block_wrapper_attributes()` — so the
	// canvas shows the same centered, dimmed treatment a visitor would see.
	it( 'puts the front-end default class on the wrapper only while empty', () => {
		const { unmount } = render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		// eslint-disable-next-line testing-library/no-node-access -- the class sits on the block wrapper, which exposes no role or text of its own to query.
		const wrapper = screen.getByText( UNFILTERED_DEFAULT ).parentElement;
		expect( wrapper ).toHaveClass( 'jetpack-search-no-results__variant' );
		expect( wrapper ).toHaveClass( 'jetpack-search-no-results--default' );
		unmount();

		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		// eslint-disable-next-line testing-library/no-node-access -- same wrapper as above, now holding only the mocked InnerBlocks.
		const authored = screen.getByTestId( 'variant-inner-blocks' ).parentElement;
		expect( authored ).not.toHaveClass( 'jetpack-search-no-results--default' );
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

		expect( screen.getByText( UNFILTERED_DEFAULT ) ).toBeInTheDocument();
		expect( screen.getByText( FILTERED_DEFAULT ) ).toBeInTheDocument();
	} );

	// The variant paints no name or outline of its own — identification is
	// Gutenberg's native selection UI plus the List view label (SEARCH-341).
	it( 'paints no condition label on the canvas', () => {
		render( <NoResultsSlotEdit attributes={ { condition: 'filtered' } } clientId="v-1" /> );

		expect( screen.queryByText( 'Filters are active' ) ).not.toBeInTheDocument();
	} );

	// Standard convention: the appender appears only while the block is
	// selected. The inner drop target stays mounted either way — unmounting it
	// would make a drag onto an unselected variant resolve to the container,
	// whose `allowedBlocks` rejects everything but a variant.
	it( 'shows the appender only while the variant is selected', () => {
		const { unmount } = render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		expect( InnerBlocks.mock.calls[ 0 ][ 0 ].renderAppender ).toBe( false );
		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
		unmount();

		mockIsSelected = true;
		InnerBlocks.mockClear();
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );
		expect( InnerBlocks.mock.calls[ 0 ][ 0 ].renderAppender ).toBe(
			InnerBlocks.ButtonBlockAppender
		);
	} );

	// Authored blocks are what the author reads on the canvas — never hidden
	// behind a summary line.
	it( 'keeps authored blocks visible while the variant is unselected', () => {
		mockInnerBlockCount = 1;
		render( <NoResultsSlotEdit attributes={ {} } clientId="v-1" /> );

		expect( screen.getByTestId( 'variant-inner-blocks' ) ).toBeInTheDocument();
	} );
} );

describe( 'conditionLabel', () => {
	// Wired as the block's `__experimentalLabel` so List view, breadcrumb, and
	// a11y announcements name the condition instead of repeating the title.
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
