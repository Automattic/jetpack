import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

/**
 * Exercises the real hook, not a stand-in.
 *
 * panel.test.jsx and with-conditional-logic.test.jsx both mock this module wholesale, including
 * a hand-rolled copy of the id-collision logic. That leaves the load-bearing part of the
 * feature -- the id a rule is pointed at -- covered only by a reimplementation of itself. A
 * wrong id here silently retargets a rule at another field, or renames a field that may already
 * have responses, so it is exactly the path that needs the real code under test.
 *
 * `generate-unique-id.js` is deliberately left unmocked: the uniqueness check is what these
 * tests are for. block-types.js and field-options.ts are mocked only to keep the block registry
 * (which child-blocks.js side-effect imports) out of a hook test.
 */

const mockUpdateBlockAttributes = jest.fn();

// Set per test; the block-editor selectors read from it.
let mockStore = {};

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	getBlockType: name => ( { title: name } ),
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: selector => selector( () => mockStore ),
	useDispatch: () => ( { updateBlockAttributes: mockUpdateBlockAttributes } ),
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useCallback: fn => fn,
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/conditional-logic/util/block-types.js',
	() => ( {
		getTypeKeyForBlockName: name =>
			( {
				'jetpack/field-text': 'string',
				'jetpack/field-name': 'string',
				'jetpack/field-number': 'number',
			} )[ name ] ?? null,
	} )
);

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/conditional-logic/util/field-options.ts',
	() => ( {
		getFieldOptions: () => [],
	} )
);

const { default: useSubjectFields, useEnsureFieldId } = await import(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-subject-fields.js'
);

const labelBlock = text => ( {
	name: 'jetpack/label',
	attributes: { label: text },
	innerBlocks: [],
} );

const field = ( clientId, name, label, attributes = {} ) => ( {
	clientId,
	name,
	attributes,
	innerBlocks: label ? [ labelBlock( label ) ] : [],
} );

// Point the block-editor selectors at a form whose top-level children are `blocks`.
const withForm = blocks => {
	const form = { clientId: 'c-form', name: 'jetpack/contact-form', innerBlocks: blocks };
	mockStore = {
		getBlockParentsByBlockName: () => [ 'c-form' ],
		getBlockRootClientId: () => 'c-form',
		getBlock: id => ( id === 'c-form' ? form : null ),
	};
};

beforeEach( () => {
	jest.clearAllMocks();
	mockStore = {};
} );

describe( 'useEnsureFieldId', () => {
	const ensure = () => renderHook( () => useEnsureFieldId() ).result.current;

	it( 'mints a slug id from the label for a field that has none', () => {
		const fieldId = ensure()( { clientId: 'c-1', id: '', label: 'Favorite Color' }, [] );

		expect( fieldId ).toBe( 'favorite-color' );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c-1', { id: 'favorite-color' } );
	} );

	it( 'keeps an explicit id and assigns nothing', () => {
		const fieldId = ensure()( { clientId: 'c-1', id: 'email_1', label: 'Email' }, [ 'email_1' ] );

		expect( fieldId ).toBe( 'email_1' );
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'de-duplicates a minted id against ids already in the form', () => {
		const fieldId = ensure()( { clientId: 'c-1', id: '', label: 'Email' }, [ 'email' ] );

		expect( fieldId ).toBe( 'email-2' );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c-1', { id: 'email-2' } );
	} );

	/*
	 * The round-1 collision this guards: the panel's own field id is not in the subject list
	 * (useSubjectFields excludes it), so it is fed in through `usedIds`. An unnamed "Email"
	 * subject chosen from a panel on a field already using `email` must not be handed `email`
	 * unchanged -- PHP's duplicate guard would then rename one at render and the rule would
	 * evaluate the wrong field. It has to step to `email-2`.
	 */
	it( "does not mint the panel own field id when a sibling's label collides with it", () => {
		const fieldId = ensure()( { clientId: 'c-1', id: '', label: 'Email' }, [ 'email', 'email-2' ] );

		expect( fieldId ).toBe( 'email-3' );
		expect( fieldId ).not.toBe( 'email' );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c-1', { id: 'email-3' } );
	} );

	it( 'returns an empty id and assigns nothing for a missing field', () => {
		const fieldId = ensure()( null );

		expect( fieldId ).toBe( '' );
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'useSubjectFields', () => {
	const subjects = clientId => renderHook( () => useSubjectFields( clientId ) ).result.current;

	it( 'lists sibling fields, excludes the panel own field, and keeps id-less fields', () => {
		withForm( [
			field( 'c-owner', 'jetpack/field-text', 'Owner' ),
			field( 'c-name', 'jetpack/field-name', 'Name', { id: 'name_1' } ),
			field( 'c-colour', 'jetpack/field-text', 'Colour' ),
		] );

		const found = subjects( 'c-owner' );

		expect( found.map( f => f.clientId ) ).toEqual( [ 'c-name', 'c-colour' ] );
		// The owner is never offered as a subject of its own condition.
		expect( found.map( f => f.clientId ) ).not.toContain( 'c-owner' );
		// A field the author never named is still selectable; it carries an empty id until chosen.
		expect( found.find( f => f.clientId === 'c-colour' ).id ).toBe( '' );
		expect( found.find( f => f.clientId === 'c-name' ).id ).toBe( 'name_1' );
	} );

	it( 'numbers the step each field sits in, in a multi-step form', () => {
		withForm( [
			{
				clientId: 's1',
				name: 'jetpack/form-step',
				attributes: {},
				innerBlocks: [ field( 'c-a', 'jetpack/field-text', 'A' ) ],
			},
			{
				clientId: 's2',
				name: 'jetpack/form-step',
				attributes: {},
				innerBlocks: [ field( 'c-b', 'jetpack/field-text', 'B' ) ],
			},
		] );

		const bySteps = Object.fromEntries( subjects( 'c-owner' ).map( f => [ f.clientId, f.step ] ) );

		expect( bySteps ).toEqual( { 'c-a': 1, 'c-b': 2 } );
	} );

	it( 'returns nothing when the field is not inside a form', () => {
		mockStore = {
			getBlockParentsByBlockName: () => [],
			getBlockRootClientId: () => null,
			getBlock: () => null,
		};

		expect( subjects( 'c-orphan' ) ).toEqual( [] );
	} );
} );
