/**
 * Tests for synced form auto-save helper functions
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// Mock WordPress dependencies before importing
const mockCreateBlock = jest.fn();
const mockSerialize = jest.fn();

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: mockCreateBlock,
	serialize: mockSerialize,
} ) );

const { captureBaseline, stageFormEdits, useSyncedFormAutoSave } = await import(
	'../../../src/blocks/contact-form/hooks/use-synced-form-auto-save.ts'
);

describe( 'captureBaseline', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCreateBlock.mockReturnValue( { name: 'jetpack/contact-form' } );
		mockSerialize.mockReturnValue( '<!-- wp:jetpack/contact-form /-->' );
	} );

	it( 'returns null when ref is undefined', () => {
		const baselineRef = { current: null };
		const result = captureBaseline(
			undefined,
			{ content: { raw: '...' } },
			false,
			{},
			[],
			baselineRef
		);

		expect( result ).toBeNull();
		expect( baselineRef.current ).toBeNull();
	} );

	it( 'returns null when syncedForm is null', () => {
		const baselineRef = { current: null };
		const result = captureBaseline( 123, null, false, {}, [], baselineRef );

		expect( result ).toBeNull();
		expect( baselineRef.current ).toBeNull();
	} );

	it( 'returns null when isSyncing is true', () => {
		const baselineRef = { current: null };
		const result = captureBaseline( 123, { content: { raw: '...' } }, true, {}, [], baselineRef );

		expect( result ).toBeNull();
		expect( baselineRef.current ).toBeNull();
	} );

	it( 'captures baseline on first call with valid params', () => {
		const expectedSerialized = '<!-- wp:jetpack/contact-form {"to":"test@example.com"} /-->';
		mockSerialize.mockReturnValue( expectedSerialized );

		const baselineRef = { current: null };
		const attributes = { to: 'test@example.com' };
		const innerBlocks = [];

		const result = captureBaseline(
			123,
			{ content: { raw: '...' } },
			false,
			attributes,
			innerBlocks,
			baselineRef
		);

		expect( result ).toBe( expectedSerialized );
		expect( baselineRef.current ).toEqual( {
			ref: 123,
			serialized: expectedSerialized,
		} );
	} );

	it( 'returns cached baseline for same ref', () => {
		const cachedSerialized = '<!-- wp:jetpack/contact-form {"cached":true} /-->';
		const baselineRef = { current: { ref: 123, serialized: cachedSerialized } };

		const result = captureBaseline(
			123,
			{ content: { raw: '...' } },
			false,
			{ to: 'new@example.com' },
			[],
			baselineRef
		);

		expect( result ).toBe( cachedSerialized );
		// Should not have called serialize again
		expect( mockSerialize ).not.toHaveBeenCalled();
	} );

	it( 'recaptures baseline when ref changes', () => {
		const oldSerialized = '<!-- wp:jetpack/contact-form {"old":true} /-->';
		const newSerialized = '<!-- wp:jetpack/contact-form {"new":true} /-->';
		mockSerialize.mockReturnValue( newSerialized );

		const baselineRef = { current: { ref: 100, serialized: oldSerialized } };

		const result = captureBaseline(
			200,
			{ content: { raw: '...' } },
			false,
			{ new: true },
			[],
			baselineRef
		);

		expect( result ).toBe( newSerialized );
		expect( baselineRef.current ).toEqual( {
			ref: 200,
			serialized: newSerialized,
		} );
	} );
} );

describe( 'stageFormEdits', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'calls editEntityRecord with correct parameters', () => {
		const mockFormBlock = { name: 'jetpack/contact-form', attributes: {} };
		const serializedContent = '<!-- wp:jetpack/contact-form {"to":"test@example.com"} /-->';

		mockCreateBlock.mockReturnValue( mockFormBlock );
		mockSerialize.mockReturnValue( serializedContent );

		const mockEditEntityRecord = jest.fn();
		const attributes = { to: 'test@example.com', ref: 123 };
		const innerBlocks = [ { name: 'jetpack/field-name' } ];

		stageFormEdits( 123, attributes, innerBlocks, mockEditEntityRecord );

		expect( mockEditEntityRecord ).toHaveBeenCalledWith( 'postType', 'jetpack_form', 123, {
			content: serializedContent,
			blocks: [ mockFormBlock ],
		} );
	} );

	it( 'creates form block with ref attribute removed', () => {
		const mockEditEntityRecord = jest.fn();
		const attributes = { to: 'test@example.com', ref: 456, subject: 'Test' };
		const innerBlocks = [];

		mockCreateBlock.mockReturnValue( { name: 'jetpack/contact-form' } );
		mockSerialize.mockReturnValue( '...' );

		stageFormEdits( 456, attributes, innerBlocks, mockEditEntityRecord );

		// Check that createBlock was called without ref
		expect( mockCreateBlock ).toHaveBeenCalledWith(
			'jetpack/contact-form',
			{ to: 'test@example.com', subject: 'Test' },
			innerBlocks
		);
	} );

	it( 'passes inner blocks to createBlock', () => {
		const mockEditEntityRecord = jest.fn();
		const innerBlocks = [
			{ name: 'jetpack/field-name' },
			{ name: 'jetpack/field-email' },
			{ name: 'jetpack/button' },
		];

		mockCreateBlock.mockReturnValue( { name: 'jetpack/contact-form' } );
		mockSerialize.mockReturnValue( '...' );

		stageFormEdits( 123, {}, innerBlocks, mockEditEntityRecord );

		expect( mockCreateBlock ).toHaveBeenCalledWith( 'jetpack/contact-form', {}, innerBlocks );
	} );

	it( 'stages both content and blocks for form editor pickup', () => {
		const mockFormBlock = { name: 'jetpack/contact-form', innerBlocks: [] };
		const serialized = '<!-- wp:jetpack/contact-form /-->';

		mockCreateBlock.mockReturnValue( mockFormBlock );
		mockSerialize.mockReturnValue( serialized );

		const mockEditEntityRecord = jest.fn();

		stageFormEdits( 789, {}, [], mockEditEntityRecord );

		const [ , , , edits ] = mockEditEntityRecord.mock.calls[ 0 ];
		expect( edits ).toHaveProperty( 'content', serialized );
		expect( edits ).toHaveProperty( 'blocks' );
		expect( edits.blocks ).toEqual( [ mockFormBlock ] );
	} );
} );

describe( 'useSyncedFormAutoSave', () => {
	// Serialize enough of the block for a `required` flip to change the string.
	const serializeFake = block =>
		JSON.stringify( ( block.innerBlocks || [] ).map( b => [ b.name, b.attributes ] ) );
	const field = required => ( {
		name: 'jetpack/field-name',
		attributes: { required },
		innerBlocks: [],
	} );
	// Referentially stable across renders, exactly like the real block attributes and
	// entity record. Fresh literals would re-run the effect on every render and hide
	// whether it re-runs for the right reason.
	const FORM_ATTRIBUTES = {};
	const SYNCED_FORM = { content: { raw: 'x' } };

	beforeEach( () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockCreateBlock.mockImplementation( ( name, attributes, innerBlocks ) => ( {
			name,
			attributes,
			innerBlocks,
		} ) );
		mockSerialize.mockImplementation( serializeFake );
	} );

	/**
	 * Render the hook with everything but the blocks and the sync generation fixed.
	 *
	 * @param {object} isSyncingRef     - The loader's syncing flag.
	 * @param {object} editEntityRecord - Spy standing in for the entity store dispatch.
	 * @return {object} The renderHook result.
	 */
	const renderAutoSave = ( isSyncingRef, editEntityRecord ) =>
		renderHook(
			( { currentInnerBlocks, syncGeneration } ) =>
				useSyncedFormAutoSave( {
					ref: 123,
					syncedForm: SYNCED_FORM,
					attributes: FORM_ATTRIBUTES,
					currentInnerBlocks,
					isSyncingRef,
					syncGeneration,
					editEntityRecord,
				} ),
			{ initialProps: { currentInnerBlocks: [], syncGeneration: 0 } }
		);

	/**
	 * Drive the hook through a synced form load, leaving it ready for edits.
	 *
	 * @return {object} The `editEntityRecord` spy and an `edit` helper.
	 */
	const loadForm = () => {
		const editEntityRecord = jest.fn();
		const isSyncingRef = { current: true };
		const { rerender } = renderAutoSave( isSyncingRef, editEntityRecord );
		// One array, passed to both renders below. The blocks do not change when syncing
		// ends, so if the generation bump is not what re-runs the effect, nothing is —
		// a fresh array here would re-run it on identity alone and the test would pass
		// against the bug it exists to catch.
		const loadedBlocks = [ field( false ) ];

		// The loader lands the synced inner blocks while syncing is still in progress.
		rerender( { currentInnerBlocks: loadedBlocks, syncGeneration: 0 } );

		// requestAnimationFrame fires: the flag clears without a render, and the
		// generation bump supplies the render it could not.
		isSyncingRef.current = false;
		rerender( { currentInnerBlocks: loadedBlocks, syncGeneration: 1 } );

		return {
			editEntityRecord,
			edit: currentInnerBlocks => {
				rerender( { currentInnerBlocks, syncGeneration: 1 } );
				act( () => {
					jest.advanceTimersByTime( 1000 );
				} );
			},
		};
	};

	it( 'stages the first edit made after the form loads', () => {
		const { editEntityRecord, edit } = loadForm();

		// Flipping "Field is required" is a single atomic change — it used to be
		// swallowed into the baseline and silently dropped.
		edit( [ field( true ) ] );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'jetpack_form',
			123,
			expect.objectContaining( { content: expect.any( String ) } )
		);
	} );

	it( 'stages subsequent edits too', () => {
		const { editEntityRecord, edit } = loadForm();

		edit( [ field( true ) ] );
		edit( [ field( true ), field( false ) ] );

		expect( editEntityRecord ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not stage while the form is still syncing', () => {
		const editEntityRecord = jest.fn();
		const isSyncingRef = { current: true };
		const { rerender } = renderAutoSave( isSyncingRef, editEntityRecord );

		rerender( { currentInnerBlocks: [ field( false ) ], syncGeneration: 0 } );
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );
} );
