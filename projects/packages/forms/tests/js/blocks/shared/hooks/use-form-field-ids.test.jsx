import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// A block-editor store standing in for one form. Keyed by client id, the way getBlock is.
let blocks = {};
let rootOf = {};

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: selector =>
		selector( () => ( {
			getBlock: clientId => blocks[ clientId ],
			getBlockParentsByBlockName: ( clientId, name ) =>
				'jetpack/contact-form' === name && rootOf[ clientId ] ? [ rootOf[ clientId ] ] : [],
			getBlockRootClientId: clientId => rootOf[ clientId ] || '',
		} ) ),
} ) );

const { default: useFormFieldIds } = await import(
	'../../../../../src/blocks/shared/hooks/use-form-field-ids.js'
);

/**
 * A field block, optionally carrying an explicit id.
 *
 * @param {string} clientId - Block client id.
 * @param {string} [id]     - Explicit field id, if the field carries one.
 * @param {string} [name]   - Block name; defaults to a text field.
 * @return {object} A block instance shaped the way the store returns them.
 */
const field = ( clientId, id, name = 'jetpack/field-text' ) => ( {
	clientId,
	name,
	attributes: id ? { id } : {},
	innerBlocks: [],
} );

/**
 * A non-field container, e.g. a Group or a Column. Forms allow these (`CORE_BLOCKS`).
 *
 * @param {string} name        - Block name.
 * @param {Array}  innerBlocks - Children.
 * @return {object} A block instance shaped the way the store returns them.
 */
const container = ( name, innerBlocks ) => ( { clientId: name, name, innerBlocks } );

/**
 * Put blocks in a form and return the ids the hook reports for it.
 *
 * @param {Array}  innerBlocks - The form's children.
 * @param {string} [from]      - Client id of the field asking; defaults to the first field.
 * @param {...any} args        - Extra arguments forwarded to the hook.
 * @return {Array} The reported ids.
 */
const idsFor = ( innerBlocks, from = 'c-1', ...args ) => {
	blocks = { form: { clientId: 'form', name: 'jetpack/contact-form', innerBlocks } };
	rootOf = { [ from ]: 'form' };

	return renderHook( () => useFormFieldIds( from, ...args ) ).result.current;
};

beforeEach( () => {
	blocks = {};
	rootOf = {};
} );

describe( 'useFormFieldIds', () => {
	// Unlike the subject list this keeps the asking block: a field colliding with the one
	// doing the checking is just as much a collision.
	it( 'reports every field in the form, in document order, including the asker', () => {
		expect( idsFor( [ field( 'c-1', 'first' ), field( 'c-2', 'second' ) ] ) ).toEqual( [
			'first',
			'second',
		] );
	} );

	// Forms permit core containers (Group, Columns, ...). A field nested in one is still a
	// field of that form -- PHP renders it and assigns it an id like any other -- so the walk
	// has to descend through blocks it does not recognise rather than stopping at them.
	it( 'descends through Group and Columns to reach nested fields', () => {
		const ids = idsFor(
			[
				container( 'core/group', [ field( 'c-nested', 'nested' ) ] ),
				field( 'c-1', 'top' ),
				container( 'core/columns', [ container( 'core/column', [ field( 'c-deep', 'deep' ) ] ) ] ),
			],
			'c-1'
		);

		expect( ids ).toEqual( [ 'nested', 'top', 'deep' ] );
	} );

	// A field's own inner blocks are its label and input, not more fields.
	it( 'does not descend into a field to find more fields', () => {
		const withLabel = field( 'c-1', 'name' );
		withLabel.innerBlocks = [ { name: 'jetpack/label', attributes: { label: 'Name' } } ];

		expect( idsFor( [ withLabel ] ) ).toEqual( [ 'name' ] );
	} );

	// Reported as '' rather than undefined, so a caller can skip them without optional
	// chaining -- and so "no id" is distinguishable from "not a field".
	it( 'reports a missing id as an empty string', () => {
		expect( idsFor( [ field( 'c-1' ) ] ) ).toEqual( [ '' ] );
	} );

	// The walk is only worth doing when something consumes it, so an inactive caller must not
	// pay for it -- and must get the same reference every time, or it re-renders regardless.
	it( 'reports nothing, stably, when inactive', () => {
		const first = idsFor( [ field( 'c-1', 'name' ), field( 'c-2', 'name' ) ], 'c-1', false );
		const second = idsFor( [ field( 'c-1', 'name' ), field( 'c-2', 'name' ) ], 'c-1', false );

		expect( first ).toEqual( [] );
		expect( first ).toBe( second );
	} );

	it( 'returns nothing when the field is not in a form', () => {
		blocks = {};
		rootOf = {};

		expect( renderHook( () => useFormFieldIds( 'orphan' ) ).result.current ).toEqual( [] );
	} );
} );
