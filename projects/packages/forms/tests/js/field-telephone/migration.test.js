import { describe, expect, jest, test } from '@jest/globals';

// Mock createBlock to avoid WordPress block registration issues in tests
await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( blockName, attributes ) => ( {
		name: blockName,
		attributes: attributes || {},
	} ) ),
} ) );

// Mock useInnerBlocksProps to avoid WordPress private APIs issues in tests
await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	useInnerBlocksProps: {
		save: jest.fn( () => ( {} ) ),
	},
} ) );

// Import deprecated blocks directly to avoid loading the full edit component
const deprecatedModule = await import( '../../../src/blocks/field-telephone/deprecated.js' );
const deprecated = deprecatedModule.default;

describe( 'Field Telephone Block Migration', () => {
	test( 'successfully migrates old block structure', () => {
		expect( deprecated ).toHaveLength( 2 );
		const deprecatedBlock = deprecated[ 0 ];

		// Test migration with typical old block attributes (without showCountrySelector)
		const oldAttributes = {
			label: 'Phone Number',
			required: true,
			placeholder: '+1 (555) 123-4567',
			width: 75,
		};

		const [ migratedAttributes, newInnerBlocks ] = deprecatedBlock.migrate( oldAttributes, [] );

		// Should preserve all old attributes but set showCountrySelector to false
		expect( migratedAttributes ).toEqual( {
			...oldAttributes,
			showCountrySelector: false,
		} );

		// Should create proper inner block structure
		expect( newInnerBlocks ).toHaveLength( 2 );
		expect( newInnerBlocks[ 0 ].name ).toBe( 'jetpack/label' );
		expect( newInnerBlocks[ 1 ].name ).toBe( 'jetpack/phone-input' );
	} );

	test( 'is eligible for blocks without showCountrySelector attribute', () => {
		const deprecatedBlock = deprecated[ 0 ];
		const attributesWithoutShowCountrySelector = {
			label: 'Phone',
			required: false,
			placeholder: 'Enter phone number',
		};

		expect( deprecatedBlock.isEligible( attributesWithoutShowCountrySelector, [] ) ).toBe( true );
	} );

	test( 'is not eligible for blocks with showCountrySelector attribute', () => {
		const deprecatedBlock = deprecated[ 0 ];

		const attributesWithShowCountrySelector = {
			label: 'Phone',
			required: false,
			showCountrySelector: true,
		};
		expect( deprecatedBlock.isEligible( attributesWithShowCountrySelector, [] ) ).toBe( false );

		const attributesWithShowCountrySelectorFalse = {
			label: 'Phone',
			required: false,
			showCountrySelector: false,
		};
		expect( deprecatedBlock.isEligible( attributesWithShowCountrySelectorFalse, [] ) ).toBe(
			false
		);
	} );

	test( 'migration preserves styling attributes and sets showCountrySelector to false', () => {
		const deprecatedBlock = deprecated[ 0 ];
		const attributesWithStyling = {
			label: 'Contact Phone',
			required: false,
			width: 50,
			borderRadius: 8,
			borderWidth: 2,
			inputColor: '#333333',
			labelColor: '#666666',
			fieldBackgroundColor: '#ffffff',
		};

		const [ migratedAttributes ] = deprecatedBlock.migrate( attributesWithStyling, [] );

		// All styling should be preserved
		expect( migratedAttributes.width ).toBe( 50 );
		expect( migratedAttributes.borderRadius ).toBe( 8 );
		expect( migratedAttributes.borderWidth ).toBe( 2 );
		expect( migratedAttributes.inputColor ).toBe( '#333333' );
		expect( migratedAttributes.labelColor ).toBe( '#666666' );
		expect( migratedAttributes.fieldBackgroundColor ).toBe( '#ffffff' );

		// showCountrySelector should be false
		expect( migratedAttributes.showCountrySelector ).toBe( false );
	} );
} );
