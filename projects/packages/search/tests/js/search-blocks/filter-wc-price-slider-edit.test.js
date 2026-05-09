// Renders the filter-wc-price-slider editor component and asserts on the
// visible markup + inspector controls. Mirrors how filter-checkbox-edit.test.js
// pins behavior: a thin shim around `@wordpress/components` so we can drive
// each field with plain DOM events without standing up the full Gutenberg
// runtime.
//
// `fireEvent.change` over `userEvent.type` is deliberate — the controls are
// thin mocks, the package doesn't depend on `@testing-library/user-event`, and
// `change` matches how `TextControl`/`SelectControl`/`ToggleControl` actually
// fire `onChange` in production (one event per committed value, not per
// keystroke). The lint warning is suppressed for the same reason.
/* eslint-disable testing-library/prefer-user-event */

import { fireEvent, render, screen } from '@testing-library/react';
import FilterWcPriceSliderEdit from '../../../src/search-blocks/blocks/filter-wc-price-slider/edit.js';

jest.mock( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( {
		className: props?.className || '',
		'data-testid': 'block-wrapper',
	} ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Notice: ( { children, status } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
		</div>
	),
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" data-title={ title }>
			{ children }
		</section>
	),
	SelectControl: ( { label, value, onChange, options } ) => (
		<select aria-label={ label } value={ value } onChange={ e => onChange( e.target.value ) }>
			{ options.map( opt => (
				<option key={ opt.value } value={ opt.value }>
					{ opt.label }
				</option>
			) ) }
		</select>
	),
	TextControl: ( { label, value, onChange, type, disabled, placeholder, help } ) => (
		<>
			<input
				aria-label={ label }
				type={ type || 'text' }
				value={ value }
				disabled={ !! disabled }
				placeholder={ placeholder || '' }
				onChange={ e => onChange( e.target.value ) }
			/>
			{ help && <span data-testid="help">{ help }</span> }
		</>
	),
	ToggleControl: ( { label, checked, onChange, help } ) => (
		<>
			<input
				type="checkbox"
				aria-label={ label }
				checked={ !! checked }
				onChange={ e => onChange( e.target.checked ) }
			/>
			{ help && <span data-testid="help">{ help }</span> }
		</>
	),
} ) );

/**
 * Render the editor component with a fresh `setAttributes` spy.
 *
 * @param {object}   [attributes]    - Block attributes to seed.
 * @param {Function} [setAttributes] - Spy override; defaults to a fresh `jest.fn()`.
 * @return {object} Testing-library render result with `setAttributes` attached.
 */
function renderEdit( attributes = {}, setAttributes = jest.fn() ) {
	return {
		setAttributes,
		...render(
			<FilterWcPriceSliderEdit attributes={ attributes } setAttributes={ setAttributes } />
		),
	};
}

describe( 'FilterWcPriceSliderEdit', () => {
	const originalWcSettings = global.window.wcSettings;

	afterEach( () => {
		global.window.wcSettings = originalWcSettings;
	} );

	it( 'renders the default "Price" label, $0 / $1000 endpoints, and the auto-bounds toggle on by default', () => {
		renderEdit();

		// Default label shows in the preview header.
		expect( screen.getByRole( 'heading', { level: 3 } ) ).toHaveTextContent( 'Price' );

		// Currency-formatted endpoint labels.
		expect( screen.getByText( '$0' ) ).toBeInTheDocument();
		expect( screen.getByText( '$1000' ) ).toBeInTheDocument();

		// Auto-bounds toggle is checked.
		const toggle = screen.getByLabelText( 'Auto-detect range from store' );
		expect( toggle ).toBeChecked();
	} );

	it( 'shows the author-supplied label when set', () => {
		renderEdit( { label: 'Filter by price' } );
		expect( screen.getByRole( 'heading', { level: 3 } ) ).toHaveTextContent( 'Filter by price' );
	} );

	it( 'reads currency symbol + position from window.wcSettings when no author override is set', () => {
		global.window.wcSettings = { currency: { symbol: '€', position: 'right_space' } };
		renderEdit( { min: 5, max: 25 } );

		// `right_space` resolves to `right` so the symbol lands after the value.
		expect( screen.getByText( '5€' ) ).toBeInTheDocument();
		expect( screen.getByText( '25€' ) ).toBeInTheDocument();
	} );

	it( 'author currencySymbol overrides the WC default and is trimmed to two chars', () => {
		global.window.wcSettings = { currency: { symbol: '€', position: 'left' } };
		renderEdit( { currencySymbol: 'KRX', min: 0, max: 100 } );

		// `KRX` is trimmed to `KR` (max two chars), then prefixed (default position).
		expect( screen.getByText( 'KR0' ) ).toBeInTheDocument();
		expect( screen.getByText( 'KR100' ) ).toBeInTheDocument();
	} );

	it( 'author currencySymbolPosition overrides the WC default', () => {
		global.window.wcSettings = { currency: { symbol: '$', position: 'left' } };
		renderEdit( { currencySymbolPosition: 'right', min: 1, max: 2 } );

		expect( screen.getByText( '1$' ) ).toBeInTheDocument();
		expect( screen.getByText( '2$' ) ).toBeInTheDocument();
	} );

	it( 'falls back to $ + left when wcSettings is missing entirely', () => {
		global.window.wcSettings = undefined;
		renderEdit( { min: 7, max: 9 } );
		expect( screen.getByText( '$7' ) ).toBeInTheDocument();
		expect( screen.getByText( '$9' ) ).toBeInTheDocument();
	} );

	it( 'shows the inverted-bounds warning Notice only when autoBounds=false and min >= max', () => {
		const { rerender } = render(
			<FilterWcPriceSliderEdit
				attributes={ { autoBounds: false, min: 50, max: 10 } }
				setAttributes={ jest.fn() }
			/>
		);
		expect( screen.getByTestId( 'notice' ) ).toHaveTextContent(
			'Minimum must be less than maximum'
		);
		expect( screen.getByTestId( 'notice' ) ).toHaveAttribute( 'data-status', 'warning' );

		// autoBounds=true suppresses the warning even when the stored min/max
		// are inverted (the server-side derivation is what matters then).
		rerender(
			<FilterWcPriceSliderEdit
				attributes={ { autoBounds: true, min: 50, max: 10 } }
				setAttributes={ jest.fn() }
			/>
		);
		expect( screen.queryByTestId( 'notice' ) ).not.toBeInTheDocument();
	} );

	it( 'disables the Minimum / Maximum number inputs while autoBounds is enabled', () => {
		renderEdit( { autoBounds: true } );
		expect( screen.getByLabelText( 'Minimum' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Maximum' ) ).toBeDisabled();
		// Step is always editable — granularity is author-controlled regardless
		// of auto-bounds.
		expect( screen.getByLabelText( 'Step' ) ).toBeEnabled();
	} );

	it( 'enables the Minimum / Maximum number inputs when autoBounds is off', () => {
		renderEdit( { autoBounds: false, min: 0, max: 100 } );
		expect( screen.getByLabelText( 'Minimum' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Maximum' ) ).toBeEnabled();
	} );

	it( 'wires every inspector control through setAttributes', () => {
		const { setAttributes } = renderEdit( { autoBounds: false, min: 0, max: 100 } );

		fireEvent.change( screen.getByLabelText( 'Label' ), { target: { value: 'Price range' } } );
		fireEvent.change( screen.getByLabelText( 'Currency symbol' ), { target: { value: '£' } } );
		fireEvent.change( screen.getByLabelText( 'Symbol position' ), { target: { value: 'right' } } );
		fireEvent.click( screen.getByLabelText( 'Auto-detect range from store' ) );
		fireEvent.change( screen.getByLabelText( 'Minimum' ), { target: { value: '10' } } );
		fireEvent.change( screen.getByLabelText( 'Maximum' ), { target: { value: '500' } } );
		fireEvent.change( screen.getByLabelText( 'Step' ), { target: { value: '5' } } );

		expect( setAttributes ).toHaveBeenCalledWith( { label: 'Price range' } );
		expect( setAttributes ).toHaveBeenCalledWith( { currencySymbol: '£' } );
		expect( setAttributes ).toHaveBeenCalledWith( { currencySymbolPosition: 'right' } );
		expect( setAttributes ).toHaveBeenCalledWith( { autoBounds: true } );
		expect( setAttributes ).toHaveBeenCalledWith( { min: 10 } );
		expect( setAttributes ).toHaveBeenCalledWith( { max: 500 } );
		expect( setAttributes ).toHaveBeenCalledWith( { step: 5 } );
	} );

	it( 'coerces empty / non-numeric Step to 1 so the slider stays usable after a typo', () => {
		const { setAttributes } = renderEdit();
		fireEvent.change( screen.getByLabelText( 'Step' ), { target: { value: '' } } );
		expect( setAttributes ).toHaveBeenCalledWith( { step: 1 } );
	} );

	it( 'coerces empty / non-numeric Min / Max to 0 so the inputs never write NaN', () => {
		const { setAttributes } = renderEdit( { autoBounds: false } );
		fireEvent.change( screen.getByLabelText( 'Minimum' ), { target: { value: '' } } );
		fireEvent.change( screen.getByLabelText( 'Maximum' ), { target: { value: '' } } );
		expect( setAttributes ).toHaveBeenCalledWith( { min: 0 } );
		expect( setAttributes ).toHaveBeenCalledWith( { max: 0 } );
	} );

	it( 'falls back to defaults when min / max / step are non-finite (legacy save with NaN attrs)', () => {
		renderEdit( { min: NaN, max: NaN, step: NaN } );
		// Defaults: 0, 1000, step rendered as 1.
		expect( screen.getByText( '$0' ) ).toBeInTheDocument();
		expect( screen.getByText( '$1000' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Step' ) ).toHaveValue( 1 );
	} );
} );
