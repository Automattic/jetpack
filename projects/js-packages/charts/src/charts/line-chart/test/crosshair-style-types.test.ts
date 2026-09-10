import type { LineChartProps } from '../types';

type Crosshairs = NonNullable< LineChartProps[ 'withTooltipCrosshairs' ] >;

describe( 'line chart crosshair style types', () => {
	test( 'accepts paint attributes', () => {
		const crosshairs: Crosshairs = { verticalStyle: { stroke: 'purple', strokeWidth: 2 } };

		expect( crosshairs.verticalStyle?.stroke ).toBe( 'purple' );
	} );

	test( 'reserves geometry attributes for the chart', () => {
		const crosshairs: Crosshairs = {
			// @ts-expect-error Crosshair coordinates are computed from the active datum.
			verticalStyle: { x1: 12 },
		};

		expect( crosshairs ).toBeDefined();
	} );
} );
