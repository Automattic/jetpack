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
			const panel = screen.getByRole( 'group', { name: 'Filters' } );
			expect( panel ).not.toHaveAttribute( 'hidden' );
			expect( screen.getByTestId( 'filters-popover-inner-blocks' ) ).toBeInTheDocument();
		} );

		it( 'falls back to responsive for an unknown displayMode value', () => {
			renderEdit( { displayMode: 'something-else' } );
			expect( screen.queryByRole( 'button', { name: 'Filter results' } ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'group', { name: 'Filters' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'popover-always mode', () => {
		it( 'renders the closed trigger + dialog preview', () => {
			renderEdit( { displayMode: 'popover-always' } );

			expect( screen.getByRole( 'button', { name: 'Filter results' } ) ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
			const dialog = screen.getByRole( 'dialog', { hidden: true } );
			expect( dialog ).toHaveAttribute( 'hidden' );
			expect( dialog ).toHaveAttribute( 'aria-label', 'Filters' );
			// The dialog being the panel (not a group) is the mode-distinguishing
			// signal; the `is-mode-*` class is an internal CSS hook covered by
			// `Filters_Popover_Render_Test` on the PHP side.
			expect( screen.queryByRole( 'group', { name: 'Filters' } ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'exposes the display-mode select in the inspector', () => {
		renderEdit();
		expect( screen.getByTestId( 'filters-popover-mode-select' ) ).toHaveTextContent(
			'Display mode'
		);
	} );
} );
