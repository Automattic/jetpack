/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { POST_DETAIL_TAB_LAYOUTS } from '../config';
import { usePostDetailTabs } from './use-post-detail-tabs';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: jest.fn(),
} ) );

// Replace the fixed layouts with a mutable clone so the all-empty fallback can
// be exercised per test; everything else in the config stays real.
jest.mock( '../config', () => {
	const actual = jest.requireActual( '../config' );
	return {
		...actual,
		POST_DETAIL_TAB_LAYOUTS: { ...actual.POST_DETAIL_TAB_LAYOUTS },
	};
} );

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

	it( 'falls back to the full tab list when no tab has fixed content', () => {
		const layouts = POST_DETAIL_TAB_LAYOUTS as Record< string, DashboardWidget[] >;
		const original = { ...layouts };
		for ( const id of Object.keys( layouts ) ) {
			layouts[ id ] = [];
		}

		try {
			const { stage, commit } = mockSearch( 'post-traffic' );

			const { result } = renderHook( () => usePostDetailTabs() );

			expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
				'post-traffic',
				'email-opens',
				'email-clicks',
			] );
			expect( result.current.activeTab ).toBe( 'post-traffic' );
			expect( result.current.layout ).toEqual( [] );
			expect( stage ).not.toHaveBeenCalled();
			expect( commit ).not.toHaveBeenCalled();
		} finally {
			Object.assign( layouts, original );
		}
	} );
} );
