/**
 * External dependencies
 */
import { useStatsEmailClicksBreakdown } from '@jetpack-premium-analytics/data';
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
	omitComparisonReportParams: jest.requireActual(
		'../../../packages/routing/src/search/report-params'
	).omitComparisonReportParams,
} ) );

// The hook reads the raw URL search to build each layout entry's stripped
// reportParams; the real useSearch throws outside a matched route.
let mockRouteSearch: Record< string, unknown > = {};
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockRouteSearch,
} ) );

// The email tabs gate on the per-post clicks rate summary; the query itself is
// exercised in the data package, so stub the hook with a controllable result.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useStatsEmailClicksBreakdown: jest.fn(),
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
const mockUseClicksBreakdown = useStatsEmailClicksBreakdown as jest.MockedFunction<
	typeof useStatsEmailClicksBreakdown
>;

const POST_ID = 91;

type GateState = 'loading' | 'paused' | 'error';

/**
 * Mock the clicks rate summary that gates the email tabs.
 *
 * @param summary - The sanitized summary; `undefined` mocks a query that has not
 *                answered yet, positioned by `state`.
 * @param state   - Where an answerless query sits: fetching its first load,
 *                retrying with the retryer paused (a background tab or an
 *                offline blip, which drops `isLoading` without answering),
 *                or finally failed.
 */
function mockRateSummary( summary?: Record< string, number >, state: GateState = 'loading' ) {
	const answered = summary !== undefined;

	mockUseClicksBreakdown.mockReturnValue( {
		data: answered ? { summary } : undefined,
		isLoading: ! answered && state === 'loading',
		isSuccess: answered,
		isError: ! answered && state === 'error',
	} as unknown as ReturnType< typeof useStatsEmailClicksBreakdown > );
}

/**
 * Mock the gate summary reporting a send count.
 *
 * @param totalSends - `total_sends`; `undefined` leaves the gate unanswered.
 * @param state      - Where an unanswered gate sits.
 */
function mockEmailSends( totalSends?: number, state: GateState = 'loading' ) {
	mockRateSummary( totalSends === undefined ? undefined : { total_sends: totalSends }, state );
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
		isDirty: false,
		stage,
		commit,
		revert: jest.fn(),
	} );

	return { stage, commit };
}

describe( 'usePostDetailTabs', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockEmailSends( 3 );
		mockRouteSearch = {};
	} );

	// The stage declares the no-comparison invariant once; this layout carries no
	// injected params (see stage.test.tsx for what widgets actually read).
	it( 'returns the tab’s fixed layout untouched', () => {
		mockSearch( 'post-traffic' );
		mockRouteSearch = {
			from: '2026-07-01',
			to: '2026-07-07',
			comp: '1',
			compare_from: '2026-06-24',
		};

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.layout.length ).toBeGreaterThan( 0 );
		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] );
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

	it( 'exposes the email tabs for a post sent to subscribers', () => {
		const { stage, commit } = mockSearch( 'email-clicks' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
			'post-traffic',
			'email-opens',
			'email-clicks',
		] );
		expect( result.current.activeTab ).toBe( 'email-clicks' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'pins the email tabs’ widgets to the given report params', () => {
		mockSearch( 'email-opens' );
		mockRouteSearch = { from: '2026-07-01', to: '2026-07-07', post_id: String( POST_ID ) };
		const pinned = {
			post_id: POST_ID,
			preset: 'all-time' as const,
			from: '2026-06-22',
			to: '2026-08-28',
			interval: 'week' as const,
		};

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, pinned ) );

		const fixed = POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ];
		expect( result.current.layout ).toHaveLength( fixed.length );
		result.current.layout.forEach( ( widget, index ) => {
			const attributes = fixed[ index ].attributes as Record< string, unknown > | undefined;
			expect( widget ).toEqual( {
				...fixed[ index ],
				attributes: { ...attributes, reportParams: pinned },
			} );
		} );
		// The fixed composition itself is left alone.
		expect(
			fixed.some( widget => 'reportParams' in ( ( widget.attributes as object ) ?? {} ) )
		).toBe( false );
	} );

	it( 'mounts the fixed email layout when the pinned params can no longer resolve', () => {
		mockSearch( 'email-clicks' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, undefined, true ) );

		// The widgets mount and surface their own error states, instead of the
		// tab staying permanently blank with no Retry (summary request failed).
		expect( result.current.activeTab ).toBe( 'email-clicks' );
		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'email-clicks' ] );
	} );

	it( 'gives an email tab no layout until its report params are known', () => {
		mockSearch( 'email-clicks' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.activeTab ).toBe( 'email-clicks' );
		expect( result.current.layout ).toEqual( [] );
	} );

	it( 'leaves the traffic layout untouched when email report params are given', () => {
		mockSearch( 'post-traffic' );
		const pinned = {
			post_id: POST_ID,
			preset: 'all-time' as const,
			from: '2026-06-22',
			to: '2026-08-28',
			interval: 'week' as const,
		};

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, pinned ) );

		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] );
	} );

	it( 'keeps the email tabs for a post never sent, flagged and without widgets', () => {
		mockEmailSends( 0 );
		const pinned = {
			post_id: POST_ID,
			preset: 'all-time' as const,
			from: '2026-06-22',
			to: '2026-08-28',
			interval: 'week' as const,
		};
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, pinned, false, 'post' ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
			'post-traffic',
			'email-opens',
			'email-clicks',
		] );
		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( true );
		// Every widget would be empty; the stage shows one page-level state instead.
		expect( result.current.layout ).toEqual( [] );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'does not flag a post as never sent until its type is known', () => {
		// The send check can answer before the post summary; a page answers
		// "no sends" too, and must not show the newsletter state meanwhile.
		mockEmailSends( 0 );
		mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( false );
	} );

	it( 'gives an email tab no widgets while the send check is pending', () => {
		// Widgets drawn now would be swapped for the not-sent state if it answers "no sends".
		mockEmailSends( undefined, 'loading' );
		mockSearch( 'email-opens' );
		const pinned = {
			post_id: POST_ID,
			preset: 'all-time' as const,
			from: '2026-06-22',
			to: '2026-08-28',
			interval: 'week' as const,
		};

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, pinned, false, 'post' ) );

		expect( result.current.isEmailSendPending ).toBe( true );
		expect( result.current.layout ).toEqual( [] );
	} );

	it( 'leaves the Post traffic layout alone for a post never sent', () => {
		mockEmailSends( 0 );
		mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'post-traffic' ] );
	} );

	it.each( [ 'page', 'jetpack-portfolio' ] )(
		'hides the email tabs for a %s, which is never sent as a newsletter',
		async postType => {
			const { stage, commit } = mockSearch( 'email-opens' );

			const { result } = renderHook( () =>
				usePostDetailTabs( POST_ID, undefined, false, postType )
			);

			expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
			expect( result.current.activeTab ).toBe( 'post-traffic' );
			expect( mockUseClicksBreakdown ).toHaveBeenCalledWith( POST_ID, 'rate', {
				enabled: false,
			} );
			await waitFor( () => {
				expect( stage ).toHaveBeenCalledWith( { section: 'post-traffic' } );
				expect( commit ).toHaveBeenCalledWith( { replace: true } );
			} );
		}
	);

	it( 'keeps the email tabs for a standard post', () => {
		mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, undefined, false, 'post' ) );

		expect( result.current.activeTab ).toBe( 'email-opens' );
	} );

	it( 'exposes the email tabs for a legacy send with unrecorded sends', () => {
		mockRateSummary( { total_sends: 0, total_opens: 120, total_clicks: 5, unique_clicks: 0 } );
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( false );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'does not flag a post as never sent while the send summary is loading', () => {
		mockEmailSends( undefined, 'loading' );
		mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, undefined, false, 'post' ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [
			'post-traffic',
			'email-opens',
			'email-clicks',
		] );
		expect( result.current.isEmailNotSent ).toBe( false );
	} );

	it( 'shows only Post traffic while the type loads on a visit that names no email tab', () => {
		// A page would otherwise show the email tabs, then lose them once its
		// type arrives.
		mockEmailSends( undefined, 'loading' );
		mockSearch( 'post-traffic' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
	} );

	it( 'shows the deep-linked email tab while the send summary is loading', () => {
		mockEmailSends( undefined, 'loading' );
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'does not flag a post as never sent while a retry is paused', () => {
		// A background tab or an offline blip pauses the retryer, dropping
		// `isLoading` with the gate still unanswered. Reading that as "answered"
		// would flash the not-sent state over a post that was sent.
		mockEmailSends( undefined, 'paused' );
		mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID ) );

		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( false );
	} );

	it( 'keeps the deep-linked email tab once the gate reports no sends', () => {
		const { stage, commit } = mockSearch( 'email-opens' );
		mockEmailSends( undefined, 'loading' );

		const { result, rerender } = renderHook( () =>
			usePostDetailTabs( POST_ID, undefined, false, 'post' )
		);
		expect( result.current.isEmailNotSent ).toBe( false );

		mockEmailSends( 0 );
		rerender();

		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( true );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'keeps an email deep link and its widgets when the send summary request fails', () => {
		mockEmailSends( undefined, 'error' );
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( POST_ID, undefined, true ) );

		// The widgets surface their own errors; a failed check is not "never sent".
		expect( result.current.activeTab ).toBe( 'email-opens' );
		expect( result.current.isEmailNotSent ).toBe( false );
		expect( result.current.layout ).toEqual( POST_DETAIL_TAB_LAYOUTS[ 'email-opens' ] );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'disables the gate query without a valid post scope', () => {
		mockSearch( 'post-traffic' );

		renderHook( () => usePostDetailTabs( 0 ) );

		expect( mockUseClicksBreakdown ).toHaveBeenCalledWith( 0, 'rate', { enabled: false } );
	} );

	it( 'does not hold an email tab open on a scope whose gate never runs', async () => {
		// The disabled query answers neither way, so only the post scope stops
		// an email deep link from pinning the tabs open for good.
		mockEmailSends( undefined, 'loading' );
		const { stage, commit } = mockSearch( 'email-opens' );

		const { result } = renderHook( () => usePostDetailTabs( 0 ) );

		expect( result.current.tabs.map( tab => tab.id ) ).toEqual( [ 'post-traffic' ] );
		await waitFor( () => {
			expect( stage ).toHaveBeenCalledWith( { section: 'post-traffic' } );
			expect( commit ).toHaveBeenCalledWith( { replace: true } );
		} );
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
