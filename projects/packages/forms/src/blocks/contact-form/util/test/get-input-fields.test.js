import { describe, expect, it, jest } from '@jest/globals';

// A stand-in registry covering the four shapes the predicate has to tell apart:
// an ordinary input, a hidden field, implicit consent, explicit consent.
await jest.unstable_mockModule( '../../child-blocks.js', () => ( {
	childBlocks: [
		{ name: 'field-email', settings: { attributes: { required: { type: 'boolean' } } } },
		{ name: 'field-name', settings: { attributes: { required: { type: 'boolean' } } } },
		{ name: 'field-hidden', settings: { attributes: { required: { type: 'boolean' } } } },
		{
			name: 'field-consent',
			settings: { attributes: { required: { type: 'boolean' }, consentType: 'implicit' } },
		},
		{ name: 'label', settings: { attributes: {} } },
	],
} ) );

const { getInputFields, isInputWithRequiredField } = await import( '../get-input-fields.ts' );

const block = ( name, clientId, innerBlocks = [] ) => ( {
	name,
	clientId,
	attributes: {},
	innerBlocks,
} );

describe( 'isInputWithRequiredField', () => {
	it( 'accepts a field the visitor fills in', () => {
		expect( isInputWithRequiredField( 'jetpack/field-email' ) ).toBe( true );
	} );

	it( 'rejects a hidden field', () => {
		expect( isInputWithRequiredField( 'jetpack/field-hidden' ) ).toBe( false );
	} );

	it( 'rejects implicit consent, which the visitor never answers', () => {
		expect( isInputWithRequiredField( 'jetpack/field-consent' ) ).toBe( false );
	} );

	it( 'rejects a block with no required attribute', () => {
		expect( isInputWithRequiredField( 'jetpack/label' ) ).toBe( false );
	} );

	it.each( [ [ 'core/paragraph' ], [ 'jetpack/not-a-field' ], [ '' ], [ undefined ] ] )(
		'rejects %s',
		name => {
			expect( isInputWithRequiredField( name ) ).toBe( false );
		}
	);
} );

describe( 'getInputFields', () => {
	it( 'returns the inputs in document order and skips everything else', () => {
		const fields = getInputFields( [
			block( 'core/heading', 'h' ),
			block( 'jetpack/field-name', 'name-1' ),
			block( 'jetpack/field-email', 'email-1' ),
			block( 'jetpack/field-hidden', 'hidden-1' ),
			block( 'core/button', 'btn' ),
		] );

		expect( fields.map( f => f.clientId ) ).toEqual( [ 'name-1', 'email-1' ] );
	} );

	it( 'finds fields nested inside step blocks in a multi-step form', () => {
		const fields = getInputFields( [
			block( 'jetpack/form-step', 'step-1', [ block( 'jetpack/field-name', 'name-1' ) ] ),
			block( 'jetpack/form-step', 'step-2', [
				block( 'core/group', 'grp', [ block( 'jetpack/field-email', 'email-1' ) ] ),
			] ),
		] );

		expect( fields.map( f => f.clientId ) ).toEqual( [ 'name-1', 'email-1' ] );
	} );

	it( 'returns nothing for an empty or missing form', () => {
		expect( getInputFields( [] ) ).toEqual( [] );
		expect( getInputFields() ).toEqual( [] );
	} );
} );
