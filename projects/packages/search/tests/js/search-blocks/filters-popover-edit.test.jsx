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
} ) );

jest.mock( '@wordpress/icons', () => ( {
	filter: 'filter-icon',
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'FiltersPopoverEdit', () => {
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
} );
