/**
 * Internal dependencies
 */
import { SelectField } from '../field-select';
import { FIELD_TYPES, resolveFieldTypes } from '../field-types';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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
	it( 'gives every field type a name upstream accepts', async () => {
		await jest.isolateModulesAsync( async () => {
			const { registerFieldType } = await import( '@wordpress/widget-primitives' );
			const { FIELD_TYPES: fieldTypes } = await import( '../field-types' );

			// A first registration returns the definition; an invalid name returns `undefined`.
			for ( const fieldType of fieldTypes ) {
				expect( registerFieldType( fieldType ) ).toBe( fieldType );
			}
		} );
	} );

	it( 'claims every name', async () => {
		await jest.isolateModulesAsync( async () => {
			const { registerFieldType } = await import( '@wordpress/widget-primitives' );
			const { FIELD_TYPES: fieldTypes, registerFieldTypes } = await import( '../field-types' );

			registerFieldTypes();

			// The names are valid (above), so `undefined` here means the name is taken.
			for ( const fieldType of fieldTypes ) {
				expect( registerFieldType( { ...fieldType } ) ).toBeUndefined();
			}
		} );
	} );

	it( 'gives every field type a base type DataViews knows', () => {
		expect( FIELD_TYPES.map( ( { name, baseType } ) => [ name, baseType ] ) ).toEqual( [
			[ 'jpa/select', 'text' ],
			[ 'jpa/toggle-group', 'text' ],
			[ 'jpa/array-checkbox', 'array' ],
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
