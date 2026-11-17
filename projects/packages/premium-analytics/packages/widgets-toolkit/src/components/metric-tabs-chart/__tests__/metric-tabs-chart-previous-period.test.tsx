/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { MetricTabsChart } from '../metric-tabs-chart';
import type { MetricTab } from '../metric-tabs-chart';

const DATA_FORMAT = { type: 'number' as const };

const points = ( values: number[] ) =>
	values.map( ( value, index ) => ( { date: new Date( Date.UTC( 2026, 6, index + 1 ) ), value } ) );

const VIEWS: MetricTab = {
	key: 'views',
	label: 'Views',
	value: 300,
	current: points( [ 100, 200 ] ),
	previous: points( [ 80, 120 ] ),
	counterpartKey: 'visitors',
};

const VISITORS: MetricTab = {
	key: 'visitors',
	label: 'Visitors',
	value: 120,
	current: points( [ 40, 80 ] ),
	previous: points( [ 30, 70 ] ),
	counterpartKey: 'views',
};

describe( 'MetricTabsChart previous-period toggle', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( "passes the previous period and its callback to each metric's bar chart", async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const onPreviousPeriodShownChange = jest.fn();
		render(
			<GlobalChartsProvider>
				<MetricTabsChart
					metrics={ [ VIEWS, VISITORS ] }
					dataFormat={ DATA_FORMAT }
					chartType="bar"
					previousPeriodShown
					onPreviousPeriodShownChange={ onPreviousPeriodShownChange }
				/>
			</GlobalChartsProvider>
		);
		const previousPeriodItem = () => screen.getByLabelText( /^Previous period/ );

		await user.click( screen.getByRole( 'tab', { name: /Visitors/ } ) );
		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'true' );

		await user.click( previousPeriodItem() );
		expect( onPreviousPeriodShownChange ).toHaveBeenCalledWith( false );
	} );
} );
