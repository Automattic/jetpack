/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import SelectField, { fromSelectValue, toSelectItems } from '../select-field';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';

const NUMERIC_ELEMENTS: Option[] = [
	{ value: 10, label: 'Ten' },
	{ value: 20, label: 'Twenty' },
];

const STRING_ELEMENTS: Option[] = [
	{ value: 'posts', label: 'Posts' },
	{ value: 'archives', label: 'Archives' },
];

describe( 'toSelectItems', () => {
	it( 'stringifies numeric option values for the select control', () => {
		expect( toSelectItems( NUMERIC_ELEMENTS ) ).toEqual( [
			{ value: '10', label: 'Ten' },
			{ value: '20', label: 'Twenty' },
		] );
	} );

	it( 'leaves string option values unchanged', () => {
		expect( toSelectItems( STRING_ELEMENTS ) ).toEqual( [
			{ value: 'posts', label: 'Posts' },
			{ value: 'archives', label: 'Archives' },
		] );
	} );
} );

describe( 'fromSelectValue', () => {
	it( 'restores the original numeric type on write', () => {
		const restored = fromSelectValue( NUMERIC_ELEMENTS, '20' );
		expect( restored ).toBe( 20 );
		expect( typeof restored ).toBe( 'number' );
	} );

	it( 'preserves string values', () => {
		expect( fromSelectValue( STRING_ELEMENTS, 'archives' ) ).toBe( 'archives' );
	} );

	it( 'falls back to the raw string when no element matches', () => {
		expect( fromSelectValue( NUMERIC_ELEMENTS, '99' ) ).toBe( '99' );
	} );

	it( 'round-trips every option through toSelectItems without coercion', () => {
		toSelectItems( NUMERIC_ELEMENTS ).forEach( ( item, index ) => {
			expect( fromSelectValue( NUMERIC_ELEMENTS, item.value ) ).toBe(
				NUMERIC_ELEMENTS[ index ].value
			);
		} );
	} );
} );

type SizeAttributes = { size?: number };

function sizeControl( {
	data = {},
	onChange = jest.fn(),
	disabled = false,
}: {
	data?: SizeAttributes;
	onChange?: jest.Mock;
	disabled?: boolean;
} = {} ) {
	const field = {
		id: 'size',
		label: 'Size',
		elements: NUMERIC_ELEMENTS,
		getValue: ( { item }: { item: SizeAttributes } ) => item.size,
		setValue: ( { value: next }: { value: unknown } ) => ( { size: next } ),
		isDisabled: () => disabled,
	} as unknown as DataFormControlProps< SizeAttributes >[ 'field' ];

	render( <SelectField data={ data } field={ field } onChange={ onChange } /> );

	return screen.getByRole( 'combobox', { name: 'Size' } );
}

describe( 'SelectField', () => {
	it( 'names the option matching the current value', () => {
		const control = sizeControl( { data: { size: 20 } } );

		expect( control ).toHaveTextContent( 'Twenty' );
	} );

	it( 'falls back to the first option when the value matches none', () => {
		const control = sizeControl( { data: {} } );

		expect( control ).toHaveTextContent( 'Ten' );
	} );

	// The select control trades in strings; the write path must restore the
	// element's original value, or a numeric attribute comes back as "20".
	it( 'writes the selected value with its original type', async () => {
		const onChange = jest.fn();
		const control = sizeControl( { data: { size: 10 }, onChange } );

		// `hidden: true` because in jsdom, with no layout to position the popup
		// against, the mounted options stay hidden even once opened. They also mount
		// a tick after the click, so a synchronous read passes alone but fails under
		// load — wait for them.
		await userEvent.click( control );
		await userEvent.click( await screen.findByRole( 'option', { name: 'Twenty', hidden: true } ) );

		expect( onChange ).toHaveBeenCalledWith( { size: 20 } );
	} );

	it( 'disables the control when the field says so', () => {
		const control = sizeControl( { disabled: true } );

		expect( control ).toBeDisabled();
	} );
} );
