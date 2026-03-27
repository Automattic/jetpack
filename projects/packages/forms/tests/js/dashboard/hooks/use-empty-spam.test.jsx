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
		selectedResponsesCount: 2,
		currentQuery: { status: 'spam' },
	} ) ),
} ) );

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
	};
} );

// Import the hook after mocks are set up
const useEmptySpamModule = await import( '../../../../src/dashboard/hooks/use-empty-spam' );
const useEmptySpam = useEmptySpamModule.default;

describe( 'useEmptySpam', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns initial state', () => {
		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.isConfirmDialogOpen ).toBe( false );
		expect( result.current.isEmpty ).toBe( false );
		expect( result.current.isEmptying ).toBe( false );
		expect( result.current.totalItemsSpam ).toBe( 5 );
		expect( result.current.selectedResponsesCount ).toBe( 2 );
		expect( typeof result.current.openConfirmDialog ).toBe( 'function' );
		expect( typeof result.current.closeConfirmDialog ).toBe( 'function' );
		expect( typeof result.current.onConfirmEmptying ).toBe( 'function' );
	} );

	it( 'sets isEmpty to true when totalItemsSpam is 0', async () => {
		const useInboxDataModule = await import( '../../../../src/dashboard/hooks/use-inbox-data' );
		useInboxDataModule.default.mockReturnValueOnce( {
			totalItemsSpam: 0,
			selectedResponsesCount: 0,
			currentQuery: {},
		} );

		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.isEmpty ).toBe( true );
	} );

	it( 'opens and closes confirmation dialog', () => {
		const { result } = renderHook( () => useEmptySpam() );

		expect( result.current.isConfirmDialogOpen ).toBe( false );

		act( () => {
			result.current.openConfirmDialog();
		} );

		expect( result.current.isConfirmDialogOpen ).toBe( true );

		act( () => {
			result.current.closeConfirmDialog();
		} );

		expect( result.current.isConfirmDialogOpen ).toBe( false );
	} );

	it( 'calls API and shows success notice when emptying spam', async () => {
		const apiFetchModule = await import( '@wordpress/api-fetch' );
		const analyticsModule = await import( '@automattic/jetpack-analytics' );
		const { useDispatch } = await import( '@wordpress/data' );

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		// Verify analytics event was recorded
		expect( analyticsModule.default.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_forms_empty_spam_click'
		);

		// Verify API call
		await waitFor( () => {
			expect( apiFetchModule.default ).toHaveBeenCalledWith( {
				method: 'DELETE',
				path: '/wp/v2/feedback/trash?status=spam',
			} );
		} );

		// Verify success notice
		const mockDispatch = useDispatch( 'notices' );
		await waitFor( () => {
			expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
				expect.stringContaining( 'deleted permanently' ),
				{ type: 'snackbar', id: 'empty-spam' }
			);
		} );

		// Verify cache invalidation
		const coreDispatch = useDispatch( 'core' );
		const dashboardDispatch = useDispatch( 'dashboard' );
		await waitFor( () => {
			expect( coreDispatch.invalidateResolutionForStoreSelector ).toHaveBeenCalledWith(
				'getEntityRecords'
			);
			expect( dashboardDispatch.invalidateCounts ).toHaveBeenCalled();
		} );
	} );

	it( 'does not call API when isEmpty is true', async () => {
		const useInboxDataModule = await import( '../../../../src/dashboard/hooks/use-inbox-data' );
		useInboxDataModule.default.mockReturnValueOnce( {
			totalItemsSpam: 0,
			selectedResponsesCount: 0,
			currentQuery: {},
		} );

		const apiFetchModule = await import( '@wordpress/api-fetch' );
		apiFetchModule.default.mockClear();

		const { result } = renderHook( () => useEmptySpam() );

		await act( async () => {
			await result.current.onConfirmEmptying();
		} );

		expect( apiFetchModule.default ).not.toHaveBeenCalled();
	} );

	it( 'uses provided totalItemsSpam prop over hook data', () => {
		const { result } = renderHook( () => useEmptySpam( { totalItemsSpam: 10 } ) );

		expect( result.current.totalItemsSpam ).toBe( 10 );
	} );
} );
