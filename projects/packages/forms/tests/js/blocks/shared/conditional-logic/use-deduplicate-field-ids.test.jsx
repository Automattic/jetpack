import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const mockUpdateBlockAttributes = jest.fn();
const mockMarkNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

const actualData = await import( '@wordpress/data' );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useDispatch: () => ( {
		updateBlockAttributes: mockUpdateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent: mockMarkNotPersistent,
	} ),
} ) );

const { default: useDeduplicateFieldIds } = await import(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-deduplicate-field-ids.js'
);

const field = ( clientId, id ) => ( { clientId, id } );

/**
 * Render the hook.
 *
 * @param {Array}   fields   - Fields in document order.
 * @param {boolean} isActive - Whether the rule builder is open.
 * @return {object} The renderHook result.
 */
const setup = ( fields, isActive = true ) =>
	renderHook( ( { f, a } ) => useDeduplicateFieldIds( f, a ), {
		initialProps: { f: fields, a: isActive },
	} );

/**
 * The ids the hook would leave the form with, as a flat list in document order.
 *
 * @param {Array} fields - Fields in document order.
 * @return {Array} Final id per field.
 */
const resolve = fields => {
	setup( fields );

	const renamed = new Map(
		mockUpdateBlockAttributes.mock.calls.map( ( [ id, a ] ) => [ id, a.id ] )
	);

	return fields.map( f => renamed.get( f.clientId ) ?? f.id );
};

describe( 'useDeduplicateFieldIds', () => {
	beforeEach( () => {
		mockUpdateBlockAttributes.mockClear();
		mockMarkNotPersistent.mockClear();
	} );

	// The narrow trigger the repair is built around: opening the builder, never merely
	// loading a form. Rewriting ids on load would touch posts nobody is editing.
	it( 'does nothing while the rule builder is closed', () => {
		setup( [ field( 'a', 'first-name' ), field( 'b', 'first-name' ) ], false );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'leaves distinct ids alone', () => {
		setup( [ field( 'a', 'first-name' ), field( 'b', 'last-name' ) ] );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// Ids are never minted, only repaired. A field with no id is keyed by client id in the
	// dropdown, so it is already unambiguous.
	it( 'never assigns an id to a field that has none', () => {
		setup( [ field( 'a', '' ), field( 'b', '' ), field( 'c', '' ) ] );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	it( 'renames the later of two fields sharing an id', () => {
		setup( [ field( 'a', 'first-name' ), field( 'b', 'first-name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'first-name-2' } );
	} );

	// The repair corrects the document; it is not an edit the author made. Landing it as its
	// own undo step would leave a Ctrl-Z that reverts a rename nobody asked for.
	it( 'marks each rename as a non-persistent change', () => {
		setup( [ field( 'a', 'name' ), field( 'b', 'name' ), field( 'c', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 2 );
		expect( mockMarkNotPersistent ).toHaveBeenCalledTimes( 2 );
	} );

	describe( 'document order decides which field keeps the id', () => {
		// The field owning the panel is excluded from the subject dropdown, so an earlier
		// version of this hook was handed a list without it and treated it as though it always
		// came first. When the owner was the later duplicate that renamed the *earlier* field
		// and handed its id to the owner, swapping the two fields' response keys. The hook now
		// takes the whole form in document order and the owner is just another entry.
		it( 'renames the owner when the owner is the later duplicate', () => {
			setup( [ field( 'earlier', 'first-name' ), field( 'owner', 'first-name' ) ] );

			expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'owner', {
				id: 'first-name-2',
			} );
		} );

		it( 'renames the other field when the owner is the earlier duplicate', () => {
			setup( [ field( 'owner', 'first-name' ), field( 'later', 'first-name' ) ] );

			expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
			expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'later', {
				id: 'first-name-2',
			} );
		} );
	} );

	// Parity with Contact_Form_Field::__construct() is the invariant that makes persisting a
	// rename safe: every field this hook renames is one PHP was already renaming at render, so
	// stored rules and response keys keep pointing at the field they always meant. These
	// expectations are that PHP algorithm's output for the same document -- first occurrence
	// keeps the id, later ones take `<id>-2`, `-3`, ... skipping any suffix already taken.
	describe( 'parity with the PHP duplicate-id rule', () => {
		it.each( [
			[
				[ 'name', 'name' ],
				[ 'name', 'name-2' ],
			],
			[
				[ 'name', 'name', 'name' ],
				[ 'name', 'name-2', 'name-3' ],
			],
			// The third field already holds the suffix the second one is about to take, so the
			// third is pushed along in turn -- and its base is its own id, not the original.
			[
				[ 'name', 'name', 'name-2' ],
				[ 'name', 'name-2', 'name-2-2' ],
			],
			// A suffix held by an untouched field must not be handed out twice.
			[
				[ 'name', 'name-2', 'name' ],
				[ 'name', 'name-2', 'name-3' ],
			],
			[
				[ 'first-name', 'last-name', 'first-name', 'last-name' ],
				[ 'first-name', 'last-name', 'first-name-2', 'last-name-2' ],
			],
			[
				[ 'a', 'a', 'a-2', 'a-3', 'a' ],
				[ 'a', 'a-2', 'a-2-2', 'a-3', 'a-4' ],
			],
			// Fields with no id are inert: they neither collide nor get one.
			[
				[ 'name', '', 'name' ],
				[ 'name', '', 'name-2' ],
			],
		] )( '%j resolves to %j', ( input, expected ) => {
			const fields = input.map( ( id, i ) => field( `c${ i }`, id ) );

			expect( resolve( fields ) ).toEqual( expected );
		} );
	} );

	// The store updates as a result of the rename, so the hook re-runs with the repaired
	// list. It has to settle rather than rename again.
	it( 'settles once the ids it wrote come back', () => {
		const { rerender } = setup( [ field( 'a', 'name' ), field( 'b', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		mockUpdateBlockAttributes.mockClear();

		rerender( { f: [ field( 'a', 'name' ), field( 'b', 'name-2' ) ], a: true } );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// Re-rendering with the same ids must not re-dispatch: the effect is keyed on the id
	// assignment, not on the array identity useSelect hands back on every store change.
	it( 'does not repeat the repair when nothing changed', () => {
		const { rerender } = setup( [ field( 'a', 'name' ), field( 'b', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		mockUpdateBlockAttributes.mockClear();

		// A fresh array with identical contents, exactly as useSelect would produce.
		rerender( { f: [ field( 'a', 'name' ), field( 'b', 'name' ) ], a: true } );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// Opening the builder is the trigger, so a collision present all along is repaired then
	// and not before.
	it( 'repairs on the transition from closed to open', () => {
		const fields = [ field( 'a', 'name' ), field( 'b', 'name' ) ];
		const { rerender } = setup( fields, false );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();

		rerender( { f: fields, a: true } );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'name-2' } );
	} );

	it( 'tolerates a missing field list', () => {
		expect( () => setup( undefined ) ).not.toThrow();
		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );
} );
