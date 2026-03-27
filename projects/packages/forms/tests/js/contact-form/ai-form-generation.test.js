/**
 * Tests for AI form generation plugin
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock functions
const mockGetCurrentPostType = jest.fn();
const mockGetCurrentPostId = jest.fn();
const mockGetEditedPostAttribute = jest.fn();
const mockGetBlock = jest.fn();
const mockUpdateBlockAttributes = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockCreateSyncedForm = jest.fn();
const mockAddAction = jest.fn();
const mockHasAction = jest.fn();

// Mock WordPress modules
await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'editor',
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: store => {
		if ( store === 'editor' ) {
			return {
				getCurrentPostType: mockGetCurrentPostType,
				getCurrentPostId: mockGetCurrentPostId,
				getEditedPostAttribute: mockGetEditedPostAttribute,
			};
		}
		if ( store === 'block-editor' ) {
			return {
				getBlock: mockGetBlock,
			};
		}
		return {};
	},
	dispatch: store => {
		if ( store === 'block-editor' ) {
			return {
				updateBlockAttributes: mockUpdateBlockAttributes,
			};
		}
		if ( store === 'notices' ) {
			return {
				createErrorNotice: mockCreateErrorNotice,
			};
		}
		return {};
	},
} ) );

await jest.unstable_mockModule( '@wordpress/hooks', () => ( {
	addAction: mockAddAction,
	hasAction: mockHasAction,
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: str => str,
} ) );

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/util/create-synced-form',
	() => ( {
		createSyncedForm: mockCreateSyncedForm,
	} )
);

// Import the module under test after mocking
const { handleAiGenerationComplete, initAiFormGenerationIntegration } = await import(
	'../../../src/blocks/contact-form/plugins/ai-form-generation'
);

describe( 'AI Form Generation Plugin', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Default mock implementations
		mockGetCurrentPostType.mockReturnValue( 'post' );
		mockGetCurrentPostId.mockReturnValue( 123 );
		mockGetEditedPostAttribute.mockReturnValue( 'Test Post Title' );
		mockHasAction.mockReturnValue( false );
	} );

	describe( 'handleAiGenerationComplete', () => {
		it( 'should skip non-contact-form blocks', async () => {
			await handleAiGenerationComplete( 'client-123', 'core/paragraph' );

			expect( mockGetBlock ).not.toHaveBeenCalled();
			expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
		} );

		it( 'should skip if already in form editor', async () => {
			mockGetCurrentPostType.mockReturnValue( 'jetpack_form' );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockGetBlock ).not.toHaveBeenCalled();
			expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
		} );

		it( 'should skip if block has no inner blocks', async () => {
			mockGetBlock.mockReturnValue( {
				attributes: {},
				innerBlocks: [],
			} );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
		} );

		it( 'should skip if block is not found', async () => {
			mockGetBlock.mockReturnValue( null );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
		} );

		it( 'should skip if block already has a ref', async () => {
			mockGetBlock.mockReturnValue( {
				attributes: { ref: 456 },
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			} );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).not.toHaveBeenCalled();
		} );

		it( 'should create synced form and set ref attribute', async () => {
			const mockBlock = {
				attributes: { to: 'test@example.com' },
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			};
			mockGetBlock.mockReturnValue( mockBlock );
			mockCreateSyncedForm.mockResolvedValue( 789 );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				{ attributes: mockBlock.attributes, innerBlocks: mockBlock.innerBlocks },
				'Test Post Title',
				123
			);
			expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( 'client-123', { ref: 789 } );
		} );

		it( 'should not set ref if block gained a ref during async form creation', async () => {
			// First call: block has no ref (pre-async)
			// Second call: block gained a ref while createSyncedForm was in flight
			mockGetBlock
				.mockReturnValueOnce( {
					attributes: {},
					innerBlocks: [ { name: 'jetpack/field-text' } ],
				} )
				.mockReturnValueOnce( {
					attributes: { ref: 999 },
					innerBlocks: [ { name: 'jetpack/field-text' } ],
				} );
			mockCreateSyncedForm.mockResolvedValue( 789 );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).toHaveBeenCalled();
			expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should not set ref if block was removed during async form creation', async () => {
			mockGetBlock
				.mockReturnValueOnce( {
					attributes: {},
					innerBlocks: [ { name: 'jetpack/field-text' } ],
				} )
				.mockReturnValueOnce( null );
			mockCreateSyncedForm.mockResolvedValue( 789 );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).toHaveBeenCalled();
			expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should use default title when post title is empty', async () => {
			mockGetBlock.mockReturnValue( {
				attributes: {},
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			} );
			mockGetEditedPostAttribute.mockReturnValue( '' );
			mockCreateSyncedForm.mockResolvedValue( 789 );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockCreateSyncedForm ).toHaveBeenCalledWith(
				expect.anything(),
				'Generated Form',
				123
			);
		} );

		it( 'should not set ref if createSyncedForm returns falsy', async () => {
			mockGetBlock.mockReturnValue( {
				attributes: {},
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			} );
			mockCreateSyncedForm.mockResolvedValue( null );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'should show error notice when createSyncedForm fails', async () => {
			mockGetBlock.mockReturnValue( {
				attributes: {},
				innerBlocks: [ { name: 'jetpack/field-text' } ],
			} );
			const networkError = new Error( 'Network error' );
			mockCreateSyncedForm.mockRejectedValue( networkError );

			await handleAiGenerationComplete( 'client-123', 'jetpack/contact-form' );

			expect( console ).toHaveErrored( 'Failed to create synced form:', networkError );
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Failed to save the Generated form. Your form is still available but not synced.',
				{ type: 'snackbar' }
			);
			expect( mockUpdateBlockAttributes ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'initAiFormGenerationIntegration', () => {
		it( 'should register action hook if not already registered', () => {
			mockHasAction.mockReturnValue( false );

			initAiFormGenerationIntegration();

			expect( mockHasAction ).toHaveBeenCalledWith(
				'jetpack_ai_assistant_generation_complete',
				'jetpack-forms/ai-integration'
			);
			expect( mockAddAction ).toHaveBeenCalledWith(
				'jetpack_ai_assistant_generation_complete',
				'jetpack-forms/ai-integration',
				expect.any( Function )
			);
		} );

		it( 'should not register action hook if already registered', () => {
			mockHasAction.mockReturnValue( true );

			initAiFormGenerationIntegration();

			expect( mockAddAction ).not.toHaveBeenCalled();
		} );
	} );
} );
