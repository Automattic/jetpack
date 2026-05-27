import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import FiltersPopoverEdit from '../../../src/search-blocks/blocks/filters-popover/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: () => <div data-testid="filters-popover-inner-blocks" />,
	InspectorControls: ( { children } ) => (
		<div data-testid="filters-popover-inspector">{ children }</div>
	),
	BlockControls: ( { children } ) => (
		<div data-testid="filters-popover-block-controls">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { children } ) => <div>{ children }</div>,
	SelectControl: ( { label } ) => <span data-testid="filters-popover-mode-select">{ label }</span>,
	ToolbarGroup: ( { children } ) => <div>{ children }</div>,
	ToolbarButton: ( { label, isPressed, onClick } ) => (
		<button type="button" onClick={ onClick } aria-pressed={ isPressed ? 'true' : 'false' }>
			{ label }
		</button>
	),
} ) );

jest.mock( '@wordpress/icons', () => ( {
	filter: 'filter-icon',
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

const renderEdit = ( attributes = {} ) =>
	render( <FiltersPopoverEdit attributes={ attributes } setAttributes={ jest.fn() } /> );

describe( 'FiltersPopoverEdit', () => {
	describe( 'default (popover-always) mode', () => {
		// In popover-always mode the trigger button is a non-interactive preview
		// of the front-end control. A block-toolbar button is the actual toggle
		// in the editor — clicking the inline trigger would select the block and
		// open the settings sidebar without a way to collapse the panel again.
		// Front-end visibility is class-driven by the Interactivity store and
		// covered by `Filters_Popover_Render_Test` on the PHP side.
		it( 'renders the disabled preview trigger and a toolbar toggle in the closed state', () => {
			renderEdit();

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
			renderEdit();

			await user.click( screen.getByRole( 'button', { name: 'Show filter panel' } ) );
			const opened = screen.getByRole( 'button', { name: 'Hide filter panel' } );
			expect( opened ).toHaveAttribute( 'aria-pressed', 'true' );

			await user.click( opened );
			const closed = screen.getByRole( 'button', { name: 'Show filter panel' } );
			expect( closed ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'falls back to popover-always for an unknown displayMode value', () => {
			renderEdit( { displayMode: 'something-else' } );
			expect( screen.getByRole( 'button', { name: 'Filter results' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Show filter panel' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'region', { name: 'Search filters' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'responsive mode', () => {
		it( 'renders an inline labelled region with no trigger or toolbar toggle', () => {
			renderEdit( { displayMode: 'responsive' } );
			expect( screen.queryByRole( 'button', { name: 'Filter results' } ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Show filter panel' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Hide filter panel' } )
			).not.toBeInTheDocument();
			expect( screen.getByRole( 'region', { name: 'Search filters' } ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
		} );
	} );

	it( 'exposes the display-mode select in the inspector', () => {
		renderEdit();
		expect( screen.getByTestId( 'filters-popover-mode-select' ) ).toHaveTextContent(
			'Display mode'
		);
	} );
} );
