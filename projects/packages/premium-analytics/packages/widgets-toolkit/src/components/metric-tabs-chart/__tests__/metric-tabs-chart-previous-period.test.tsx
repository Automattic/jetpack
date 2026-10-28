/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

function Wrapper() {
	const [ shown, setShown ] = useState( false );

	return (
		<GlobalChartsProvider>
			<MetricTabsChart
				metrics={ [ VIEWS, VISITORS ] }
				dataFormat={ DATA_FORMAT }
				chartType="bar"
				defaultPreviousPeriodShown={ shown }
				onPreviousPeriodShownChange={ setShown }
			/>
		</GlobalChartsProvider>
	);
}

describe( 'MetricTabsChart previous-period toggle', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'keeps the previous period the reader chose when the metric changes', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <Wrapper /> );
		const previousPeriodItem = () => screen.getByLabelText( /^Previous period/ );

		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'false' );
		await user.click( previousPeriodItem() );
		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'true' );

		await user.click( screen.getByRole( 'tab', { name: /Visitors/ } ) );

		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );
