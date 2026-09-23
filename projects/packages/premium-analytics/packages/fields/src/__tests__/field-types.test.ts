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
	it( 'registers every field type under a name upstream accepts', async () => {
		await jest.isolateModulesAsync( async () => {
			const { registerFieldType } = await import( '@wordpress/widget-primitives' );
			const { FIELD_TYPES: fieldTypes, registerFieldTypes } = await import( '../field-types' );

			registerFieldTypes();

			// Upstream returns `undefined` for a taken name: each one was accepted the first time.
			for ( const fieldType of fieldTypes ) {
				expect( registerFieldType( fieldType ) ).toBeUndefined();
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

	it( 'lets the attribute win over the definition and merges validation rules', () => {
		const Edit = () => null;
		const [ resolved ] = resolveFieldTypes( [
			{ ...contentView, Edit, isValid: { required: true } },
		] );

		expect( resolved.Edit ).toBe( Edit );
		expect( resolved.isValid ).toEqual( { required: true } );
	} );

	it( 'passes an unregistered type through untouched', () => {
		const attribute: WidgetAttributeField< Attributes > = { ...contentView, type: 'text' };

		expect( resolveFieldTypes( [ attribute ] ) ).toEqual( [ attribute ] );
	} );
} );
