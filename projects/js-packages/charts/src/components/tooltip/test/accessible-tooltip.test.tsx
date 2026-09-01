import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineChartUnresponsive } from '../../../charts/line-chart/line-chart';
import { GlobalChartsProvider } from '../../../providers';
import { ChartScopeContext } from '../../../providers/chart-scope';
import type { ReactNode } from 'react';

// A real chart is the harness rather than the subject: the crosshairs render only once visx has a data context and an open tooltip. The unresponsive export is what lets the test own the scope element — `withResponsive` otherwise provides its own wrapper as the scope.
const renderChart = ( scope?: HTMLElement ) => {
	const chart = (
		<LineChartUnresponsive
			width={ 500 }
			height={ 300 }
			data={ [
				{
					label: 'Series A',
					data: [
						{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
						{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
					],
					options: {},
				},
			] }
			withTooltips
			withTooltipCrosshairs={ { showVertical: true } }
			withGradientFill={ false }
		/>
	);

	const scoped: ReactNode = scope ? (
		<ChartScopeContext.Provider value={ scope }>{ chart }</ChartScopeContext.Provider>
	) : (
		chart
	);

	return render( <GlobalChartsProvider>{ scoped }</GlobalChartsProvider> );
};

const openTooltip = async () => {
	const user = userEvent.setup();

	screen.getByRole( 'grid', { name: /line chart/i } ).focus();
	await user.keyboard( '{ArrowRight}' );

	// eslint-disable-next-line testing-library/no-node-access -- visx owns the crosshair and hardcodes its class name, so there is no attribute to reach it by.
	return document.querySelector( '.visx-crosshair-vertical line' );
};

describe( 'AccessibleTooltip', () => {
	// The crosshair is painted in a portal outside the scope element; see TOKENS.md#the-svg-bridge.
	it( 'reads the grid role from the scope element', async () => {
		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-grid', 'rgb(1, 2, 3)' );
		document.body.appendChild( scope );

		renderChart( scope );

		await expect( openTooltip() ).resolves.toHaveAttribute( 'stroke', 'rgb(1, 2, 3)' );

		document.body.removeChild( scope );
	} );

	it( 'falls back to the catalog default when the role is unset', async () => {
		renderChart();

		await expect( openTooltip() ).resolves.toHaveAttribute( 'stroke', '#dbdbdb' );
	} );
} );
