import { jest } from '@jest/globals';
import { addFilter, hasFilter, removeFilter } from '@wordpress/hooks';

const mockHasFeatureFlag = jest.fn( () => true );

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: ( ...args ) => mockHasFeatureFlag( ...args ),
} ) );

/**
 * A stand-in block registry.
 *
 * The lookup is built from the blocks themselves, so importing the real child-blocks module
 * here would pull every block — and its editor dependencies — into this test just to answer a
 * question about the guard. The stub keeps that question isolated: whether a block gets a
 * panel follows from its own declaration, whatever the registry happens to contain. Coverage
 * that every real field block declares a type lives in block-names.test.js, read from source.
 */
await jest.unstable_mockModule( '../../../../../src/blocks/contact-form/child-blocks.js', () => ( {
	childBlocks: [
		{ name: 'field-text', conditional_logic: { type: 'string' } },
		{ name: 'field-radio', conditional_logic: { type: 'choice' } },
		{ name: 'field-checkbox', conditional_logic: { type: 'boolean' } },
		// Field-prefixed but with no declaration: opts out of conditional logic.
		{ name: 'field-not-a-real-type' },
		// jetpack/input imports the same shared settings and therefore carries the attribute,
		// but it is an inner input, not a field, so it must not get a panel of its own.
		{ name: 'input', conditional_logic: { type: 'string' } },
		{ name: 'label' },
	],
} ) );

const {
	ATTRIBUTE_FILTER_NAMESPACE,
	FEATURE_FLAG,
	FILTER_NAMESPACE,
	addContainerLogicAttribute,
	isConditionalLogicField,
	registerConditionalLogicFilter,
	registerContainerAttribute,
} = await import( '../../../../../src/blocks/shared/conditional-logic/register.jsx' );

describe( 'conditional logic registration', () => {
	it.each( [ 'jetpack/field-text', 'jetpack/field-radio', 'jetpack/field-checkbox' ] )(
		'applies to %s',
		name => {
			expect( isConditionalLogicField( name ) ).toBe( true );
		}
	);

	it.each( [
		'jetpack/input',
		'jetpack/input-image-option',
		'jetpack/contact-form',
		'jetpack/label',
		'jetpack/option',
		'jetpack/options',
		'jetpack/form-step',
		'jetpack/fieldset-image-options',
		'core/paragraph',
		'core/heading',
	] )( 'does not apply to %s', name => {
		expect( isConditionalLogicField( name ) ).toBe( false );
	} );

	it( 'tolerates a missing or non-string block name', () => {
		expect( isConditionalLogicField( undefined ) ).toBe( false );
		expect( isConditionalLogicField( null ) ).toBe( false );
		expect( isConditionalLogicField( '' ) ).toBe( false );
		expect( isConditionalLogicField( 42 ) ).toBe( false );
	} );

	it( 'skips a field-prefixed block with no comparison behavior', () => {
		expect( isConditionalLogicField( 'jetpack/field-not-a-real-type' ) ).toBe( false );
	} );

	// A field block declares `conditionalLogic` in the package's own shared settings. A
	// container is a core block this package does not own, so the attribute has to be added at
	// registration time instead.
	describe( 'container attribute', () => {
		it( 'adds the attribute to core/group', () => {
			const settings = addContainerLogicAttribute( { attributes: { layout: {} } }, 'core/group' );

			expect( settings.attributes.conditionalLogic ).toEqual( {
				type: 'object',
				default: { enabled: false, action: 'show', logicalOperator: 'any', groups: [] },
			} );
			// Core's own attributes must survive.
			expect( settings.attributes.layout ).toEqual( {} );
		} );

		it( 'gives each container its own groups array', () => {
			// A default is shared by every instance of the block, so handing them all the same
			// array would let one group's conditions surface on another if it were mutated.
			const a = addContainerLogicAttribute( { attributes: {} }, 'core/group' );
			const b = addContainerLogicAttribute( { attributes: {} }, 'core/group' );

			expect( a.attributes.conditionalLogic.default.groups ).not.toBe(
				b.attributes.conditionalLogic.default.groups
			);
		} );

		it.each( [ 'core/columns', 'core/paragraph', 'jetpack/field-text' ] )(
			'leaves %s alone',
			name => {
				const settings = { attributes: {} };

				expect( addContainerLogicAttribute( settings, name ) ).toBe( settings );
			}
		);

		it( 'does not overwrite an attribute the block already declares', () => {
			const settings = { attributes: { conditionalLogic: { type: 'object', default: {} } } };

			expect( addContainerLogicAttribute( settings, 'core/group' ) ).toBe( settings );
		} );
	} );

	// Regression: this module ships in both dist/blocks/editor.js and
	// dist/form-editor/jetpack-form-editor.js, and the Forms editor screen loads both.
	// addFilter does not de-duplicate by namespace, so an unguarded registration wrapped
	// BlockEdit twice and rendered the panel twice.
	describe( 'filter registration', () => {
		afterEach( () => {
			removeFilter( 'editor.BlockEdit', FILTER_NAMESPACE );
			mockHasFeatureFlag.mockReturnValue( true );
		} );

		it( 'registers the BlockEdit filter when the feature flag is on', () => {
			removeFilter( 'editor.BlockEdit', FILTER_NAMESPACE );

			expect( registerConditionalLogicFilter() ).toBe( true );
			expect( hasFilter( 'editor.BlockEdit', FILTER_NAMESPACE ) ).toBeTruthy();
			// A block's attributes are fixed when it registers, so this filter has to be in
			// place before core/group registers or the panel writes an attribute the block
			// does not declare and the parser drops it on reload.
			// Registered at module scope by registerContainerAttribute, independently of this
			// function -- see the "attribute registration is unconditional" block below.
			expect( hasFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE ) ).toBeTruthy();
			expect( mockHasFeatureFlag ).toHaveBeenCalledWith( FEATURE_FLAG );
		} );

		// Regression: this module ships in both dist/blocks/editor.js and
		// dist/form-editor/jetpack-form-editor.js, and the Forms editor screen loads both.
		// addFilter does not de-duplicate by namespace, so an unguarded registration wrapped
		// BlockEdit twice and rendered the panel twice.
		it( 'declines to register a second time', () => {
			removeFilter( 'editor.BlockEdit', FILTER_NAMESPACE );

			expect( registerConditionalLogicFilter() ).toBe( true );
			expect( registerConditionalLogicFilter() ).toBe( false );
			expect( registerConditionalLogicFilter() ).toBe( false );
			expect( hasFilter( 'editor.BlockEdit', FILTER_NAMESPACE ) ).toBeTruthy();
		} );

		it( 'does not register at all when the feature flag is off', () => {
			removeFilter( 'editor.BlockEdit', FILTER_NAMESPACE );
			mockHasFeatureFlag.mockReturnValue( false );

			expect( registerConditionalLogicFilter() ).toBe( false );
			expect( hasFilter( 'editor.BlockEdit', FILTER_NAMESPACE ) ).toBeFalsy();
		} );
	} );
} );

/**
 * The attribute has to be registered whatever else happens.
 *
 * A block's attributes are fixed when it registers, and Gutenberg discards delimiter
 * attributes the block type does not declare -- so a session that reaches the editor without
 * this having run drops a group's stored conditions on the next save, silently.
 */
describe( 'container attribute registration is unconditional', () => {
	afterEach( () => {
		removeFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE );
		removeFilter( 'editor.BlockEdit', FILTER_NAMESPACE );
		registerContainerAttribute();
		mockHasFeatureFlag.mockReturnValue( true );
	} );

	it( 'registers the attribute filter even with the feature flag off', () => {
		removeFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE );
		mockHasFeatureFlag.mockReturnValue( false );

		expect( registerContainerAttribute() ).toBe( true );
		expect( hasFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE ) ).toBeTruthy();
	} );

	it( 'registers the attribute even when the BlockEdit namespace is already claimed', () => {
		removeFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE );
		// Something else claims the panel namespace first, which makes
		// registerConditionalLogicFilter bail before it would ever have reached the graft.
		addFilter( 'editor.BlockEdit', FILTER_NAMESPACE, x => x );

		expect( registerConditionalLogicFilter() ).toBe( false );
		expect( registerContainerAttribute() ).toBe( true );
		expect( hasFilter( 'blocks.registerBlockType', ATTRIBUTE_FILTER_NAMESPACE ) ).toBeTruthy();
	} );

	it( 'does not register twice', () => {
		expect( registerContainerAttribute() ).toBe( false );
	} );
} );
