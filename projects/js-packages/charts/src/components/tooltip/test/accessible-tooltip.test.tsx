import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { LineChartUnresponsive } from '../../../charts/line-chart/line-chart';
import { GlobalChartsProvider } from '../../../providers';
import { ChartScopeContext } from '../../../providers/chart-scope';
import { useKeyboardNavigation } from '../accessible-tooltip';
import type { ReactNode } from 'react';

// A real chart is the harness rather than the subject: the crosshairs render only once visx has a data context and an open tooltip. The unresponsive export is what lets the test own the scope element — `withResponsive` otherwise provides its own wrapper as the scope.
const renderChart = ( scope?: HTMLElement, tooltipPlacement?: 'auto' | 'below-axis' ) => {
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
			tooltipPlacement={ tooltipPlacement }
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

	return screen.getByTestId( 'xy-chart-tooltip-crosshair-vertical' );
};

describe( 'AccessibleTooltip', () => {
	// The stroke is read at the scope element, not inherited through the DOM; see TOKENS.md#the-svg-bridge.
	it( 'reads the grid role from the scope element', async () => {
		const scope = document.createElement( 'div' );
		scope.style.setProperty( '--a8c-charts-color-grid', 'rgb(1, 2, 3)' );
		document.body.appendChild( scope );

		renderChart( scope );

		await expect( openTooltip() ).resolves.toHaveAttribute( 'stroke', 'rgb(1, 2, 3)' );

		document.body.removeChild( scope );
	} );

	it( 'keeps the existing focus scrolling for automatic tooltips', async () => {
		const focus = jest.spyOn( HTMLElement.prototype, 'focus' );
		try {
			renderChart();
			await openTooltip();

			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
			expect( focus ).toHaveBeenLastCalledWith();
		} finally {
			focus.mockRestore();
		}
	} );

	it( 'focuses below-axis keyboard tooltips without scrolling their ancestors', async () => {
		const focus = jest.spyOn( HTMLElement.prototype, 'focus' );
		try {
			renderChart( undefined, 'below-axis' );
			await openTooltip();

			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
			expect( focus ).toHaveBeenCalledWith( { preventScroll: true } );
		} finally {
			focus.mockRestore();
		}
	} );

	it( 'falls back to the catalog default when the role is unset', async () => {
		renderChart();

		await expect( openTooltip() ).resolves.toHaveAttribute( 'stroke', '#dbdbdb' );
	} );
} );

// Mirrors the charts' markup: the focusable grid wraps the element `chartRef` points at.
const NavigationHarness = ( { totalPoints }: { totalPoints: number } ) => {
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >();
	const [ isNavigating, setIsNavigating ] = useState( false );
	const chartRef = useRef< HTMLDivElement >( null );
	const { onChartKeyDown } = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints,
	} );

	return (
		<>
			<div role="grid" aria-label="Harness" tabIndex={ 0 } onKeyDown={ onChartKeyDown }>
				<div ref={ chartRef } data-testid="selected-index">
					{ selectedIndex ?? 'none' }
				</div>
			</div>
			<button type="button">Outside</button>
		</>
	);
};

describe( 'useKeyboardNavigation', () => {
	const navigateToLastOfSix = async () => {
		const user = userEvent.setup();
		const view = render( <NavigationHarness totalPoints={ 6 } /> );

		screen.getByRole( 'grid', { name: 'Harness' } ).focus();
		for ( let i = 0; i < 6; i++ ) {
			await user.keyboard( '{ArrowRight}' );
		}
		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '5' );

		return view;
	};

	it( 'moves the selection to the last point when the count shrinks while the grid has focus', async () => {
		const { rerender } = await navigateToLastOfSix();

		rerender( <NavigationHarness totalPoints={ 3 } /> );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '2' );
		expect( screen.getByRole( 'grid', { name: 'Harness' } ) ).toHaveFocus();
	} );

	it( 'clears the selection when the count shrinks after focus has left the chart', async () => {
		const { rerender } = await navigateToLastOfSix();

		screen.getByRole( 'button', { name: 'Outside' } ).focus();
		rerender( <NavigationHarness totalPoints={ 3 } /> );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( 'none' );
	} );
} );
