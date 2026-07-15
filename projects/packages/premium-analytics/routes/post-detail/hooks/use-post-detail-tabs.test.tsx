/**
 * External dependencies
 */
import { useStatsEmailOpensBreakdown } from '@jetpack-premium-analytics/data';
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

// The email tabs gate on the per-post opens rate summary; the query itself is
// exercised in the data package, so stub the hook with a controllable result.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsEmailOpensBreakdown: jest.fn(),
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
const mockUseOpensBreakdown = useStatsEmailOpensBreakdown as jest.MockedFunction<
	typeof useStatsEmailOpensBreakdown
>;

const POST_ID = 91;

/**
 * Mock the opens rate summary that gates the email tabs.
 *
 * @param totalSends - The summary's `total_sends`; `undefined` mocks a
 *                   still-loading (or errored) query with no data.
 */
function mockEmailSends( totalSends?: number ) {
	mockUseOpensBreakdown.mockReturnValue( {
		data: totalSends === undefined ? undefined : { summary: { total_sends: totalSends } },
	} as unknown as ReturnType< typeof useStatsEmailOpensBreakdown > );
}

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
		mockEmailSends( 3 );
	} );

	it( 'falls back from a hidden tab and replaces the URL', async () => {
		const layouts = POST_DETAIL_TAB_LAYOUTS as Record< string, DashboardWidget[] >;
		const emailOpensLayout = layouts[ 'email-opens' ];
		layouts[ 'email-opens' ] = [];

		try {
			const { stage, commit } = mockSearch( 'email-opens' );

			const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

			expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
				'post-traffic',
				'email-clicks',
			] );
			expect( result.current.activeTab ).toBe( 'post-traffic' );

			await waitFor( () => {
				expect( stage ).toHaveBeenCalledWith( { section: 'post-traffic' } );
				expect( commit ).toHaveBeenCalledWith( { replace: true } );
			} );
		} finally {
			layouts[ 'email-opens' ] = emailOpensLayout;
		}
	} );

	it( 'exposes the email tabs and selects their fixed layouts', () => {
		const { stage, commit } = mockSearch( 'email-clicks' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
			'post-traffic',
			'email-opens',
			'email-clicks',
		] );
		expect( result.current.activeTab ).toBe( 'email-clicks' );
		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'hides the email tabs for a post never sent to subscribers', async () => {
		mockEmailSends( 0 );
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
		expect( result.current.activeTab ).toBe( 'post-traffic' );

		// A deep link to a gated tab falls back like any hidden tab.
		await waitFor( () => {
			expect( stage ).toHaveBeenCalledWith( { section: 'post-traffic' } );
			expect( commit ).toHaveBeenCalledWith( { replace: true } );
		} );
	} );

	it( 'keeps the email tabs hidden while the send summary is still loading', () => {
		mockEmailSends( undefined );
		mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
	} );

	it( 'disables the send query without a valid post scope', () => {
		mockSearch( 'post-traffic' );

		renderHook( () => usePostDetailTabs( 0 ) );

		expect( mockUseOpensBreakdown ).toHaveBeenCalledWith( 0, 'rate', { enabled: false } );
	} );

	it( 'does not navigate when the selected tab is visible', () => {
		const { stage, commit } = mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

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

			const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

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
