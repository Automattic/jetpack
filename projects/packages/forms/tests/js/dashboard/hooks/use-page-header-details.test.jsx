/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// ── Mock external dependencies ──────────────────────────────────────────────

const mockUseViewportMatch = jest.fn( () => false );
await jest.unstable_mockModule( '@wordpress/compose', () => ( {
	useViewportMatch: mockUseViewportMatch,
} ) );
await jest.unstable_mockModule( '@automattic/jetpack-components/jetpack-logo', () => ( {
	default: () => null,
} ) );

await jest.unstable_mockModule( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items } ) => items.map( item => item.label ).join( ' > ' ),
} ) );

await jest.unstable_mockModule( '@wordpress/components', () => ( {
	DropdownMenu: () => null,
	Button: ( { children } ) => children,
	__experimentalConfirmDialog: ( { children } ) => children,
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/html-entities', () => ( {
	decodeEntities: jest.fn( str => str ),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( str => str ),
	sprintf: jest.fn( ( format, ...args ) => {
		let result = format;
		args.forEach( arg => {
			result = result.replace( '%s', arg );
		} );
		return result;
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/icons', () => ( {
	moreVertical: 'moreVertical',
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

const mockNavigate = jest.fn();
await jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
} ) );

await jest.unstable_mockModule( '@wordpress/ui', () => ( {
	Badge: ( { children } ) => children,
	Stack: ( { children } ) => children,
} ) );

// ── Mock internal dependencies ──────────────────────────────────────────────

await jest.unstable_mockModule( '../../../../src/blocks/shared/util/constants.js', () => ( {
	FORM_POST_TYPE: 'jetpack_form',
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/components/create-form-button', () => ( {
	default: () => null,
} ) );
await jest.unstable_mockModule( '../../../../src/dashboard/components/edit-form-button', () => ( {
	default: () => null,
} ) );
await jest.unstable_mockModule( '../../../../src/dashboard/components/empty-spam-button', () => ( {
	default: () => null,
} ) );
await jest.unstable_mockModule(
	'../../../../src/dashboard/components/empty-spam-button/confirmation-modal',
	() => ( { default: () => null } )
);
await jest.unstable_mockModule( '../../../../src/dashboard/components/empty-trash-button', () => ( {
	default: () => null,
} ) );
await jest.unstable_mockModule(
	'../../../../src/dashboard/components/empty-trash-button/confirmation-modal',
	() => ( { default: () => null } )
);
await jest.unstable_mockModule(
	'../../../../src/dashboard/components/export-responses/button',
	() => ( { default: () => null } )
);
await jest.unstable_mockModule(
	'../../../../src/dashboard/components/export-responses/modal',
	() => ( { default: () => null } )
);
await jest.unstable_mockModule( '../../../../src/dashboard/components/form-name-modal', () => ( {
	FormNameModal: () => null,
} ) );
await jest.unstable_mockModule(
	'../../../../src/dashboard/wp-build/components/manage-integrations-button',
	() => ( { default: () => null } )
);

await jest.unstable_mockModule( '../../../../src/dashboard/constants', () => ( {
	getFormStatusLabel: jest.fn( status => status ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-create-form', () => ( {
	default: () => ( { openNewForm: jest.fn() } ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-empty-spam', () => ( {
	default: () => ( {
		openConfirmDialog: jest.fn(),
		closeConfirmDialog: jest.fn(),
		onConfirmEmptying: jest.fn(),
		isEmpty: false,
		isEmptying: false,
		isConfirmDialogOpen: false,
		totalItemsSpam: 0,
		selectedResponsesCount: 0,
	} ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-empty-trash', () => ( {
	default: () => ( {
		openConfirmDialog: jest.fn(),
		closeConfirmDialog: jest.fn(),
		onConfirmEmptying: jest.fn(),
		isEmpty: false,
		isEmptying: false,
		isConfirmDialogOpen: false,
		totalItemsTrash: 0,
		selectedResponsesCount: 0,
	} ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-export-responses', () => ( {
	default: () => ( {
		showExportModal: false,
		openModal: jest.fn(),
		closeModal: jest.fn(),
		onExport: jest.fn(),
		autoConnectGdrive: false,
		exportLabel: 'Export',
	} ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-inbox-data', () => ( {
	default: () => ( { totalItems: 10, isLoadingData: false } ),
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/store/index.js', () => ( {
	store: 'dashboard',
} ) );

// ── Mock @wordpress/data (core mock with configurable form record) ──────────

const mockSaveEntityRecord = jest.fn( () => Promise.resolve() );
const mockDeleteEntityRecord = jest.fn( () => Promise.resolve() );
const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockInvalidateFormStatusCounts = jest.fn();

const mockDuplicateForm = jest.fn();
const mockPreviewForm = jest.fn();
const mockCopyEmbed = jest.fn();
const mockCopyShortcode = jest.fn();
const mockPublishForms = jest.fn();
const mockSetFormsToDraft = jest.fn();

let mockFormRecord = { title: { rendered: 'My Form' }, status: 'publish' };

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	createReduxStore: jest.fn( () => 'mock-store' ),
	register: jest.fn(),
	useSelect: jest.fn( callback => {
		const fakeSelect = () => ( {
			getEntityRecord: () => mockFormRecord,
			getConfig: () => ( {} ),
		} );
		return callback( fakeSelect );
	} ),
	useDispatch: jest.fn( store => {
		if ( store === 'core' ) {
			return {
				saveEntityRecord: mockSaveEntityRecord,
				deleteEntityRecord: mockDeleteEntityRecord,
			};
		}
		if ( store === 'notices' ) {
			return {
				createSuccessNotice: mockCreateSuccessNotice,
				createErrorNotice: mockCreateErrorNotice,
			};
		}
		if ( store === 'dashboard' ) {
			return {
				invalidateFormStatusCounts: mockInvalidateFormStatusCounts,
			};
		}
		return {};
	} ),
} ) );

await jest.unstable_mockModule(
	'../../../../src/dashboard/wp-build/hooks/use-form-item-actions',
	() => ( {
		default: () => ( {
			duplicateForm: mockDuplicateForm,
			previewForm: mockPreviewForm,
			copyEmbed: mockCopyEmbed,
			copyShortcode: mockCopyShortcode,
			publishForms: mockPublishForms,
			setFormsToDraft: mockSetFormsToDraft,
			isDuplicating: false,
			isUpdatingStatus: false,
		} ),
	} )
);

// ── Import hook under test (after all mocks) ────────────────────────────────

const usePageHeaderDetailsModule = await import(
	'../../../../src/dashboard/wp-build/hooks/use-page-header-details'
);
const usePageHeaderDetails = usePageHeaderDetailsModule.default;

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
	screen: 'responses',
	statusView: 'inbox',
	sourceId: 42,
	isIntegrationsEnabled: false,
	showDashboardIntegrations: false,
	onOpenIntegrations: jest.fn(),
};

/**
 * Extract dropdown control titles from the hook result's actions array.
 *
 * @param {object} result - The renderHook result ref.
 * @return {string[]} Array of control title strings.
 */
function getControlTitles( result ) {
	// Actions is an array of React elements; find the DropdownMenu and extract its controls prop.
	const actions = result.current.actions;
	if ( ! actions || ! Array.isArray( actions ) ) {
		return [];
	}
	for ( const action of actions ) {
		if ( action?.props?.controls ) {
			return action.props.controls.map( c => c.title );
		}
	}
	return [];
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe( 'usePageHeaderDetails', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockFormRecord = { title: { rendered: 'My Form' }, status: 'publish' };
		mockUseViewportMatch.mockReturnValue( false ); // Desktop
	} );

	describe( 'return shape', () => {
		it( 'returns expected keys', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current ).toHaveProperty( 'ariaLabel' );
			expect( result.current ).toHaveProperty( 'breadcrumbs' );
			expect( result.current ).toHaveProperty( 'title' );
			expect( result.current ).toHaveProperty( 'badges' );
			expect( result.current ).toHaveProperty( 'subtitle' );
			expect( result.current ).toHaveProperty( 'actions' );
		} );
	} );

	describe( 'ariaLabel', () => {
		it( 'returns form title for single form screen', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.ariaLabel ).toBe( 'My Form' );
		} );

		it( 'returns fallback when no form title', () => {
			mockFormRecord = { title: { rendered: '' }, status: 'publish' };
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.ariaLabel ).toBe( 'Form responses' );
		} );

		it( 'returns Jetpack Forms for forms screen', () => {
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, screen: 'forms', sourceId: undefined } )
			);

			expect( result.current.ariaLabel ).toBe( 'Jetpack Forms' );
		} );
	} );

	describe( 'title and breadcrumbs', () => {
		it( 'returns undefined title and non-null breadcrumbs for single form screen', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.title ).toBeUndefined();
			expect( result.current.breadcrumbs ).not.toBeNull();
		} );

		it( 'returns title and null breadcrumbs for forms screen', () => {
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, screen: 'forms', sourceId: undefined } )
			);

			expect( result.current.title ).toBeDefined();
			expect( result.current.breadcrumbs ).toBeNull();
		} );
	} );

	describe( 'subtitle', () => {
		it( 'includes form title for single form screen', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.subtitle ).toContain( 'My Form' );
		} );

		it( 'returns generic message for responses list', () => {
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, sourceId: undefined } )
			);

			expect( result.current.subtitle ).toBe(
				'View and manage all your form responses in one place.'
			);
		} );
	} );

	describe( 'formItemControls order', () => {
		it( 'returns controls in the correct order for a published form', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );
			const titles = getControlTitles( result );

			// navigator.clipboard is undefined in jsdom, so Copy embed/shortcode are excluded.
			expect( titles ).toEqual( [ 'Preview', 'Unpublish', 'Rename', 'Duplicate', 'Trash' ] );
		} );

		it( 'shows Publish instead of Unpublish for draft form', () => {
			mockFormRecord = { title: { rendered: 'Draft Form' }, status: 'draft' };
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );
			const titles = getControlTitles( result );

			expect( titles ).toContain( 'Publish' );
			expect( titles ).not.toContain( 'Unpublish' );
		} );
	} );

	describe( 'trashed form actions', () => {
		it( 'shows only Restore and Delete permanently for trashed forms', () => {
			mockFormRecord = { title: { rendered: 'Trashed Form' }, status: 'trash' };
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, statusView: 'trash' } )
			);
			const titles = getControlTitles( result );

			expect( titles ).toEqual( [ 'Restore', 'Delete permanently' ] );
		} );

		it( 'calls saveEntityRecord with publish status on restore and stays on page', async () => {
			mockFormRecord = { title: { rendered: 'Trashed Form' }, status: 'trash' };
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, statusView: 'trash' } )
			);
			const controls = result.current.actions.find( a => a?.props?.controls )?.props?.controls;

			await act( async () => {
				controls[ 0 ].onClick();
			} );

			await waitFor( () => {
				expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
					'postType',
					'jetpack_form',
					{ id: 42, status: 'publish' },
					{ throwOnError: true }
				);
				expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Form restored.', {
					type: 'snackbar',
				} );
				expect( mockNavigate ).not.toHaveBeenCalled();
			} );
		} );

		it( 'opens confirmation dialog on Delete permanently click', () => {
			mockFormRecord = { title: { rendered: 'Trashed Form' }, status: 'trash' };
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, statusView: 'trash' } )
			);
			const controls = result.current.actions.find( a => a?.props?.controls )?.props?.controls;

			act( () => {
				controls[ 1 ].onClick();
			} );

			// ConfirmDialog should now be rendered in actions
			const confirmDialog = result.current.actions.find(
				a => a?.key === 'permanent-delete-confirm'
			);
			expect( confirmDialog ).toBeTruthy();
			expect( confirmDialog.props.isOpen ).toBe( true );
		} );

		it( 'deletes form after confirming permanent delete', async () => {
			mockFormRecord = { title: { rendered: 'Trashed Form' }, status: 'trash' };
			const { result } = renderHook( () =>
				usePageHeaderDetails( { ...defaultProps, statusView: 'trash' } )
			);
			const controls = result.current.actions.find( a => a?.props?.controls )?.props?.controls;

			// Open the confirmation dialog
			act( () => {
				controls[ 1 ].onClick();
			} );

			// Confirm the deletion
			const confirmDialog = result.current.actions.find(
				a => a?.key === 'permanent-delete-confirm'
			);

			await act( async () => {
				await confirmDialog.props.onConfirm();
			} );

			await waitFor( () => {
				expect( mockDeleteEntityRecord ).toHaveBeenCalledWith(
					'postType',
					'jetpack_form',
					42,
					{ force: true },
					{ throwOnError: true }
				);
				expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Form deleted permanently.', {
					type: 'snackbar',
				} );
				expect( mockNavigate ).toHaveBeenCalledWith( { to: '/forms' } );
			} );
		} );
	} );

	describe( 'badges', () => {
		it( 'returns no badge for published form', () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.badges ).toBeUndefined();
		} );

		it( 'returns a badge for draft form', () => {
			mockFormRecord = { title: { rendered: 'Draft Form' }, status: 'draft' };
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );

			expect( result.current.badges ).toBeDefined();
		} );
	} );

	describe( 'trashForm', () => {
		it( 'calls deleteEntityRecord and navigates to /forms on success', async () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );
			const titles = getControlTitles( result );
			const trashIndex = titles.indexOf( 'Trash' );

			await act( async () => {
				result.current.actions
					.find( a => a?.props?.controls )
					.props.controls[ trashIndex ].onClick();
			} );

			await waitFor( () => {
				expect( mockDeleteEntityRecord ).toHaveBeenCalledWith(
					'postType',
					'jetpack_form',
					42,
					{ force: false },
					{ throwOnError: true }
				);
				expect( mockInvalidateFormStatusCounts ).toHaveBeenCalled();
				expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
					'Form moved to trash.',
					expect.objectContaining( {
						type: 'snackbar',
						actions: expect.arrayContaining( [ expect.objectContaining( { label: 'Undo' } ) ] ),
					} )
				);
				expect( mockNavigate ).toHaveBeenCalledWith( { to: '/forms' } );
			} );
		} );

		it( 'shows error notice when trashing fails', async () => {
			mockDeleteEntityRecord.mockRejectedValueOnce( new Error( 'fail' ) );
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );
			const titles = getControlTitles( result );
			const trashIndex = titles.indexOf( 'Trash' );

			await act( async () => {
				result.current.actions
					.find( a => a?.props?.controls )
					.props.controls[ trashIndex ].onClick();
			} );

			await waitFor( () => {
				expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
					'Failed to move form to trash.',
					expect.objectContaining( { type: 'snackbar' } )
				);
				expect( mockNavigate ).not.toHaveBeenCalled();
			} );

			expect( console ).toHaveErrored();
		} );
	} );

	describe( 'handleRename', () => {
		it( 'calls saveEntityRecord with new title on rename', async () => {
			const { result } = renderHook( () => usePageHeaderDetails( defaultProps ) );
			const titles = getControlTitles( result );
			const renameIndex = titles.indexOf( 'Rename' );

			// Click rename to open modal
			act( () => {
				result.current.actions
					.find( a => a?.props?.controls )
					.props.controls[ renameIndex ].onClick();
			} );

			// The FormNameModal should now be rendered; find it and call onSave
			await waitFor( () => {
				const renameModal = result.current.actions.find( a => a?.key === 'rename-form-modal' );
				expect( renameModal ).toBeTruthy();
			} );

			const renameModal = result.current.actions.find( a => a?.key === 'rename-form-modal' );

			await act( async () => {
				await renameModal.props.onSave( 'New Title' );
			} );

			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'postType',
				'jetpack_form',
				{ id: 42, title: 'New Title' },
				{ throwOnError: true }
			);
			expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Form renamed.', {
				type: 'snackbar',
			} );
		} );
	} );
} );
