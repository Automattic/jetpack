/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// Mock dependencies
await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: jest.fn( () => Promise.resolve( { deleted: 5 } ) ),
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	default: {
		tracks: {
			recordEvent: jest.fn(),
		},
	},
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/store', () => ( {
	store: 'dashboard',
} ) );

// Mock useInboxData
await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-inbox-data', () => ( {
	default: jest.fn( () => ( {
		totalItemsSpam: 5,
		selectedResponsesCount: 0,
		currentQuery: { status: 'spam' },
	} ) ),
} ) );

// Selected IDs the store selector returns. Tests mutate this to change scope.
let selectedIdsFromStore = [];

// Mock WordPress data
await jest.unstable_mockModule( '@wordpress/data', () => {
	const mockDispatch = {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		invalidateResolutionForStoreSelector: jest.fn(),
		invalidateCounts: jest.fn(),
	};

	return {
		useDispatch: jest.fn( store => {
			if ( store === 'notices' ) {
				return {
					createSuccessNotice: mockDispatch.createSuccessNotice,
					createErrorNotice: mockDispatch.createErrorNotice,
				};
			}
			if ( store === 'core' ) {
				return {
					invalidateResolutionForStoreSelector: mockDispatch.invalidateResolutionForStoreSelector,
				};
			}
			if ( store === 'dashboard' ) {
				return { invalidateCounts: mockDispatch.invalidateCounts };
			}
			return {};
		} ),
		useSelect: jest.fn( mapper =>
			mapper( () => ( {
				getSelectedResponsesFromCurrentDataset: () => selectedIdsFromStore,
			} ) )
		),
	};
} );

// Import the hook after mocks are set up
const useEmptySpamModule = await import( '../../../../src/dashboard/hooks/use-empty-spam' );
const useEmptySpam = useEmptySpamModule.default;
const useInboxDataModule = await import( '../../../../src/dashboard/hooks/use-inbox-data' );
const apiFetchModule = await import( '@wordpress/api-fetch' );
const analyticsModule = await import( '@automattic/jetpack-analytics' );
const { useDispatch } = await import( '@wordpress/data' );

describe( 'useEmptySpam', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		selectedIdsFromStore = [];
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 5,
			selectedResponsesCount: 0,
			currentQuery: { status: 'spam' },
		} );
		apiFetchModule.default.mockImplementation( () => Promise.resolve( { deleted: 5 } ) );
	} );

	it( 'returns initial state in `all` scope', () => {
		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.isConfirmDialogOpen ).toBe( false );
		expect( result.current.isEmpty ).toBe( false );
		expect( result.current.isEmptying ).toBe( false );
		expect( result.current.totalItemsSpam ).toBe( 5 );
		expect( result.current.scope.mode ).toBe( 'all' );
		expect( result.current.scope.count ).toBe( 5 );
		expect( result.current.scope.params ).toEqual( {} );
	} );

	it( 'reports selection scope when responses are selected', () => {
		selectedIdsFromStore = [ 11, 22, '33' ];
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 5,
			selectedResponsesCount: 3,
			currentQuery: { status: 'spam', search: 'ignored-because-selection-wins' },
		} );

		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.scope.mode ).toBe( 'selection' );
		expect( result.current.scope.count ).toBe( 3 );
		expect( result.current.scope.params ).toEqual( { post_ids: [ 11, 22, 33 ] } );
	} );

	it( 'reports filtered scope when filters are active and no selection', () => {
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 42,
			selectedResponsesCount: 0,
			currentQuery: {
				status: 'spam',
				search: 'viagra',
				source: 99,
				is_unread: true,
			},
		} );

		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.scope.mode ).toBe( 'filtered' );
		expect( result.current.scope.count ).toBe( 42 );
		expect( result.current.scope.params ).toEqual( {
			search: 'viagra',
			source: 99,
			is_unread: true,
		} );
	} );

	it( 'marks as empty when scope count is 0', () => {
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 0,
			selectedResponsesCount: 0,
			currentQuery: {},
		} );

		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.isEmpty ).toBe( true );
	} );

	it( 'opens and closes confirmation dialog', () => {
		const { result } = renderHook( () => useEmptySpam() );

		act( () => {
			result.current.openConfirmDialog();
		} );
		expect( result.current.isConfirmDialogOpen ).toBe( true );

		act( () => {
			result.current.closeConfirmDialog();
		} );
		expect( result.current.isConfirmDialogOpen ).toBe( false );
	} );

	it( 'calls DELETE /trash with filter params and shows success notice', async () => {
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 5,
			selectedResponsesCount: 0,
			currentQuery: { status: 'spam', search: 'spammy' },
		} );

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		expect( analyticsModule.default.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_forms_empty_spam_click',
			expect.objectContaining( { scope: 'filtered', count: 5 } )
		);

		await waitFor( () => {
			expect( apiFetchModule.default ).toHaveBeenCalledWith( {
				method: 'DELETE',
				path: '/wp/v2/feedback/trash',
				data: { status: 'spam', search: 'spammy' },
			} );
		} );

		const noticesDispatch = useDispatch( 'notices' );
		await waitFor( () => {
			expect( noticesDispatch.createSuccessNotice ).toHaveBeenCalledWith(
				expect.stringContaining( 'deleted permanently' ),
				{ type: 'snackbar', id: 'empty-spam' }
			);
		} );
	} );

	it( 'calls DELETE /trash with post_ids when items are selected', async () => {
		selectedIdsFromStore = [ 1, 2, 3 ];

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		expect( analyticsModule.default.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_forms_empty_spam_click',
			expect.objectContaining( { scope: 'selection', count: 3 } )
		);

		await waitFor( () => {
			expect( apiFetchModule.default ).toHaveBeenCalledWith( {
				method: 'DELETE',
				path: '/wp/v2/feedback/trash',
				data: { status: 'spam', post_ids: [ 1, 2, 3 ] },
			} );
		} );
	} );

	it( 'shows error notice when delete fails', async () => {
		apiFetchModule.default.mockImplementationOnce( () => Promise.reject( new Error( 'fail' ) ) );

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		const noticesDispatch = useDispatch( 'notices' );
		await waitFor( () => {
			expect( noticesDispatch.createErrorNotice ).toHaveBeenCalledWith( 'Could not empty spam.', {
				type: 'snackbar',
				id: 'empty-spam-error',
			} );
		} );
	} );

	it( 'does not call API when scope count is 0', async () => {
		useInboxDataModule.default.mockReturnValue( {
			totalItemsSpam: 0,
			selectedResponsesCount: 0,
			currentQuery: {},
		} );

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		expect( apiFetchModule.default ).not.toHaveBeenCalled();
	} );

	it( 'uses provided totalItemsSpam prop over hook data', () => {
		const { result } = renderHook( () => useEmptySpam( { totalItemsSpam: 10 } ) );

		expect( result.current.totalItemsSpam ).toBe( 10 );
		expect( result.current.scope.count ).toBe( 10 );
	} );
} );
