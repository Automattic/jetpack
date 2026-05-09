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

	it( 'default render: "Price" label, $0/$1000 endpoints, autoBounds toggle on, Min/Max disabled', () => {
		global.window.wcSettings = undefined;
		renderEdit();

		expect( screen.getByRole( 'heading', { level: 3 } ) ).toHaveTextContent( 'Price' );
		expect( screen.getByText( '$0' ) ).toBeInTheDocument();
		expect( screen.getByText( '$1000' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Auto-detect range from store' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Minimum' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Maximum' ) ).toBeDisabled();
	} );

	it( 'reads currency symbol + position from window.wcSettings (right_space → suffix)', () => {
		global.window.wcSettings = { currency: { symbol: '€', position: 'right_space' } };
		renderEdit( { min: 5, max: 25 } );

		expect( screen.getByText( '5€' ) ).toBeInTheDocument();
		expect( screen.getByText( '25€' ) ).toBeInTheDocument();
	} );

	it( 'shows the inverted-bounds Notice and enables Min/Max when autoBounds is off', () => {
		renderEdit( { autoBounds: false, min: 50, max: 10 } );

		expect( screen.getByTestId( 'notice' ) ).toHaveTextContent(
			'Minimum must be less than maximum'
		);
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
} );
