/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { usePostDetailTabs } from './use-post-detail-tabs';

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: jest.fn(),
} ) );

const mockUseStagedSearch = useStagedSearch as jest.MockedFunction< typeof useStagedSearch >;

/**
 * Mock the staged URL search state for a post-detail section.
 *
 * @param section - Section value exposed by the router.
 * @return The mocked stage and commit callbacks.
 */
function mockSearch( section: string ) {
	const stage = jest.fn();
	const commit = jest.fn();

	mockUseStagedSearch.mockReturnValue( {
		committed: { section },
		staged: { section },
		effective: { section },
		isSyncing: false,
		isDirty: false,
		stage,
		commit,
		revert: jest.fn(),
		cancelAutoCommit: jest.fn(),
	} );

	return { stage, commit };
}

describe( 'usePostDetailTabs', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'falls back from a hidden tab and replaces the URL', async () => {
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs() );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
		expect( result.current.activeTab ).toBe( 'post-traffic' );

		await waitFor( () => {
			expect( stage ).toHaveBeenCalledWith( { section: 'post-traffic' } );
			expect( commit ).toHaveBeenCalledWith( { replace: true } );
		} );
	} );

	it( 'does not navigate when the selected tab is visible', () => {
		const { stage, commit } = mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs() );

		expect( result.current.activeTab ).toBe( 'post-traffic' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );
} );
