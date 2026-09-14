/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import PostingActivityRender from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsStreak: jest.fn(),
} ) );

// The chart's responsive wrapper asks for a ResizeObserver jsdom does not have.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const mockUseStatsStreak = jest.mocked( useStatsStreak );

// The window is resolved from "now" in the site timezone, so pin both rather
// than letting the machine's clock and zone decide what to expect.
const NOW = new Date( '2026-09-14T12:00:00.000Z' );

// The host still injects the section's range; the card must ignore it.
const HOST_REPORT_PARAMS = {
	from: '2025-06-01',
	to: '2025-06-30',
	interval: 'day',
} as unknown as ReportParams;

function streakResult( overrides: Record< string, unknown > = {} ) {
	return {
		data: { '2025-10-03': 2, '2026-09-14': 1 },
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsStreak >;
}

function renderWidget() {
	return render( <PostingActivityRender attributes={ { reportParams: HOST_REPORT_PARAMS } } /> );
}

describe( 'PostingActivityWidget', () => {
	let defaultSettings: ReturnType< typeof getSettings >;

	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	beforeEach( () => {
		mockUseStatsStreak.mockReset();
		mockUseStatsStreak.mockReturnValue( streakResult() );
		defaultSettings = getSettings();
		setSettings( {
			...defaultSettings,
			timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
		} );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
		setSettings( defaultSettings );
	} );

	it( 'requests the last 12 months whatever range the host injects', () => {
		renderWidget();

		expect( mockUseStatsStreak.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			startDate: '2025-10-01',
			endDate: '2026-09-14',
		} );
	} );

	it( 'draws those months as one calendar grid, current month last', () => {
		renderWidget();

		expect( screen.getByRole( 'grid', { name: 'Monthly posting activity' } ) ).toBeInTheDocument();
		const months = screen.getAllByTestId( 'heatmap-group-label' ).map( el => el.textContent );
		expect( months ).toHaveLength( 12 );
		expect( months[ 0 ] ).toBe( 'Oct' );
		expect( months[ 11 ] ).toBe( 'Sep' );
		expect( screen.getByRole( 'gridcell', { name: 'Mon, Sep 14, 2026: 1' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Sep 15, 2026/ } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Fewer posts' ) ).toBeInTheDocument();
	} );

	it( 'keeps the post wording and leads the tooltip with the count', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.hover( screen.getByRole( 'gridcell', { name: 'Fri, Oct 3, 2025: 2' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '2 postsFri, Oct 3, 2025' );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Mon, Sep 14, 2026: 1' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '1 postMon, Sep 14, 2026' );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Sat, Oct 4, 2025: No data' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'No postsSat, Oct 4, 2025' );
	} );

	it( 'shows the empty state when only days outside the window have posts', () => {
		// A stale response for an older window must not suppress the empty state.
		mockUseStatsStreak.mockReturnValue( streakResult( { data: { '2024-03-05': 2 } } ) );
		renderWidget();

		expect( screen.getByText( 'No posts published in the last 12 months.' ) ).toBeInTheDocument();
	} );

	it( 'shows the month blocks while loading', () => {
		mockUseStatsStreak.mockReturnValue( streakResult( { data: undefined, isLoading: true } ) );
		renderWidget();

		expect( screen.getAllByTestId( 'skeleton-month' ) ).toHaveLength( 12 );
	} );

	it( 'shows a permission error without a retry action', () => {
		mockUseStatsStreak.mockReturnValue(
			streakResult( {
				data: undefined,
				isError: true,
				error: { error: 'unauthorized', status: 403 },
			} )
		);
		renderWidget();

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
