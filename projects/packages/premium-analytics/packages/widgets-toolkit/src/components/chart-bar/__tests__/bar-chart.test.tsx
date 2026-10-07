/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { mockBarChartSpy, resetMockCharts } from '../../../../../../tests/js/chart-test-utils';
import { BarChart } from '../bar-chart';

jest.mock( '@jetpack-premium-analytics/externals', () =>
	jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockChartExternals()
);

jest.mock(
	'@wordpress/compose',
	() => jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockWordPressCompose
);

describe( 'BarChart', () => {
	beforeEach( () => {
		resetMockCharts();
	} );

	it.each( [
		[ 'Sales by device', 'Sales by device chart' ],
		[ undefined, undefined ],
	] )( 'names the chart from chartTitle %s', ( chartTitle, ariaLabel ) => {
		render(
			<BarChart
				chartData={ [ { label: 'Sales', data: [ { label: 'Mobile', value: 3 } ] } ] }
				dataFormat={ { type: 'number' } }
				chartTitle={ chartTitle }
			/>
		);

		expect( mockBarChartSpy ).toHaveBeenLastCalledWith( expect.objectContaining( { ariaLabel } ) );
	} );
} );
