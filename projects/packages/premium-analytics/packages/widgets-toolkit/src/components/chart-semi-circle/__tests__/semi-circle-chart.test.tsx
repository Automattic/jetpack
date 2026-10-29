/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SemiCircleChart } from '../semi-circle-chart';

const mockPieSemiCircleChartSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	PieSemiCircleChart: ( props: Record< string, unknown > ) => {
		mockPieSemiCircleChartSpy( props );
		return null;
	},
} ) );

describe( 'SemiCircleChart', () => {
	it.each( [
		[ 'Devices', 'Chart: Devices' ],
		[ undefined, undefined ],
	] )( 'names the chart from chartTitle %s', ( chartTitle, ariaLabel ) => {
		render(
			<SemiCircleChart chartData={ [ { label: 'Mobile', value: 3 } ] } chartTitle={ chartTitle } />
		);

		expect( mockPieSemiCircleChartSpy ).toHaveBeenLastCalledWith(
			expect.objectContaining( { ariaLabel } )
		);
	} );
} );
