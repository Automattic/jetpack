import { render, screen } from '@testing-library/react';
import FiltersPopoverEdit from '../../../src/search-blocks/blocks/filters-popover/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: () => <div data-testid="filters-popover-inner-blocks" />,
	InspectorControls: ( { children } ) => (
		<div data-testid="filters-popover-inspector">{ children }</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { children } ) => <div>{ children }</div>,
	SelectControl: ( { label } ) => <span data-testid="filters-popover-mode-select">{ label }</span>,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

const renderEdit = ( attributes = {} ) =>
	render( <FiltersPopoverEdit attributes={ attributes } setAttributes={ jest.fn() } /> );

describe( 'FiltersPopoverEdit', () => {
	describe( 'default (responsive) mode', () => {
		it( 'renders inline children with no trigger when no displayMode is set', () => {
			renderEdit();
			expect( screen.queryByRole( 'button', { name: 'Filter results' } ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
		} );

		it( 'falls back to responsive for an unknown displayMode value', () => {
			renderEdit( { displayMode: 'something-else' } );
			expect( screen.queryByRole( 'button', { name: 'Filter results' } ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'popover-always mode', () => {
		// In popover-always mode the editor still renders children inline so
		// authors can edit them; the visual collapse is signalled by the
		// trigger button being present alongside. Front-end visibility is
		// class-driven by the Interactivity store — covered by
		// `Filters_Popover_Render_Test` on the PHP side.
		it( 'renders the disabled trigger alongside the inline children', () => {
			renderEdit( { displayMode: 'popover-always' } );

			const trigger = screen.getByRole( 'button', { name: 'Filter results' } );
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( trigger ).toBeDisabled();
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
