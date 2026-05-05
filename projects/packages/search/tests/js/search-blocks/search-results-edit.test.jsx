import { fireEvent, render, screen } from '@testing-library/react';
import SearchResultsEdit from '../../../src/search-blocks/blocks/search-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	RadioControl: ( { label, selected, options, onChange } ) => (
		<fieldset aria-label={ label } data-testid="layout-picker">
			{ options.map( option => {
				const id = `layout-${ option.value }`;
				return (
					<label key={ option.value } htmlFor={ id }>
						<input
							id={ id }
							type="radio"
							name="layout"
							value={ option.value }
							checked={ selected === option.value }
							onChange={ () => onChange( option.value ) }
						/>
						{ option.label }
					</label>
				);
			} ) }
		</fieldset>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'SearchResultsEdit', () => {
	it( 'does not show author names in the compact preview', () => {
		render(
			<SearchResultsEdit attributes={ { layout: 'compact' } } setAttributes={ jest.fn() } />
		);

		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Apr 1, 2026' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Ada Lovelace' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Grace Hopper' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Katherine Johnson' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the layout picker in the inspector', () => {
		render(
			<SearchResultsEdit attributes={ { layout: 'expanded' } } setAttributes={ jest.fn() } />
		);

		expect( screen.getByTestId( 'layout-picker' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Expanded' } ) ).toBeChecked();
		expect( screen.getByRole( 'radio', { name: 'Compact' } ) ).not.toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Product (for WooCommerce stores)' } )
		).not.toBeChecked();
	} );

	it( 'updates the layout attribute when the picker changes', () => {
		const setAttributes = jest.fn();
		render(
			<SearchResultsEdit attributes={ { layout: 'expanded' } } setAttributes={ setAttributes } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; sort-control-edit.test.jsx uses fireEvent for the same reason.
		fireEvent.click( screen.getByRole( 'radio', { name: 'Product (for WooCommerce stores)' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'product' } );
	} );

	it( 'renders product preview rows when layout=product', () => {
		render(
			<SearchResultsEdit attributes={ { layout: 'product' } } setAttributes={ jest.fn() } />
		);

		expect( screen.getByText( 'Sample product' ) ).toBeInTheDocument();
		expect( screen.getByText( '$24.00' ) ).toBeInTheDocument();
		expect( screen.getByText( '$30.00' ) ).toBeInTheDocument();
		expect( screen.getByText( '$19.99' ) ).toBeInTheDocument();
	} );
} );
