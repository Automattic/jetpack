/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import ViewsOverYearsRender from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// A picked month lands in the section navigation, so a recorder stands in for it.
const mockOpenSectionRange = jest.fn();
jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useOpenSectionRange: () => mockOpenSectionRange,
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVisits: jest.fn(),
} ) );

// The site zone decides where a month starts and ends; pin it so the ranges are literal.
setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

// The chart's responsive wrapper asks for a ResizeObserver jsdom does not have.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const mockUseStatsVisits = jest.mocked( useStatsVisits );

function visitsResult(
	rows: [ string, number ][] | undefined,
	overrides: Record< string, unknown > = {}
) {
	return {
		primary: {
			data: rows && {
				data: rows.map( ( [ time_interval, views ] ) => ( {
					time_interval,
					views,
					label: '',
					value: views,
				} ) ),
			},
		},
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsVisits >;
}

const ROWS: [ string, number ][] = [
	[ '2025-11-01', 300 ],
	[ '2025-12-01', 620 ],
	[ '2026-01-01', 155 ],
	[ '2026-02-01', 0 ],
	[ '2026-03-01', 450 ],
];

// The current month closes the table, so the clock is pinned to the fixture's.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

function renderWidget( attributes: Record< string, unknown > = {} ) {
	return render(
		<ViewsOverYearsRender
			attributes={ {
				...attributes,
				reportParams: {
					from: '2026-01-01T00:00:00.000+00:00',
					to: '2026-12-31T23:59:59.999+00:00',
					preset: 'year-2026',
				},
			} }
		/>
	);
}

describe( 'ViewsOverYears widget', () => {
	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	beforeEach( () => {
		mockOpenSectionRange.mockReset();
		mockUseStatsVisits.mockReset();
		mockUseStatsVisits.mockReturnValue( visitsResult( ROWS ) );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'draws every year with views, newest first, whatever year the section shows', () => {
		renderWidget();

		expect( screen.getByRole( 'gridcell', { name: 'Jan 2026: 155' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'gridcell', { name: 'Feb 2026: 0' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'gridcell', { name: 'Nov 2025: 300' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'gridcell', { name: 'Totals 2025: 920' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Oct 2025/ } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Fewer views' ) ).toBeInTheDocument();
	} );

	it( 'draws views per day under the average metric', () => {
		renderWidget( { metric: 'average' } );

		// March is 15 days in: 450 / 15.
		expect( screen.getByRole( 'gridcell', { name: 'Mar 2026: 30' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fewer views per day' ) ).toBeInTheDocument();
	} );

	it( 'opens the Traffic tab over a clicked month', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 300' } ) );

		expect( mockOpenSectionRange ).toHaveBeenCalledWith( 'traffic', {
			from: new Date( '2025-11-01T00:00:00.000Z' ),
			to: new Date( '2025-11-30T23:59:59.999Z' ),
		} );
	} );

	it( 'opens the Traffic tab over a clicked year, cut at the clock', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		await user.click( screen.getByRole( 'gridcell', { name: 'Totals 2026: 605' } ) );

		expect( mockOpenSectionRange ).toHaveBeenCalledWith( 'traffic', {
			from: new Date( '2026-01-01T00:00:00.000Z' ),
			to: NOW,
		} );
	} );

	it( 'reports a site with no views as empty', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( [ [ '2026-03-01', 0 ] ] ) );
		renderWidget();

		expect( screen.getByText( 'No views yet.' ) ).toBeInTheDocument();
	} );

	it( 'offers a retry when the request fails with nothing on screen', async () => {
		const refetch = jest.fn();
		mockUseStatsVisits.mockReturnValue(
			visitsResult( undefined, { isError: true, error: new Error( 'boom' ), refetch } )
		);
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderWidget();

		expect(
			screen.getByText( "We couldn't load your views. Please try again in a moment." )
		).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
