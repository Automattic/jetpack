import { fireEvent, render, screen } from '@testing-library/react';
import ResultsListEdit from '../../../src/search-blocks/blocks/results-list/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick } ) => (
		<button type="button" onClick={ onClick }>
			{ children }
		</button>
	),
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
	ToggleControl: ( { label, checked, onChange } ) => {
		const id = `toggle-${ String( label ).toLowerCase().replace( /\s+/g, '-' ) }`;
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="checkbox"
					checked={ !! checked }
					onChange={ event => onChange( event.target.checked ) }
				/>
			</>
		);
	},
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

// `@wordpress/data` powers the parent-block lookup for the "Search scope"
// hint panel. Tests override `__mockSearchResultsParent` (a captured client
// id) and `__mockSearchResultsAttrs` to drive the useSelect call.
let mockSearchResultsParent = null;
let mockSearchResultsAttrs = null;
const mockSelectBlock = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useSelect: callback =>
		callback( () => ( {
			getBlockParentsByBlockName: () =>
				mockSearchResultsParent ? [ mockSearchResultsParent ] : [],
			getBlockAttributes: () => mockSearchResultsAttrs,
		} ) ),
	useDispatch: () => ( { selectBlock: mockSelectBlock } ),
} ) );

describe( 'ResultsListEdit', () => {
	// Default the editor's localized WC flag to true so the existing
	// product-layout tests keep exercising the full picker. The non-Woo
	// path (Product option absent, saved `product` collapses to `expanded`)
	// is covered in its own `describe` block below.
	beforeEach( () => {
		globalThis.JetpackSearchBlocksConfig = { isWooCommerceBlocksEnabled: true };
		mockSearchResultsParent = null;
		mockSearchResultsAttrs = null;
		mockSelectBlock.mockClear();
	} );
	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
	} );

	it( 'does not show author names in the compact preview', () => {
		render( <ResultsListEdit attributes={ { layout: 'compact' } } setAttributes={ jest.fn() } /> );

		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Apr 1, 2026' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Sample Author' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'A. Writer, B. Editor' ) ).not.toBeInTheDocument();
	} );

	// SAMPLE_RESULTS has three rows: the first two carry hasImage:true, the
	// third demonstrates the runtime collapse when imageUrl is empty. We count
	// `__image-link` elements directly because the element is aria-hidden by
	// design (it's a decorative click-target for sighted users); there's no
	// role or accessible name to query against via Testing Library.
	/* eslint-disable testing-library/no-container, testing-library/no-node-access -- see comment above. */
	it( 'renders the image-link column only for sample rows that have an image in the expanded preview', () => {
		const { container } = render(
			<ResultsListEdit attributes={ { layout: 'expanded' } } setAttributes={ jest.fn() } />
		);

		expect( container.querySelectorAll( '.jetpack-search-results__image-link' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Older archived entry' ) ).toBeInTheDocument();
	} );
	/* eslint-enable testing-library/no-container, testing-library/no-node-access */

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

	it( 'exposes message controls for the empty, filtered-empty, and error states in the inspector', () => {
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox', { name: 'No-results message' } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'No-results message (when filters are active)' } )
		).toBeInTheDocument();
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

	it( 'updates the noResultsWithFiltersMessage attribute when the filtered-empty control changes', () => {
		const setAttributes = jest.fn();
		render( <ResultsListEdit attributes={ {} } setAttributes={ setAttributes } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package; results-sort-edit.test.jsx uses fireEvent for the same reason.
		fireEvent.change(
			screen.getByRole( 'textbox', { name: 'No-results message (when filters are active)' } ),
			{ target: { value: 'Try removing a filter.' } }
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			noResultsWithFiltersMessage: 'Try removing a filter.',
		} );
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

	it( 'omits the Search-scope hint panel when no search-results parent is found', () => {
		// Results List dropped outside a Search Results wrapper (e.g. directly
		// on a page) has no parent to navigate to — surfacing the panel anyway
		// would just confuse the author with a dead-end "Edit on Search Results"
		// button. Keeps the inspector minimal in the unscoped case.
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		expect( screen.queryByRole( 'region', { name: 'Search scope' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders a Search-scope hint panel when nested inside a search-results parent', () => {
		mockSearchResultsParent = 'sr-1';
		mockSearchResultsAttrs = { postTypeMode: 'include', postTypes: [ 'product' ] };
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		expect( screen.getByRole( 'region', { name: 'Search scope' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Include only: product' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Edit on Search Results' } ) ).toBeInTheDocument();
	} );

	it( 'summarises the parent scope as "All post types" when the list is empty', () => {
		mockSearchResultsParent = 'sr-1';
		mockSearchResultsAttrs = { postTypeMode: 'exclude', postTypes: [] };
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		expect( screen.getByText( 'All post types' ) ).toBeInTheDocument();
	} );

	it( 'summarises exclude-mode scope distinctly from include-mode', () => {
		mockSearchResultsParent = 'sr-1';
		mockSearchResultsAttrs = { postTypeMode: 'exclude', postTypes: [ 'page', 'attachment' ] };
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		expect( screen.getByText( 'Exclude: page, attachment' ) ).toBeInTheDocument();
		expect( screen.queryByText( /^Include only:/ ) ).not.toBeInTheDocument();
	} );

	it( 'collapses to "All post types" when the parent has a non-empty postTypes but no recognised mode', () => {
		// Defensive: a saved-attribute mismatch (older schema, hand-edited
		// markup) shouldn't surface as either "Include only:" or "Exclude:" —
		// both would read as the wrong scope. The summary collapses to the
		// unscoped variant so the hint matches what the renderer actually does
		// (build_constraint defaults to exclude-mode with an empty list).
		mockSearchResultsParent = 'sr-1';
		mockSearchResultsAttrs = { postTypeMode: 'something-else', postTypes: [ 'product' ] };
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		expect( screen.getByText( 'All post types' ) ).toBeInTheDocument();
		expect( screen.queryByText( /^Include only:/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /^Exclude:/ ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to the parent search-results block when the hint button is clicked', () => {
		mockSearchResultsParent = 'sr-1';
		mockSearchResultsAttrs = { postTypeMode: 'include', postTypes: [ 'product' ] };
		render( <ResultsListEdit attributes={ {} } setAttributes={ jest.fn() } clientId="rl-1" /> );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event isn't a dep of the search package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Edit on Search Results' } ) );
		expect( mockSelectBlock ).toHaveBeenCalledWith( 'sr-1' );
	} );

	it( 'keeps the empty and error copy out of the editor canvas', () => {
		render(
			<ResultsListEdit
				attributes={ {
					layout: 'expanded',
					noResultsMessage: 'Try a broader query.',
					noResultsWithFiltersMessage: 'Clear a filter to see results.',
					errorMessage: 'Search is offline right now.',
				} }
				setAttributes={ jest.fn() }
			/>
		);

		// The success-state preview is the only thing rendered on the canvas;
		// the empty and error copy live in the Inspector controls only.
		expect( screen.getByText( 'First sample result' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Try a broader query.' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Clear a filter to see results.' ) ).not.toBeInTheDocument();
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
