/**
 * Tests for ConvertFormToolbar component
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock functions
const mockCreateSyncedForm = jest.fn();
const mockUpdateBlockAttributes = jest.fn();
const mockLockPostSaving = jest.fn();
const mockUnlockPostSaving = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockOnNavigateToEntityRecord = jest.fn();

let mockIsLocked = false;

// Mock WordPress dependencies
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	ToolbarGroup: ( { children } ) => <div>{ children }</div>,
	ToolbarButton: ( { children, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( { __: s => s } ) );
await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );
await jest.unstable_mockModule( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
await jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: jest.fn( callback =>
		callback( store => {
			if ( store === 'core/editor' ) {
				return {
					getEditedPostAttribute: attr => ( attr === 'title' ? 'Test Post' : 123 ),
					isPostSavingLocked: () => mockIsLocked,
				};
			}
			if ( store === 'core/block-editor' ) {
				return {
					getBlock: () => ( { innerBlocks: [] } ),
					getSettings: () => ( { onNavigateToEntityRecord: mockOnNavigateToEntityRecord } ),
				};
			}
			return {};
		} )
	),
	useDispatch: jest.fn( () => ( {
		replaceInnerBlocks: jest.fn(),
		updateBlockAttributes: mockUpdateBlockAttributes,
		lockPostSaving: mockLockPostSaving,
		unlockPostSaving: mockUnlockPostSaving,
		createErrorNotice: mockCreateErrorNotice,
	} ) ),
} ) );

await jest.unstable_mockModule(
	'../../../../src/blocks/contact-form/util/create-synced-form',
	() => ( {
		createSyncedForm: mockCreateSyncedForm,
	} )
);

const { ConvertFormToolbar } = await import(
	'../../../../src/blocks/contact-form/components/convert-form-toolbar'
);

describe( 'ConvertFormToolbar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsLocked = false;
	} );

	it( 'renders Edit Form button', () => {
		render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
		expect( screen.getByText( 'Edit Form' ) ).toBeInTheDocument();
	} );

	it( 'disables button when editor is locked', () => {
		mockIsLocked = true;
		render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
		expect( screen.getByRole( 'button' ) ).toBeDisabled();
	} );

	it( 'navigates to form when clicking edit on synced form', async () => {
		render( <ConvertFormToolbar clientId="test-id" attributes={ { ref: 456 } } /> );
		await userEvent.click( screen.getByRole( 'button' ) );

		expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
			postId: 456,
			postType: 'jetpack_form',
		} );
	} );

	it( 'creates synced form and navigates on convert', async () => {
		mockCreateSyncedForm.mockResolvedValue( 789 );

		render( <ConvertFormToolbar clientId="test-id" attributes={ { to: 'test@example.com' } } /> );
		await userEvent.click( screen.getByRole( 'button' ) );

		await waitFor( () => {
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 789,
				postType: 'jetpack_form',
			} );
		} );

		expect( mockLockPostSaving ).toHaveBeenCalled();
		expect( mockUnlockPostSaving ).toHaveBeenCalled();
	} );

	it( 'shows error notice when conversion fails', async () => {
		mockCreateSyncedForm.mockRejectedValue( new Error( 'API Error' ) );

		render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
		await userEvent.click( screen.getByRole( 'button' ) );

		await waitFor( () => {
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				'Failed to create a form. Please try again.',
				expect.objectContaining( { type: 'snackbar' } )
			);
		} );

		expect( mockUnlockPostSaving ).toHaveBeenCalled();
	} );
} );
