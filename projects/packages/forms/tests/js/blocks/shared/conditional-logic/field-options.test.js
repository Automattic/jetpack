import { getFieldOptions } from '../../../../../src/blocks/shared/conditional-logic/util/field-options';

const option = label => ( { name: 'jetpack/option', attributes: { label }, innerBlocks: [] } );
const imageOption = label => ( {
	name: 'jetpack/input-image-option',
	attributes: { label },
	innerBlocks: [],
} );

describe( 'getFieldOptions', () => {
	it( 'reads the options string array from field-select', () => {
		const block = {
			name: 'jetpack/field-select',
			attributes: { options: [ 'Small', 'Medium', 'Large' ] },
			innerBlocks: [],
		};
		expect( getFieldOptions( block ) ).toEqual( [
			{ value: 'Small', label: 'Small' },
			{ value: 'Medium', label: 'Medium' },
			{ value: 'Large', label: 'Large' },
		] );
	} );

	// field-single-choice templates [ 'jetpack/options', { type: 'radio' } ], so the
	// option blocks sit one level below the field, not as direct children.
	it( 'reads option blocks nested under a jetpack/options wrapper', () => {
		const block = {
			name: 'jetpack/field-single-choice',
			attributes: {},
			innerBlocks: [
				{ name: 'jetpack/label', attributes: { label: 'Pick one' }, innerBlocks: [] },
				{
					name: 'jetpack/options',
					attributes: { type: 'radio' },
					innerBlocks: [ option( 'Yes' ), option( 'No' ) ],
				},
			],
		};
		expect( getFieldOptions( block ) ).toEqual( [
			{ value: 'Yes', label: 'Yes' },
			{ value: 'No', label: 'No' },
		] );
	} );

	it( 'reads option blocks that are direct children', () => {
		const block = {
			name: 'jetpack/field-multiple-choice',
			attributes: {},
			innerBlocks: [ option( 'A' ), option( 'B' ) ],
		};
		expect( getFieldOptions( block ) ).toEqual( [
			{ value: 'A', label: 'A' },
			{ value: 'B', label: 'B' },
		] );
	} );

	it( 'reads image options from a fieldset-image-options wrapper', () => {
		const block = {
			name: 'jetpack/field-image-select',
			attributes: {},
			innerBlocks: [
				{
					name: 'jetpack/fieldset-image-options',
					attributes: {},
					innerBlocks: [ imageOption( 'Cat' ), imageOption( 'Dog' ) ],
				},
			],
		};
		expect( getFieldOptions( block ) ).toEqual( [
			{ value: 'Cat', label: 'Cat' },
			{ value: 'Dog', label: 'Dog' },
		] );
	} );

	it( 'trims labels, skips blanks and de-duplicates', () => {
		const block = {
			name: 'jetpack/field-single-choice',
			attributes: {},
			innerBlocks: [
				{
					name: 'jetpack/options',
					attributes: {},
					innerBlocks: [ option( '  Yes  ' ), option( '' ), option( 'Yes' ), option( '   ' ) ],
				},
			],
		};
		expect( getFieldOptions( block ) ).toEqual( [ { value: 'Yes', label: 'Yes' } ] );
	} );

	it( 'ignores the label block so a field label never becomes an option', () => {
		const block = {
			name: 'jetpack/field-single-choice',
			attributes: {},
			innerBlocks: [
				{ name: 'jetpack/label', attributes: { label: 'Not an option' }, innerBlocks: [] },
				{ name: 'jetpack/options', attributes: {}, innerBlocks: [ option( 'Real' ) ] },
			],
		};
		expect( getFieldOptions( block ) ).toEqual( [ { value: 'Real', label: 'Real' } ] );
	} );

	it( 'returns an empty array for fields with no options', () => {
		expect(
			getFieldOptions( { name: 'jetpack/field-text', attributes: {}, innerBlocks: [] } )
		).toEqual( [] );
		expect( getFieldOptions( null ) ).toEqual( [] );
		expect( getFieldOptions( undefined ) ).toEqual( [] );
	} );

	it( 'tolerates a field-select with a malformed options attribute', () => {
		expect(
			getFieldOptions( {
				name: 'jetpack/field-select',
				attributes: { options: 'nope' },
				innerBlocks: [],
			} )
		).toEqual( [] );
		expect(
			getFieldOptions( {
				name: 'jetpack/field-select',
				attributes: { options: [ '', null, 'Only' ] },
				innerBlocks: [],
			} )
		).toEqual( [ { value: 'Only', label: 'Only' } ] );
	} );
} );
