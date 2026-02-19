/**
 * Tests for form-sync utility functions
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock WordPress dependencies before importing
const mockCreateBlock = jest.fn();
const mockSerialize = jest.fn();

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: mockCreateBlock,
	serialize: mockSerialize,
} ) );

const { filterSyncedAttributes, serializeSyncedForm, createSyncedFormBlock } = await import(
	'../../../src/blocks/contact-form/util/form-sync.ts'
);

describe( 'filterSyncedAttributes', () => {
	it( 'removes layout attributes and ref', () => {
		const attributes = {
			className: 'my-class',
			align: 'wide',
			style: { color: 'red' },
			ref: 123,
			lock: { move: true, remove: false },
			to: 'test@example.com',
			subject: 'Test Subject',
		};

		const result = filterSyncedAttributes( attributes );

		expect( result.className ).toBeUndefined();
		expect( result.align ).toBeUndefined();
		expect( result.style ).toBeUndefined();
		expect( result.ref ).toBeUndefined();
		expect( result.lock ).toBeUndefined();
		expect( result.to ).toBe( 'test@example.com' );
		expect( result.subject ).toBe( 'Test Subject' );
	} );

	it( 'preserves form-specific attributes', () => {
		const attributes = {
			to: 'test@example.com',
			subject: 'Test Subject',
			customThankyouMessage: 'Thanks!',
			emailNotifications: true,
		};

		const result = filterSyncedAttributes( attributes );

		expect( result.to ).toBe( 'test@example.com' );
		expect( result.subject ).toBe( 'Test Subject' );
		expect( result.customThankyouMessage ).toBe( 'Thanks!' );
		expect( result.emailNotifications ).toBe( true );
	} );

	it( 'does not mutate original attributes object', () => {
		const attributes = {
			ref: 123,
			to: 'test@example.com',
		};

		const result = filterSyncedAttributes( attributes );

		expect( attributes.ref ).toBe( 123 );
		expect( result.ref ).toBeUndefined();
	} );

	it( 'handles empty attributes', () => {
		const result = filterSyncedAttributes( {} );
		expect( result ).toEqual( {} );
	} );
} );

describe( 'createSyncedFormBlock', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCreateBlock.mockReturnValue( { name: 'jetpack/contact-form' } );
	} );

	it( 'creates a block without the ref attribute', () => {
		const attributes = { ref: 123, to: 'test@example.com' };
		const innerBlocks = [ { name: 'jetpack/field-name' } ];

		createSyncedFormBlock( attributes, innerBlocks );

		expect( mockCreateBlock ).toHaveBeenCalledWith(
			'jetpack/contact-form',
			{ to: 'test@example.com' },
			innerBlocks
		);
	} );

	it( 'creates a block without the lock attribute', () => {
		const attributes = { lock: { move: true, remove: true }, to: 'test@example.com' };

		createSyncedFormBlock( attributes, [] );

		expect( mockCreateBlock ).toHaveBeenCalledWith(
			'jetpack/contact-form',
			{ to: 'test@example.com' },
			[]
		);
	} );

	it( 'preserves all non-ref attributes', () => {
		const attributes = {
			ref: 456,
			to: 'admin@example.com',
			subject: 'Contact Form',
			jetpackCRM: true,
		};

		createSyncedFormBlock( attributes, [] );

		expect( mockCreateBlock ).toHaveBeenCalledWith(
			'jetpack/contact-form',
			{
				to: 'admin@example.com',
				subject: 'Contact Form',
				jetpackCRM: true,
			},
			[]
		);
	} );

	it( 'returns the created block', () => {
		const mockBlock = { name: 'jetpack/contact-form', attributes: {} };
		mockCreateBlock.mockReturnValue( mockBlock );

		const result = createSyncedFormBlock( {}, [] );

		expect( result ).toBe( mockBlock );
	} );
} );

describe( 'serializeSyncedForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCreateBlock.mockReturnValue( { name: 'jetpack/contact-form' } );
		mockSerialize.mockReturnValue( '<!-- wp:jetpack/contact-form /-->' );
	} );

	it( 'serializes the form block without ref', () => {
		const attributes = { ref: 123, to: 'test@example.com' };
		const innerBlocks = [];

		serializeSyncedForm( attributes, innerBlocks );

		expect( mockCreateBlock ).toHaveBeenCalledWith(
			'jetpack/contact-form',
			{ to: 'test@example.com' },
			innerBlocks
		);
		expect( mockSerialize ).toHaveBeenCalled();
	} );

	it( 'returns serialized content', () => {
		const expectedContent = '<!-- wp:jetpack/contact-form {"to":"test@example.com"} /-->';
		mockSerialize.mockReturnValue( expectedContent );

		const result = serializeSyncedForm( { to: 'test@example.com' }, [] );

		expect( result ).toBe( expectedContent );
	} );

	it( 'passes inner blocks to createBlock', () => {
		const innerBlocks = [ { name: 'jetpack/field-name' }, { name: 'jetpack/field-email' } ];

		serializeSyncedForm( {}, innerBlocks );

		expect( mockCreateBlock ).toHaveBeenCalledWith( 'jetpack/contact-form', {}, innerBlocks );
	} );
} );
