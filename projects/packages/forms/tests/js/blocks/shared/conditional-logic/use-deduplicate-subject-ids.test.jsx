import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const mockUpdateBlockAttributes = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

const actualData = await import( '@wordpress/data' );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useDispatch: () => ( { updateBlockAttributes: mockUpdateBlockAttributes } ),
} ) );

const { default: useDeduplicateSubjectFieldIds } = await import(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-deduplicate-subject-ids.js'
);

const field = ( clientId, id ) => ( { clientId, id } );

/**
 * Render the hook.
 *
 * @param {Array}   fields           - Subject field descriptors, in document order.
 * @param {object}  options          - Options.
 * @param {string}  options.own      - Id of the field owning the panel.
 * @param {boolean} options.isActive - Whether the rule builder is open.
 * @return {object} The renderHook result.
 */
const setup = ( fields, { own = '', isActive = true } = {} ) =>
	renderHook( ( { f, o, a } ) => useDeduplicateSubjectFieldIds( f, o, a ), {
		initialProps: { f: fields, o: own, a: isActive },
	} );

describe( 'useDeduplicateSubjectFieldIds', () => {
	beforeEach( () => {
		mockUpdateBlockAttributes.mockClear();
	} );

	// The whole point of the narrow trigger: a form that is merely open must not have its
	// field ids rewritten underneath the author.
	it( 'does nothing while the rule builder is closed', () => {
		setup( [ field( 'a', 'first-name' ), field( 'b', 'first-name' ) ], { isActive: false } );

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

	// The first occurrence keeps its id, matching what PHP does at render, so a rule that
	// already names it goes on meaning the same field.
	it( 'renames the later of two fields sharing an id', () => {
		setup( [ field( 'a', 'first-name' ), field( 'b', 'first-name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'first-name-2' } );
	} );

	it( 'suffixes each further duplicate in turn', () => {
		setup( [ field( 'a', 'name' ), field( 'b', 'name' ), field( 'c', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 2 );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'name-2' } );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c', { id: 'name-3' } );
	} );

	// A suffix already in use must not be handed out twice.
	it( 'skips a suffix that another field already holds', () => {
		setup( [ field( 'a', 'name' ), field( 'b', 'name-2' ), field( 'c', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c', { id: 'name-3' } );
	} );

	// useSubjectFields excludes the field owning the panel, so its id is the one collision
	// this list cannot see. Renaming onto it would trade one duplicate for another.
	it( 'does not rename a duplicate onto the id of the field owning the panel', () => {
		setup( [ field( 'a', 'name' ), field( 'b', 'name' ) ], { own: 'name-2' } );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'name-3' } );
	} );

	it( 'repairs several separate collisions independently', () => {
		setup( [
			field( 'a', 'first-name' ),
			field( 'b', 'last-name' ),
			field( 'c', 'first-name' ),
			field( 'd', 'last-name' ),
		] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 2 );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'c', { id: 'first-name-2' } );
		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'd', { id: 'last-name-2' } );
	} );

	// The store updates as a result of the rename, so the hook re-runs with the repaired
	// descriptors. It has to settle rather than rename again.
	it( 'settles once the ids it wrote come back', () => {
		const { rerender } = setup( [ field( 'a', 'name' ), field( 'b', 'name' ) ] );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		mockUpdateBlockAttributes.mockClear();

		rerender( { f: [ field( 'a', 'name' ), field( 'b', 'name-2' ) ], o: '', a: true } );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// Re-rendering with the same ids must not re-dispatch: the effect is keyed on the id
	// assignment, not on the array identity useSelect hands back on every store change.
	it( 'does not repeat the repair when nothing changed', () => {
		const fields = [ field( 'a', 'name' ), field( 'b', 'name' ) ];
		const { rerender } = setup( fields );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledTimes( 1 );
		mockUpdateBlockAttributes.mockClear();

		// A fresh array with identical contents, exactly as useSelect would produce.
		rerender( { f: [ field( 'a', 'name' ), field( 'b', 'name' ) ], o: '', a: true } );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
	} );

	// Opening the builder is the trigger, so a collision present all along is repaired then
	// and not before.
	it( 'repairs on the transition from closed to open', () => {
		const fields = [ field( 'a', 'name' ), field( 'b', 'name' ) ];
		const { rerender } = setup( fields, { isActive: false } );

		expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();

		rerender( { f: fields, o: '', a: true } );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'b', { id: 'name-2' } );
	} );
} );
