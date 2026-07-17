/**
 * Tests for synced form auto-save helper functions
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock WordPress dependencies before importing
const mockCreateBlock = jest.fn();
const mockSerialize = jest.fn();

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: mockCreateBlock,
	serialize: mockSerialize,
} ) );

const { captureBaseline, stageFormEdits } = await import(
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
