/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import PostingActivityRender from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		HeatmapChartUnresponsive: () => <div data-testid="heatmap" />,
	};
} );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsStreak: jest.fn(),
} ) );

const mockUseStatsStreak = jest.mocked( useStatsStreak );
const REPORT_PARAMS = {
	from: '2025-06-01',
	to: '2025-06-30',
	interval: 'day',
} as unknown as ReportParams;

function streakResult( overrides: Record< string, unknown > = {} ) {
	return {
		data: { '2025-06-02': 1 },
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsStreak >;
}

function setViewportWidth( width: number ) {
	Object.defineProperty( window, 'innerWidth', { value: width, configurable: true } );
}

describe( 'PostingActivityWidget', () => {
	const originalInnerWidth = window.innerWidth;

	beforeEach( () => {
		mockUseStatsStreak.mockReset();
		mockUseStatsStreak.mockReturnValue( streakResult() );
		setViewportWidth( 1024 );
	} );

	afterEach( () => {
		setViewportWidth( originalInnerWidth );
	} );

	it( 'updates the shared history window when the viewport is resized', () => {
		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( mockUseStatsStreak.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			startDate: '2023-06-30',
			endDate: '2025-06-30',
		} );

		setViewportWidth( 2560 );
		fireEvent.resize( window );

		const lastCall = mockUseStatsStreak.mock.calls[ mockUseStatsStreak.mock.calls.length - 1 ];
		expect( lastCall[ 0 ] ).toMatchObject( {
			startDate: '2021-06-28',
			endDate: '2025-06-30',
		} );
	} );

	it( 'shows a permission error without a retry action', () => {
		mockUseStatsStreak.mockReturnValue(
			streakResult( {
				data: undefined,
				isError: true,
				error: { error: 'unauthorized', status: 403 },
			} )
		);

		render( <PostingActivityRender attributes={ { reportParams: REPORT_PARAMS } } /> );

		expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
