/**
 * Tests for ConvertFormToolbar component
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock functions
const mockCreateSyncedForm = jest.fn();
const mockUpdateBlockAttributes = jest.fn();
const mockReplaceInnerBlocks = jest.fn();
const mockLockPostSaving = jest.fn();
const mockUnlockPostSaving = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockOnNavigateToEntityRecord = jest.fn();
const mockAddQueryArgs = jest.fn(
	( base, args ) => `${ base }?post=${ args.post }&action=${ args.action }`
);
const mockGetFormEditUrl = jest.fn(
	( formId, adminUrl ) => `${ adminUrl ?? '' }post.php?post=${ formId }&action=edit`
);

let mockIsLocked = false;
let mockEditorContext = 'post';

// Mock WordPress dependencies
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	ToolbarGroup: ( { children } ) => <div data-testid="toolbar-group">{ children }</div>,
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
await jest.unstable_mockModule( '@wordpress/url', () => ( { addQueryArgs: mockAddQueryArgs } ) );
await jest.unstable_mockModule( '../../../../src/dashboard/utils', () => ( {
	getFormEditUrl: mockGetFormEditUrl,
} ) );

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
			if ( store === 'core/edit-widgets' ) {
				return {
					getParentWidgetAreaBlock: () => ( { attributes: { name: 'Footer Widget Area' } } ),
				};
			}
			return undefined;
		} )
	),
	useDispatch: jest.fn( () => ( {
		replaceInnerBlocks: mockReplaceInnerBlocks,
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

await jest.unstable_mockModule(
	'../../../../src/blocks/contact-form/util/get-editor-context',
	() => ( {
		getEditorContext: () => mockEditorContext,
	} )
);

const { ConvertFormToolbar } = await import(
	'../../../../src/blocks/contact-form/components/convert-form-toolbar'
);
const { navigateToForm } = await import(
	'../../../../src/blocks/contact-form/util/navigate-to-form'
);

describe( 'ConvertFormToolbar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsLocked = false;
		mockEditorContext = 'post';
	} );

	describe( 'rendering', () => {
		it( 'renders Edit Form button', () => {
			render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
			expect( screen.getByText( 'Edit Form' ) ).toBeInTheDocument();
		} );

		it( 'disables button when editor is locked and form is not synced', () => {
			mockIsLocked = true;
			render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
			expect( screen.getByRole( 'button' ) ).toBeDisabled();
		} );

		it( 'does not disable button when form is already synced (has ref)', () => {
			mockIsLocked = true;
			render( <ConvertFormToolbar clientId="test-id" attributes={ { ref: 456 } } /> );
			expect( screen.getByRole( 'button' ) ).toBeEnabled();
		} );
	} );

	describe( 'post editor context', () => {
		beforeEach( () => {
			mockEditorContext = 'post';
		} );

		it( 'navigates to form using onNavigateToEntityRecord when clicking edit on synced form', async () => {
			render( <ConvertFormToolbar clientId="test-id" attributes={ { ref: 456 } } /> );
			await userEvent.click( screen.getByRole( 'button' ) );

			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalledWith( {
				postId: 456,
				postType: 'jetpack_form',
			} );
		} );

		it( 'calls onBeforeNavigate before navigating to synced form', async () => {
			const mockOnBeforeNavigate = jest.fn();
			render(
				<ConvertFormToolbar
					clientId="test-id"
					attributes={ { ref: 456 } }
					onBeforeNavigate={ mockOnBeforeNavigate }
				/>
			);
			await userEvent.click( screen.getByRole( 'button' ) );

			expect( mockOnBeforeNavigate ).toHaveBeenCalled();
			expect( mockOnNavigateToEntityRecord ).toHaveBeenCalled();
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
	} );

	describe( 'site editor context', () => {
		beforeEach( () => {
			mockEditorContext = 'site';
		} );

		it( 'navigates via URL when clicking edit on synced form', async () => {
			render( <ConvertFormToolbar clientId="test-id" attributes={ { ref: 456 } } /> );
			await userEvent.click( screen.getByRole( 'button' ) );

			expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 456 );
			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
			// jsdom logs an error for unimplemented navigation
			expect( console ).toHaveErrored();
		} );

		it( 'creates synced form and navigates via URL on convert', async () => {
			mockCreateSyncedForm.mockResolvedValue( 789 );

			render( <ConvertFormToolbar clientId="test-id" attributes={ { to: 'test@example.com' } } /> );
			await userEvent.click( screen.getByRole( 'button' ) );

			await waitFor( () => {
				expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 789 );
			} );

			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
			expect( mockLockPostSaving ).toHaveBeenCalled();
			expect( mockUnlockPostSaving ).toHaveBeenCalled();
			// jsdom logs an error for unimplemented navigation
			expect( console ).toHaveErrored();
		} );
	} );

	describe( 'widget editor context', () => {
		beforeEach( () => {
			mockEditorContext = 'widget';
		} );

		it( 'navigates via URL when clicking edit on synced form', async () => {
			render( <ConvertFormToolbar clientId="test-id" attributes={ { ref: 456 } } /> );
			await userEvent.click( screen.getByRole( 'button' ) );

			expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 456 );
			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
			// jsdom logs an error for unimplemented navigation
			expect( console ).toHaveErrored();
		} );

		it( 'creates synced form and navigates via URL on convert', async () => {
			mockCreateSyncedForm.mockResolvedValue( 789 );

			render( <ConvertFormToolbar clientId="test-id" attributes={ { to: 'test@example.com' } } /> );
			await userEvent.click( screen.getByRole( 'button' ) );

			await waitFor( () => {
				expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 789 );
			} );

			expect( mockOnNavigateToEntityRecord ).not.toHaveBeenCalled();
			expect( mockLockPostSaving ).toHaveBeenCalled();
			expect( mockUnlockPostSaving ).toHaveBeenCalled();
			// jsdom logs an error for unimplemented navigation
			expect( console ).toHaveErrored();
		} );

		it( 'button is not disabled even when locked (widget editor has no lock)', () => {
			mockIsLocked = true; // This should be ignored in widget context
			render( <ConvertFormToolbar clientId="test-id" attributes={ {} } /> );
			// In widget editor, isLocked is always false, so button should be enabled
			expect( screen.getByRole( 'button' ) ).toBeEnabled();
		} );
	} );

	describe( 'error handling', () => {
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
} );

describe( 'navigateToForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'uses onNavigateToEntityRecord in post context when available', () => {
		const mockNavigate = jest.fn();
		navigateToForm( 123, 'post', mockNavigate );

		expect( mockNavigate ).toHaveBeenCalledWith( {
			postId: 123,
			postType: 'jetpack_form',
		} );
		expect( mockGetFormEditUrl ).not.toHaveBeenCalled();
	} );

	it( 'does nothing in post context when onNavigateToEntityRecord is not available', () => {
		navigateToForm( 123, 'post', undefined );

		expect( mockGetFormEditUrl ).not.toHaveBeenCalled();
	} );

	it( 'navigates via URL in site editor context', () => {
		const mockNavigate = jest.fn();
		navigateToForm( 123, 'site', mockNavigate );

		expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 123 );
		expect( mockNavigate ).not.toHaveBeenCalled();
		// jsdom logs an error for unimplemented navigation
		expect( console ).toHaveErrored();
	} );

	it( 'navigates via URL in widget editor context', () => {
		const mockNavigate = jest.fn();
		navigateToForm( 123, 'widget', mockNavigate );

		expect( mockGetFormEditUrl ).toHaveBeenCalledWith( 123 );
		expect( mockNavigate ).not.toHaveBeenCalled();
		// jsdom logs an error for unimplemented navigation
		expect( console ).toHaveErrored();
	} );
} );
