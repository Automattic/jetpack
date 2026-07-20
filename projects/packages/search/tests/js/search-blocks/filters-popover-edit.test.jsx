import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import FiltersPopoverEdit from '../../../src/search-blocks/blocks/filters-popover/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: () => <div data-testid="filters-popover-inner-blocks" />,
	BlockControls: ( { children } ) => (
		<div data-testid="filters-popover-block-controls">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	ToolbarGroup: ( { children } ) => <div>{ children }</div>,
	ToolbarButton: ( { label, isPressed, onClick } ) => (
		<button type="button" onClick={ onClick } aria-pressed={ isPressed ? 'true' : 'false' }>
			{ label }
		</button>
	),
	Notice: ( { children } ) => <div role="status">{ children }</div>,
	Disabled: ( { children } ) => <div data-testid="filters-popover-disabled">{ children }</div>,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	filter: 'filter-icon',
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// Simulates the `core/block-editor` store: `mockBlockEditorStore` controls
// whether a `jetpack-search/filters(-product)` block exists elsewhere in the
// document, which decides whether the popover mirrors it (read-only preview)
// or is directly editable (standalone).
let mockBlockEditorStore;

jest.mock( '@wordpress/data', () => ( {
	useSelect: callback => callback( () => mockBlockEditorStore ),
} ) );

describe( 'FiltersPopoverEdit', () => {
	beforeEach( () => {
		// Default: no sidebar Filters block anywhere in the document — standalone, editable.
		mockBlockEditorStore = {
			getClientIdsWithDescendants: () => [],
			getBlockName: () => undefined,
			getBlocks: () => [],
		};
	} );

	// The trigger button is a non-interactive preview of the front-end control.
	// A block-toolbar button is the actual toggle in the editor — clicking the
	// inline trigger would select the block and open the settings sidebar without
	// a way to collapse the panel again. Front-end visibility is class-driven by
	// the Interactivity store and covered by `Filters_Popover_Render_Test` on the
	// PHP side.
	it( 'renders the disabled preview trigger and a toolbar toggle in the closed state', () => {
		render( <FiltersPopoverEdit /> );

		const trigger = screen.getByRole( 'button', { name: 'Filter results' } );
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( trigger ).toBeDisabled();

		const toolbarToggle = screen.getByRole( 'button', { name: 'Show filter panel' } );
		expect( toolbarToggle ).toHaveAttribute( 'aria-pressed', 'false' );

		expect( screen.getByRole( 'region', { name: 'Search filters' } ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
	} );

	it( 'toggles the panel open and closed when the toolbar button is clicked', async () => {
		const user = userEvent.setup();
		render( <FiltersPopoverEdit /> );

		await user.click( screen.getByRole( 'button', { name: 'Show filter panel' } ) );
		const opened = screen.getByRole( 'button', { name: 'Hide filter panel' } );
		expect( opened ).toHaveAttribute( 'aria-pressed', 'true' );

		await user.click( opened );
		const closed = screen.getByRole( 'button', { name: 'Show filter panel' } );
		expect( closed ).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	it( 'is directly editable when standalone (no sidebar Filters block in the document)', () => {
		render( <FiltersPopoverEdit /> );

		expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'filters-popover-disabled' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( /collapsed to a button/ );
	} );

	it.each( [ 'jetpack-search/filters', 'jetpack-search/filters-product' ] )(
		'locks the panel read-only when a sidebar %s block exists elsewhere in the document',
		sourceBlockName => {
			mockBlockEditorStore = {
				getClientIdsWithDescendants: () => [ 'sidebar-filters-client-id' ],
				getBlockName: clientId =>
					clientId === 'sidebar-filters-client-id' ? sourceBlockName : undefined,
				getBlocks: () => [],
			};

			render( <FiltersPopoverEdit /> );

			const disabled = screen.getByTestId( 'filters-popover-disabled' );
			expect( disabled ).toContainElement( screen.getByTestId( 'filters-popover-inner-blocks' ) );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent( /mirrors the Filters block/ );
		}
	);
} );
