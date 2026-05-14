import { fireEvent, render, screen } from '@testing-library/react';
import ResultsListEdit from '../../../src/search-blocks/blocks/results-list/edit';

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
	TextControl: ( { label, value, onChange, placeholder } ) => {
		const id = `text-${ String( label ).toLowerCase().replace( /\s+/g, '-' ) }`;
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="text"
					value={ value || '' }
					placeholder={ placeholder }
					onChange={ event => onChange( event.target.value ) }
				/>
			</>
		);
	},
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_n: ( single, plural, n ) => ( n === 1 ? single : plural ),
	sprintf: ( fmt, ...args ) => {
		let i = 0;
		return String( fmt ).replace( /%(?:\d+\$)?[ds]/g, () => String( args[ i++ ] ) );
	},
} ) );

describe( 'ResultsListEdit', () => {
	// Default the editor's localized WC flag to true so the existing
	// product-layout tests keep exercising the full picker. The non-Woo
	// path (Product option absent, saved `product` collapses to `expanded`)
	// is covered in its own `describe` block below.
	beforeEach( () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceBlocksEnabled: true };
	} );
	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
	} );

	it( 'does not show author names in the compact preview', () => {
		render( <ResultsListEdit attributes={ { layout: 'compact' } } setAttributes={ jest.fn() } /> );

		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Apr 1, 2026' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Ada Lovelace' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Grace Hopper' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Katherine Johnson' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the layout picker in the inspector', () => {
		render( <ResultsListEdit attributes={ { layout: 'expanded' } } setAttributes={ jest.fn() } /> );

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
			<ResultsListEdit attributes={ { layout: 'expanded' } } setAttributes={ setAttributes } />
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; results-sort-edit.test.jsx uses fireEvent for the same reason.
		fireEvent.click( screen.getByRole( 'radio', { name: 'Product (for WooCommerce stores)' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( { layout: 'product' } );
	} );

	it( 'renders product preview rows when layout=product', () => {
		render( <ResultsListEdit attributes={ { layout: 'product' } } setAttributes={ jest.fn() } /> );

		expect( screen.getByText( 'Sample product' ) ).toBeInTheDocument();
		expect( screen.getByText( '$24.00' ) ).toBeInTheDocument();
		expect( screen.getByText( '$30.00' ) ).toBeInTheDocument();
		expect( screen.getByText( '$19.99' ) ).toBeInTheDocument();
	} );

	it( 'exposes message controls for the empty and error states in the inspector', () => {
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox', { name: 'No-results message' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'textbox', { name: 'Error message' } ) ).toBeInTheDocument();
	} );

	it( 'updates the noResultsMessage attribute when the no-results control changes', () => {
		const setAttributes = jest.fn();
		render( <ResultsListEdit attributes={ {} } setAttributes={ setAttributes } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; results-sort-edit.test.jsx uses fireEvent for the same reason.
		fireEvent.change( screen.getByRole( 'textbox', { name: 'No-results message' } ), {
			target: { value: 'Try a broader query.' },
		} );
		expect( setAttributes ).toHaveBeenCalledWith( { noResultsMessage: 'Try a broader query.' } );
	} );

	it( 'updates the errorMessage attribute when the error control changes', () => {
		const setAttributes = jest.fn();
		render( <ResultsListEdit attributes={ {} } setAttributes={ setAttributes } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; results-sort-edit.test.jsx uses fireEvent for the same reason.
		fireEvent.change( screen.getByRole( 'textbox', { name: 'Error message' } ), {
			target: { value: 'Search is offline right now.' },
		} );
		expect( setAttributes ).toHaveBeenCalledWith( {
			errorMessage: 'Search is offline right now.',
		} );
	} );

	it( 'keeps the empty and error copy out of the editor canvas', () => {
		render(
			<ResultsListEdit
				attributes={ {
					layout: 'expanded',
					noResultsMessage: 'Try a broader query.',
					errorMessage: 'Search is offline right now.',
				} }
				setAttributes={ jest.fn() }
			/>
		);

		// The success-state preview is the only thing rendered on the canvas;
		// the empty and error copy live in the Inspector controls only.
		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Try a broader query.' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Search is offline right now.' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ResultsListEdit on non-WooCommerce sites (RSM-2805)', () => {
	beforeEach( () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceBlocksEnabled: false };
	} );
	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
	} );

	it( 'omits the Product layout option from the picker', () => {
		render( <ResultsListEdit attributes={ { layout: 'expanded' } } setAttributes={ jest.fn() } /> );

		// Compact and Expanded remain; Product is hidden so authors can't
		// pick a layout that reads WC-shaped fields the index doesn't have.
		expect( screen.getByRole( 'radio', { name: 'Compact' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Expanded' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Product (for WooCommerce stores)' } )
		).not.toBeInTheDocument();
	} );

	it( 'collapses a saved product layout to expanded so the editor matches the renderer', () => {
		// Authors who saved `product` on a Woo site that later deactivates
		// WC should see the neutral expanded preview, not a broken product
		// card. The PHP `render.php` applies the same fallback.
		render( <ResultsListEdit attributes={ { layout: 'product' } } setAttributes={ jest.fn() } /> );

		expect( screen.getByRole( 'radio', { name: 'Expanded' } ) ).toBeChecked();
		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		// Product-only sample data must not bleed into the canvas.
		expect( screen.queryByText( 'Sample product' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '$24.00' ) ).not.toBeInTheDocument();
	} );
} );
