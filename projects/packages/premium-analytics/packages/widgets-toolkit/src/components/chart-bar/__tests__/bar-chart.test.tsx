/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { useWidgetIdentity } from '@wordpress/widget-primitives';
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

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetIdentity: jest.fn(),
} ) );

describe( 'BarChart', () => {
	beforeEach( () => {
		resetMockCharts();
	} );

	it.each( [
		[ 'Sales by device', undefined, 'Chart: Sales by device' ],
		[ undefined, 'Sales by device', 'Chart: Sales by device' ],
		[ undefined, undefined, undefined ],
	] )(
		'names the chart from chartTitle %s or widget title %s',
		( chartTitle, widgetTitle, ariaLabel ) => {
			jest.mocked( useWidgetIdentity ).mockReturnValue( { title: widgetTitle } );

			render(
				<BarChart
					chartData={ [ { label: 'Sales', data: [ { label: 'Mobile', value: 3 } ] } ] }
					dataFormat={ { type: 'number' } }
					chartTitle={ chartTitle }
				/>
			);

			expect( mockBarChartSpy ).toHaveBeenLastCalledWith(
				expect.objectContaining( { ariaLabel } )
			);
		}
	);
} );
