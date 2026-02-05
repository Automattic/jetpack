/**
 * Tests for the Jetpack Forms field registration API.
 */

// Mock WordPress dependencies
jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn( ( name, config ) => ( { name, ...config } ) ),
} ) );

jest.mock( '../../../src/api/validation', () => ( {
	registerFieldValidator: jest.fn(),
} ) );

jest.mock( '../../../src/api/components', () => ( {
	defaultSettings: {
		apiVersion: 3,
		category: 'contact-form',
		supports: {
			reusable: false,
			html: false,
		},
		save: () => null,
	},
} ) );

import { registerBlockType } from '@wordpress/blocks';
import { registerJetpackFormField, getRegisteredFields } from '../../../src/api/register-field';
import { registerFieldValidator } from '../../../src/api/validation';

describe( 'registerJetpackFormField', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'registers a block with the correct name', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-color',
			title: 'Color Picker',
			icon: 'color-picker',
			edit: MockEdit,
		} );

		expect( registerBlockType ).toHaveBeenCalledWith(
			'jetpack/field-color',
			expect.objectContaining( {
				title: 'Color Picker',
				icon: 'color-picker',
				edit: MockEdit,
			} )
		);
	} );

	test( 'handles names that already include jetpack/ prefix', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'jetpack/field-custom',
			title: 'Custom Field',
			edit: MockEdit,
		} );

		expect( registerBlockType ).toHaveBeenCalledWith( 'jetpack/field-custom', expect.anything() );
	} );

	test( 'merges default attributes with custom attributes', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-test',
			title: 'Test Field',
			edit: MockEdit,
			attributes: {
				customAttr: {
					type: 'string',
					default: 'custom value',
				},
			},
		} );

		expect( registerBlockType ).toHaveBeenCalledWith(
			'jetpack/field-test',
			expect.objectContaining( {
				attributes: expect.objectContaining( {
					// Default attributes
					label: expect.anything(),
					required: expect.anything(),
					width: expect.anything(),
					// Custom attribute
					customAttr: {
						type: 'string',
						default: 'custom value',
					},
				} ),
			} )
		);
	} );

	test( 'sets parent to contact-form', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-test',
			title: 'Test Field',
			edit: MockEdit,
		} );

		expect( registerBlockType ).toHaveBeenCalledWith(
			'jetpack/field-test',
			expect.objectContaining( {
				parent: [ 'jetpack/contact-form' ],
			} )
		);
	} );

	test( 'registers frontend validation when provided', () => {
		const MockEdit = () => null;
		const mockValidator = jest.fn();

		registerJetpackFormField( {
			name: 'field-validated',
			title: 'Validated Field',
			edit: MockEdit,
			validation: {
				frontend: mockValidator,
			},
		} );

		expect( registerFieldValidator ).toHaveBeenCalledWith( 'validated', mockValidator );
	} );

	test( 'uses phpType when specified for validation', () => {
		const MockEdit = () => null;
		const mockValidator = jest.fn();

		registerJetpackFormField( {
			name: 'field-color',
			title: 'Color Picker',
			edit: MockEdit,
			phpType: 'custom-color',
			validation: {
				frontend: mockValidator,
			},
		} );

		expect( registerFieldValidator ).toHaveBeenCalledWith( 'custom-color', mockValidator );
	} );

	test( 'does not register validation when not provided', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-no-validation',
			title: 'No Validation Field',
			edit: MockEdit,
		} );

		expect( registerFieldValidator ).not.toHaveBeenCalled();
	} );

	test( 'returns undefined and logs error when required props are missing', () => {
		const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation();

		const result = registerJetpackFormField( {
			name: 'field-incomplete',
			// Missing title and edit
		} );

		expect( result ).toBeUndefined();
		expect( consoleSpy ).toHaveBeenCalled();

		consoleSpy.mockRestore();
	} );

	test( 'tracks registered fields', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-tracked',
			title: 'Tracked Field',
			edit: MockEdit,
		} );

		const registeredFields = getRegisteredFields();
		const trackedField = registeredFields.find( f => f.name === 'field-tracked' );

		expect( trackedField ).toBeDefined();
		expect( trackedField.blockName ).toBe( 'jetpack/field-tracked' );
		expect( trackedField.fieldType ).toBe( 'tracked' );
	} );

	test( 'getRegisteredFields returns a copy of the registry', () => {
		const fields1 = getRegisteredFields();
		const fields2 = getRegisteredFields();

		expect( fields1 ).toEqual( fields2 );
		expect( fields1 ).not.toBe( fields2 );
	} );

	test( 'sets inserter to false when isPrivate is true', () => {
		const MockEdit = () => null;

		registerJetpackFormField( {
			name: 'field-private',
			title: 'Private Field',
			edit: MockEdit,
			isPrivate: true,
		} );

		expect( registerBlockType ).toHaveBeenCalledWith(
			'jetpack/field-private',
			expect.objectContaining( {
				supports: expect.objectContaining( {
					inserter: false,
				} ),
			} )
		);
	} );
} );
