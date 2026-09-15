/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import PostAllTimeTrafficRender from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockOnChange = jest.fn();
const mockOnApply = jest.fn();
jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useReportDateFilters: () => ( {
		onChange: ( ...args: unknown[] ) => mockOnChange( ...args ),
		onApply: () => mockOnApply(),
		timeZone: 'UTC',
	} ),
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsPost: jest.fn(),
} ) );

const NOW = new Date( '2026-03-15T12:00:00.000Z' );

// The chart's responsive wrapper asks for a ResizeObserver jsdom does not have.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// The real chart, unlike the sibling file's mock: the widget reads its clicks
// off the chart's own markup, so this is what pins that contract.
describe( 'PostAllTimeTraffic on the real HeatmapChart', () => {
	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	beforeEach( () => {
		mockOnChange.mockReset();
		mockOnApply.mockReset();
		jest.mocked( useStatsPost ).mockReturnValue( {
			data: {
				years: { '2025': { total: 30, months: { '11': 10, '12': 20 } } },
				post: { ID: 779, post_date: '2025-11-10 16:27:32' },
			},
			isLoading: false,
			isFetching: false,
			isError: false,
			error: null,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsPost > );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'applies a clicked month through the chart markup', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<PostAllTimeTrafficRender
				attributes={ {
					reportParams: {
						from: '2026-01-01T00:00:00.000+00:00',
						to: '2026-01-31T23:59:59.999+00:00',
						post_id: 779,
					},
				} }
			/>
		);

		// The chart names a cell from its column, row and value.
		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );

		expect( mockOnChange ).toHaveBeenCalledWith(
			{
				from: new Date( '2025-11-10T00:00:00.000Z' ),
				to: new Date( '2025-11-30T23:59:59.999Z' ),
			},
			'custom'
		);
		expect( mockOnApply ).toHaveBeenCalledTimes( 1 );
	} );
} );
