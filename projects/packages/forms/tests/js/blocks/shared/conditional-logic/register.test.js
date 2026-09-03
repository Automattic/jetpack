import { jest } from '@jest/globals';
import { hasFilter, removeFilter } from '@wordpress/hooks';

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

const { FEATURE_FLAG, FILTER_NAMESPACE, isConditionalLogicField, registerConditionalLogicFilter } =
	await import( '../../../../../src/blocks/shared/conditional-logic/register.jsx' );

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
