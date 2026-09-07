import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

/**
 * The real hooks, not the stubs the panel suite uses.
 *
 * panel.test.jsx mocks both of these so it can drive the rule builder without a block editor,
 * which means the behaviour they actually implement -- which fields are offered as subjects,
 * and what id a chosen one is given -- was never exercised. That id assignment is the part
 * worth pinning: getting it wrong silently repoints a rule at the wrong field, or renames a
 * field that may already have responses stored against its old id.
 */

const mockUpdateBlockAttributes = jest.fn();

// A block-editor store standing in for one form. Keyed by client id, the way getBlock is.
let blocks = {};
let rootOf = {};

const fakeSelect = () => ( {
	getBlock: clientId => blocks[ clientId ],
	getBlockParentsByBlockName: ( clientId, name ) =>
		'jetpack/contact-form' === name && rootOf[ clientId ] ? [ rootOf[ clientId ] ] : [],
	getBlockRootClientId: clientId => rootOf[ clientId ] || '',
} );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { updateBlockAttributes: mockUpdateBlockAttributes } ),
	useSelect: selector => selector( fakeSelect ),
	// useEnsureFieldId reads the whole form on demand rather than subscribing to it.
	useRegistry: () => ( { select: fakeSelect } ),
} ) );

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	getBlockType: name => ( { title: name.replace( 'jetpack/field-', '' ) } ),
} ) );

/**
 * A stand-in block registry.
 *
 * The hook resolves a block's comparison behaviour through block-types, which reads the real
 * registry -- and that side-effect imports every block in the package. Stubbing the boundary
 * keeps this file about which fields are offered, not about what the registry contains.
 */
await jest.unstable_mockModule( '../../../../../src/blocks/contact-form/child-blocks.js', () => ( {
	childBlocks: [
		{ name: 'field-text', conditional_logic: { type: 'string' } },
		{ name: 'field-select', conditional_logic: { type: 'choice' } },
		{ name: 'field-checkbox', conditional_logic: { type: 'boolean' } },
	],
} ) );

const { default: useSubjectFields, useEnsureFieldId } = await import(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-subject-fields.js'
);

/**
 * A field block, optionally carrying a label block and an explicit id.
 *
 * @param {string} clientId         - Block client id.
 * @param {object} [options]        - Field options.
 * @param {string} [options.label]  - Text of the field's label block, if it has one.
 * @param {string} [options.id]     - Explicit field id, if the field carries one.
 * @param {string} [options.name]   - Block name; defaults to a text field.
 * @param {string} [options.option] - Text of a standalone `jetpack/option` inner block.
 * @return {object} A block instance shaped the way the store returns them.
 */
const field = ( clientId, { label, id, option, name = 'jetpack/field-text' } = {} ) => {
	const innerBlocks = [];

	if ( label ) {
		innerBlocks.push( { name: 'jetpack/label', attributes: { label } } );
	}
	if ( option ) {
		innerBlocks.push( {
			name: 'jetpack/option',
			attributes: { label: option, isStandalone: true },
		} );
	}

	return {
		clientId,
		name,
		attributes: id ? { id } : {},
		innerBlocks,
	};
};

const ensureFieldId = () => renderHook( () => useEnsureFieldId() ).result.current;
const subjectsFor = clientId => renderHook( () => useSubjectFields( clientId ) ).result.current;

beforeEach( () => {
	mockUpdateBlockAttributes.mockClear();
	blocks = {};
	rootOf = {};
} );

describe( 'useEnsureFieldId', () => {
	// Most fields carry no explicit id: the renderer derives one from the label at output
	// time. A rule cannot reference a derived id safely, because editing the label would
	// change it and the rule would quietly stop matching.
	it( 'mints an id from the label for a field that has none', () => {
		const assigned = ensureFieldId()( { clientId: 'c-1', id: '', label: 'Favorite Color' }, [] );

		expect( assigned ).toBe( 'favorite-color' );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c-1', { id: 'favorite-color' } );
	} );

	it( 'keeps an explicit id and writes nothing', () => {
		const assigned = ensureFieldId()( { clientId: 'c-1', id: 'email_1', label: 'Email' }, [] );

		expect( assigned ).toBe( 'email_1' );
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// The used ids come from the form itself, not from a list the caller assembles -- so a
	// field the subject dropdown never offers still blocks its id.
	it( 'de-duplicates against every field in the form', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					field( 'c-taken', { id: 'email' } ),
					// Not offered as a subject -- it declares no conditional logic -- but the
					// renderer still gives it an id, so minting on top of it would collide.
					field( 'c-image', { id: 'email-2', name: 'jetpack/field-image-select' } ),
					field( 'c-1' ),
				],
			},
		};
		rootOf = { 'c-1': 'form' };

		const assigned = ensureFieldId()( { clientId: 'c-1', id: '', label: 'Email' } );

		expect( assigned ).toBe( 'email-3' );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c-1', { id: 'email-3' } );
	} );

	/**
	 * The collision that made this guard necessary.
	 *
	 * useSubjectFields excludes the field owning the panel, so the owner's id is the one the
	 * used-id list cannot see. Without it passed in, an unnamed "Email" subject chosen from a
	 * panel on a field already using `email` is handed `email` unchanged -- and PHP's
	 * duplicate guard then renames whichever parses second. Either the rule silently starts
	 * evaluating a different field, or the owner's response key changes underneath a form
	 * that may already have responses stored against it.
	 */

	it( 'falls back to a generic base when the label slugifies to nothing', () => {
		const assigned = ensureFieldId()( { clientId: 'c-1', id: '', label: '!!!' }, [] );

		expect( assigned ).toBe( 'field' );
	} );

	it( 'assigns nothing for a missing field', () => {
		expect( ensureFieldId()( null, [] ) ).toBe( '' );
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'useSubjectFields', () => {
	it( 'lists sibling fields, excludes the panel’s own, and keeps id-less ones', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					field( 'c-owner', { label: 'Owner', id: 'owner_1' } ),
					field( 'c-name', { label: 'Name', id: 'name_1' } ),
					field( 'c-colour', { label: 'Colour' } ),
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		const found = subjectsFor( 'c-owner' );

		expect( found.map( entry => entry.clientId ) ).toEqual( [ 'c-name', 'c-colour' ] );
		// Listed despite having no explicit id -- requiring one would hide nearly every field.
		expect( found.find( entry => entry.clientId === 'c-colour' ).id ).toBe( '' );
		expect( found.find( entry => entry.clientId === 'c-name' ).id ).toBe( 'name_1' );
	} );

	// A rule referencing a later step always compares against an empty value. The author
	// should be able to see that rather than be silently prevented from writing it.
	it( 'numbers the step each field sits in', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					{
						clientId: 'step-1',
						name: 'jetpack/form-step',
						innerBlocks: [ field( 'c-a', { label: 'A' } ) ],
					},
					{
						clientId: 'step-2',
						name: 'jetpack/form-step',
						innerBlocks: [ field( 'c-b', { label: 'B' } ) ],
					},
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		const bySteps = Object.fromEntries(
			subjectsFor( 'c-owner' ).map( entry => [ entry.clientId, entry.step ] )
		);

		expect( bySteps ).toEqual( { 'c-a': 1, 'c-b': 2 } );
	} );

	it( 'falls back to the label, then the id, then a placeholder', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					field( 'c-labelled', { label: 'Budget' } ),
					field( 'c-id-only', { id: 'total_1' } ),
					field( 'c-bare' ),
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		const labels = Object.fromEntries(
			subjectsFor( 'c-owner' ).map( entry => [ entry.clientId, entry.label ] )
		);

		expect( labels ).toEqual( {
			'c-labelled': 'Budget',
			'c-id-only': 'total_1',
			'c-bare': 'Untitled field',
		} );
	} );

	// A checkbox and a consent field keep their inline label on the standalone `jetpack/option`
	// their template inserts, not on a `jetpack/label` block.
	it( 'reads a checkbox label from its standalone option block', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					field( 'c-consent', {
						name: 'jetpack/field-checkbox',
						option: 'Send me a copy',
					} ),
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		expect( subjectsFor( 'c-owner' )[ 0 ].label ).toBe( 'Send me a copy' );
	} );

	// The choice fields nest theirs under a `jetpack/options` wrapper, so only a direct child
	// can be the field's own inline label.
	it( 'ignores option blocks nested under an options wrapper', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					{
						clientId: 'c-choice',
						name: 'jetpack/field-select',
						attributes: {},
						innerBlocks: [
							{
								name: 'jetpack/options',
								innerBlocks: [ { name: 'jetpack/option', attributes: { label: 'Red' } } ],
							},
						],
					},
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		expect( subjectsFor( 'c-owner' )[ 0 ].label ).toBe( 'Untitled field' );
	} );

	// Choosing an unnamed field mints it an id from whatever this hook called it, so a
	// placeholder-derived one would rename the field inside the dropdown it was picked from.
	it( 'does not show an id minted from the placeholder as the label', () => {
		blocks = {
			form: {
				clientId: 'form',
				name: 'jetpack/contact-form',
				innerBlocks: [
					field( 'c-first', { id: 'untitled-field' } ),
					field( 'c-second', { id: 'untitled-field-2' } ),
					field( 'c-author-named', { id: 'untitled-field-ish' } ),
				],
			},
		};
		rootOf = { 'c-owner': 'form' };

		const labels = Object.fromEntries(
			subjectsFor( 'c-owner' ).map( entry => [ entry.clientId, entry.label ] )
		);

		expect( labels ).toEqual( {
			'c-first': 'Untitled field',
			'c-second': 'Untitled field',
			// Not one this panel could have minted, so it is the author's and still shown.
			'c-author-named': 'untitled-field-ish',
		} );
	} );

	it( 'offers nothing when the field is not inside a form', () => {
		expect( subjectsFor( 'c-orphan' ) ).toEqual( [] );
	} );
} );
