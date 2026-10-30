/**
 * Internal dependencies
 */
import { registerFieldType } from '@wordpress/widget-primitives';
import { SelectField } from '../field-select';
import { FIELD_TYPES, registerFieldTypes, resolveFieldTypes } from '../field-types';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

jest.mock( '@wordpress/widget-primitives', () => {
	const actual = jest.requireActual( '@wordpress/widget-primitives' );
	return { ...actual, registerFieldType: jest.fn( actual.registerFieldType ) };
} );

type Attributes = { contentView?: 'posts' | 'archives' };

const contentView: WidgetAttributeField< Attributes > = {
	id: 'contentView',
	label: 'View',
	type: 'jpa/select',
	elements: [
		{ label: 'Posts', value: 'posts' },
		{ label: 'Archives', value: 'archives' },
	],
	relevance: 'high',
};

describe( 'registerFieldTypes', () => {
	it( 'gives every field type a name upstream accepts', () => {
		// A first registration returns the definition; an invalid name returns `undefined`.
		for ( const fieldType of FIELD_TYPES ) {
			expect( registerFieldType( fieldType ) ).toBe( fieldType );
		}
	} );

	it( 'registers every field type upstream', () => {
		jest.mocked( registerFieldType ).mockClear();
		registerFieldTypes();

		expect(
			jest.mocked( registerFieldType ).mock.calls.map( ( [ fieldType ] ) => fieldType )
		).toEqual( FIELD_TYPES );
	} );

	it( 'gives every field type a base type DataViews knows', () => {
		expect( FIELD_TYPES.map( ( { name, baseType } ) => [ name, baseType ] ) ).toEqual( [
			[ 'jpa/select', 'text' ],
			[ 'jpa/toggle-group', 'text' ],
			[ 'jpa/array-checkbox', 'array' ],
			[ 'jpa/report-params', 'text' ],
		] );
	} );
} );

describe( 'resolveFieldTypes', () => {
	it( 'replaces a registered name with its control and base type, keeping the attribute props', () => {
		expect( resolveFieldTypes( [ contentView ] ) ).toEqual( [
			{
				id: 'contentView',
				label: 'View',
				type: 'text',
				Edit: SelectField,
				elements: contentView.elements,
				relevance: 'high',
			},
		] );
	} );

	it( 'lets the attribute win over the definition', () => {
		const Edit = () => null;
		const [ resolved ] = resolveFieldTypes( [ { ...contentView, Edit } ] );

		expect( resolved.Edit ).toBe( Edit );
	} );

	it( 'passes an unregistered type through untouched', () => {
		const attribute: WidgetAttributeField< Attributes > = { ...contentView, type: 'text' };

		expect( resolveFieldTypes( [ attribute ] ) ).toEqual( [ attribute ] );
	} );
} );
