/**
 * External dependencies
 */
import { ReportScopeProvider, getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../tests/js/route-test-utils';
import SubscribersChartWidget from '../render';
import subscribersChartWidget, { type SubscribersChartAttributes } from '../widget';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { ComponentType, ReactNode } from 'react';

const mockUseStatsSubscribersReport = jest.fn();

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSubscribersReport: ( params: unknown ) => mockUseStatsSubscribersReport( params ),
} ) );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the tabs observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
	}: {
		metrics: { key: string; value: number; current: { date: Date; value: number }[] }[];
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-metric-keys={ metrics.map( metric => metric.key ).join( ',' ) }
			data-values={ metrics[ 0 ]?.current.map( point => point.value ).join( ',' ) }
			data-days={ metrics[ 0 ]?.current.map( point => point.date.getDate() ).join( ',' ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

function reportWith( data: Record< string, unknown >[] ) {
	return {
		primary: { data: { data } },
		comparison: { data: undefined },
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	};
}

describe( 'SubscribersChartWidget', () => {
	beforeEach( () => {
		mockUseStatsSubscribersReport.mockReset();
	} );

	// Pinned west of UTC on purpose: under a UTC runner the site and runner
	// readings coincide, so this would pass either way.
	it( 'builds chart points on the bucket days the site names', async () => {
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		env.TZ = 'America/Los_Angeles';

		try {
			mockUseStatsSubscribersReport.mockReturnValue(
				reportWith( [
					{ date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 },
					{ date_start: '2026-07-05T00:00:00', subscribers: 6, subscribers_paid: 0 },
				] )
			);

			render(
				<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
			);

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			// Reading these buckets in the runner's zone would report the previous
			// day (3,4).
			expect( chart ).toHaveAttribute( 'data-days', '4,5' );
			expect( chart ).toHaveAttribute( 'data-values', '5,6' );
		} finally {
			if ( runnerTimeZone === undefined ) {
				delete env.TZ;
			} else {
				env.TZ = runnerTimeZone;
			}
		}
	} );

	it( 'offers the Paid subscribers tab only when the site has paid subscribers', async () => {
		mockUseStatsSubscribersReport.mockReturnValue(
			reportWith( [ { date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 2 } ] )
		);

		render(
			<SubscribersChartWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-keys', 'subscribers,paid' );
	} );

	describe( 'widget-owned date range', () => {
		beforeEach( () => {
			mockUseStatsSubscribersReport.mockReturnValue(
				reportWith( [ { date_start: '2026-07-04T00:00:00', subscribers: 5, subscribers_paid: 0 } ] )
			);
		} );

		// A failed assertion would skip a reset written into the test body, leaking
		// the URL state to whatever runs next.
		afterEach( () => setMockRouteSearch( {} ) );

		// The Subscribers default layout saves this widget with no attributes;
		// `render.tsx`'s own fallback must win over WidgetRoot's URL fallback.
		it( 'ignores the URL range for an instance saved without report params', async () => {
			setMockRouteSearch( { from: '2020-01-01', to: '2020-01-31', interval: 'month' } );

			render( <SubscribersChartWidget attributes={ {} } /> );

			await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
			expect( mockUseStatsSubscribersReport ).not.toHaveBeenCalledWith(
				expect.objectContaining( { to: '2020-01-31' } )
			);
		} );

		it( 'drops a comparison its attributes carry', async () => {
			render(
				<SubscribersChartWidget
					attributes={ {
						reportParams: {
							from: '2026-05-01',
							to: '2026-06-30',
							comp: '1',
							compare_from: '2026-03-01',
							compare_to: '2026-03-31',
						},
					} }
				/>
			);

			await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
			expect( mockUseStatsSubscribersReport ).not.toHaveBeenCalledWith(
				expect.objectContaining( { comp: '1' } )
			);
		} );

		// This chart draws day through month, so `hour` is the one interval a range
		// can still carry that it has no bucket for.
		it( 'clamps an unsupported interval to the closest supported bucket', async () => {
			render(
				<SubscribersChartWidget
					attributes={ {
						reportParams: { from: '2026-06-29', to: '2026-06-30', interval: 'hour' },
					} }
				/>
			);

			await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
			expect( mockUseStatsSubscribersReport ).toHaveBeenCalledWith(
				expect.objectContaining( { period: 'day' } )
			);
		} );
	} );
} );

describe( 'SubscribersChartWidget date control', () => {
	type FieldProps = DataFormControlProps< SubscribersChartAttributes >;

	// Only the DataForm plumbing is cast away, so `data` stays type-checked and a
	// renamed attribute breaks the build rather than passing silently.
	const [ { Edit } ] = subscribersChartWidget.attributes;
	const DateControl = Edit as ComponentType< FieldProps >;

	function renderDateControl(
		props: Pick< FieldProps, 'data' | 'onChange' >,
		wrap: ( control: ReactNode ) => ReactNode = control => control
	) {
		render( wrap( <DateControl { ...( props as FieldProps ) } /> ) );
	}

	it( 'offers no window shorter than the report can fill', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		renderDateControl( { data: { reportParams: { preset: 'last-30-days' } }, onChange } );

		await user.click( screen.getByRole( 'button', { name: 'Last 30 days' } ) );

		const menu = screen.getByRole( 'menu', { name: 'Period' } );

		expect(
			within( menu )
				.getAllByRole( 'menuitemradio' )
				.map( item => item.textContent )
		).toEqual( [ 'Last 7 days', 'Last 30 days', 'Last 12 months', 'Custom range' ] );

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Last 7 days' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { preset: 'last-7-days' } ),
		} );
	} );

	it( 'moves an instance saved on the last 24 hours onto an offered window', () => {
		const onChange = jest.fn();

		renderDateControl( {
			data: { reportParams: { preset: 'last-24-hours', interval: 'hour' } },
			onChange,
		} );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { preset: 'last-30-days' } ),
		} );
	} );

	// The host renders this outside the widget tree, so on a comparison-enabled
	// section it would inherit that scope and save a comparison the body drops.
	it( 'offers no comparison even under a comparison-enabled scope', async () => {
		renderDateControl(
			{ data: { reportParams: { preset: 'last-30-days' } }, onChange: jest.fn() },
			control => <ReportScopeProvider offersComparison>{ control }</ReportScopeProvider>
		);

		await expect(
			screen.findByRole( 'button', { name: 'Last 30 days' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /^Compare/ } ) ).not.toBeInTheDocument();
	} );

	it( 'offers no bucket control', async () => {
		renderDateControl( {
			data: { reportParams: { preset: 'last-30-days' } },
			onChange: jest.fn(),
		} );

		await expect(
			screen.findByRole( 'button', { name: 'Last 30 days' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /^Chart interval/ } ) ).not.toBeInTheDocument();
	} );
} );
