import { render, screen } from '@testing-library/react';
import FilterPopoverEdit from '../../../src/search-blocks/blocks/filter-popover/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InnerBlocks: () => <div data-testid="filter-popover-inner-blocks" />,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'FilterPopoverEdit', () => {
	it( 'renders the editor preview with the filter panel closed', () => {
		render( <FilterPopoverEdit /> );

		expect( screen.getByRole( 'button', { name: 'Filter results' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect( screen.getByRole( 'dialog', { hidden: true } ) ).toHaveAttribute( 'hidden' );
		expect( screen.getByRole( 'dialog', { hidden: true } ) ).toHaveAttribute(
			'aria-label',
			'Filters'
		);
	} );
} );
