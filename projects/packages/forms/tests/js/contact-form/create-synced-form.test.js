/**
 * Tests for form-sync-manager
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSaveEntityRecord = jest.fn();
const mockSerialize = jest.fn();

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	dispatch: () => ( {
		saveEntityRecord: mockSaveEntityRecord,
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	serialize: mockSerialize,
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

const { createSyncedForm } = await import(
	'../../../src/blocks/contact-form/util/create-synced-form'
);

describe( 'createSyncedForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSerialize.mockReturnValue(
			'<!-- wp:jetpack/contact-form --><!-- /wp:jetpack/contact-form -->'
		);
	} );

	it( 'creates a form post with correct parameters', async () => {
		mockSaveEntityRecord.mockResolvedValue( { id: 42 } );

		const blockData = {
			attributes: { to: 'test@example.com' },
			innerBlocks: [],
		};

		const result = await createSyncedForm( blockData, 'My Form', 123 );

		expect( result ).toBe( 42 );
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'jetpack_form',
			expect.objectContaining( {
				title: 'My Form',
				status: 'publish',
				meta: {
					_jetpack_forms_source_post_id: 123,
				},
			} )
		);
	} );

	it( 'uses default title when none provided', async () => {
		mockSaveEntityRecord.mockResolvedValue( { id: 1 } );

		await createSyncedForm( { attributes: {}, innerBlocks: [] }, '', 456 );

		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'jetpack_form',
			expect.objectContaining( {
				title: 'Untitled Form',
			} )
		);
	} );

	it( 'serializes block data correctly', async () => {
		mockSaveEntityRecord.mockResolvedValue( { id: 1 } );

		const blockData = {
			attributes: { subject: 'Test' },
			innerBlocks: [ { name: 'jetpack/field-text' } ],
		};

		await createSyncedForm( blockData, 'Test Form', 789 );

		expect( mockSerialize ).toHaveBeenCalledWith( [
			{
				name: 'jetpack/contact-form',
				attributes: { subject: 'Test' },
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			},
		] );
	} );

	it( 'should have no meta if currentPostId is invalid', async () => {
		mockSaveEntityRecord.mockResolvedValue( { id: 42 } );

		const blockData = {
			attributes: { to: 'test@example.com' },
			innerBlocks: [],
		};

		const result = await createSyncedForm( blockData, 'My Form', 0 );

		expect( result ).toBe( 42 );
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'jetpack_form',
			expect.objectContaining( {
				title: 'My Form',
				status: 'publish',
				meta: {},
			} )
		);
	} );
} );
