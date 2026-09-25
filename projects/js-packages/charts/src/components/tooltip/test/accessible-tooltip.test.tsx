import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useRef, useState } from 'react';
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

	it.each( [
		[ 'Tab', '{Tab}' ],
		[ 'Escape', '{Escape}' ],
	] )( 'requests scroll suppression when returning focus after %s', async ( _name, keys ) => {
		const user = userEvent.setup();
		renderChart( undefined, 'below-axis' );
		await openTooltip();
		const focus = jest.spyOn( screen.getByRole( 'grid' ), 'focus' );
		try {
			await user.keyboard( keys );
			expect( focus ).toHaveBeenCalledWith( { preventScroll: true } );
		} finally {
			focus.mockRestore();
		}
	} );

	it.each( [
		[ 'Tab', '{Tab}' ],
		[ 'Escape', '{Escape}' ],
	] )( 'keeps default focus scrolling when returning focus after %s', async ( _name, keys ) => {
		const user = userEvent.setup();
		renderChart();
		await openTooltip();
		const focus = jest.spyOn( screen.getByRole( 'grid' ), 'focus' );
		try {
			await user.keyboard( keys );
			expect( focus ).toHaveBeenCalledWith();
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
const NavigationHarness = ( {
	totalPoints,
	trackBlur = false,
}: {
	totalPoints: number;
	trackBlur?: boolean;
} ) => {
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >();
	const [ isNavigating, setIsNavigating ] = useState( false );
	const chartRef = useRef< HTMLDivElement >( null );
	const { onChartKeyDown, onChartBlur, onChartPointerMove } = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints,
	} );
	const moveToFour = useCallback( () => onChartPointerMove( 4 ), [ onChartPointerMove ] );
	const moveToOne = useCallback( () => onChartPointerMove( 1 ), [ onChartPointerMove ] );

	return (
		<>
			<div
				role="grid"
				aria-label="Harness"
				tabIndex={ 0 }
				onKeyDown={ onChartKeyDown }
				onBlur={ trackBlur ? onChartBlur : undefined }
			>
				<div ref={ chartRef } data-testid="selected-index">
					{ selectedIndex ?? 'none' }
					<button type="button">Inside</button>
				</div>
				<div data-testid="point-4" onPointerMove={ moveToFour } />
				<div data-testid="point-1" onPointerMove={ moveToOne } />
			</div>
			<button type="button">Outside</button>
		</>
	);
};

describe( 'useKeyboardNavigation', () => {
	const navigate = async ( presses: number ) => {
		const user = userEvent.setup();
		const view = render( <NavigationHarness totalPoints={ 6 } /> );

		screen.getByRole( 'grid', { name: 'Harness' } ).focus();
		for ( let i = 0; i < presses; i++ ) {
			await user.keyboard( '{ArrowRight}' );
		}
		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( String( presses - 1 ) );

		return { user, view };
	};

	it( 'moves the selection to the last point when the count shrinks while the grid has focus', async () => {
		const { view } = await navigate( 6 );

		view.rerender( <NavigationHarness totalPoints={ 3 } /> );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '2' );
		expect( screen.getByRole( 'grid', { name: 'Harness' } ) ).toHaveFocus();
	} );

	// In range rather than past the end: the effect reconciles on any count change, not only an overflow.
	it( 'clears an in-range selection when the count changes after focus has left the chart', async () => {
		const { view } = await navigate( 2 );

		screen.getByRole( 'button', { name: 'Outside' } ).focus();
		view.rerender( <NavigationHarness totalPoints={ 3 } /> );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( 'none' );
	} );

	it( 'returns focus to the grid on Escape when there are no points', async () => {
		const user = userEvent.setup();
		render( <NavigationHarness totalPoints={ 0 } /> );

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		await user.keyboard( '{Escape}' );

		expect( screen.getByRole( 'grid', { name: 'Harness' } ) ).toHaveFocus();
	} );

	it( 'returns focus to the grid when the count drops to zero while focus is in the chart', async () => {
		const { view } = await navigate( 2 );

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		view.rerender( <NavigationHarness totalPoints={ 0 } /> );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( 'none' );
		expect( screen.getByRole( 'grid', { name: 'Harness' } ) ).toHaveFocus();
	} );

	it( 'hands a keyboard selection to the pointer and continues from where the pointer is', async () => {
		const { user } = await navigate( 2 );

		screen.getByRole( 'button', { name: 'Inside' } ).focus();
		await user.hover( screen.getByTestId( 'point-4' ) );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( 'none' );
		expect( screen.getByRole( 'grid', { name: 'Harness' } ) ).toHaveFocus();

		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '5' );
	} );

	it( 'continues from the last point the pointer reached after taking over', async () => {
		const { user } = await navigate( 2 );

		await user.hover( screen.getByTestId( 'point-4' ) );
		await user.hover( screen.getByTestId( 'point-1' ) );
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '2' );
	} );

	it( 'restarts from the first point once focus leaves after the pointer took over', async () => {
		const user = userEvent.setup();
		render( <NavigationHarness totalPoints={ 6 } trackBlur /> );
		const grid = screen.getByRole( 'grid', { name: 'Harness' } );

		act( () => grid.focus() );
		await user.keyboard( '{ArrowRight}{ArrowRight}' );
		await user.hover( screen.getByTestId( 'point-4' ) );
		act( () => screen.getByRole( 'button', { name: 'Outside' } ).focus() );
		act( () => grid.focus() );
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '0' );
	} );

	it( 'leaves focus outside the chart when the pointer ends a selection', async () => {
		const { user } = await navigate( 2 );
		const outside = screen.getByRole( 'button', { name: 'Outside' } );

		outside.focus();
		await user.hover( screen.getByTestId( 'point-4' ) );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( 'none' );
		expect( outside ).toHaveFocus();
	} );

	it( 'ignores the pointer when there is no keyboard selection', async () => {
		const user = userEvent.setup();
		render( <NavigationHarness totalPoints={ 6 } /> );

		screen.getByRole( 'grid', { name: 'Harness' } ).focus();
		await user.hover( screen.getByTestId( 'point-4' ) );
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'selected-index' ) ).toHaveTextContent( '0' );
	} );

	// The page sees the event after the handler, so this is what a surrounding scroll or Modal gets.
	const recordPageKeyDown = () => {
		const onKeyDown = jest.fn< void, [ KeyboardEvent ] >();
		document.addEventListener( 'keydown', onKeyDown );
		return { onKeyDown, stop: () => document.removeEventListener( 'keydown', onKeyDown ) };
	};

	it( 'leaves keys it does not handle available to the page', async () => {
		const user = userEvent.setup();
		render( <NavigationHarness totalPoints={ 6 } /> );
		const { onKeyDown, stop } = recordPageKeyDown();

		try {
			screen.getByRole( 'grid', { name: 'Harness' } ).focus();
			await user.keyboard( '{ArrowDown}{PageDown}[Space]' );

			expect( onKeyDown ).toHaveBeenCalledTimes( 3 );
			for ( const [ event ] of onKeyDown.mock.calls ) {
				expect( event.defaultPrevented ).toBe( false );
			}
		} finally {
			stop();
		}
	} );

	// `@wordpress/components` Modal skips its own close-on-Escape once the event is defaultPrevented.
	it( 'leaves Escape to the page when there is no selection to dismiss', async () => {
		const user = userEvent.setup();
		render( <NavigationHarness totalPoints={ 6 } /> );
		const { onKeyDown, stop } = recordPageKeyDown();

		try {
			screen.getByRole( 'grid', { name: 'Harness' } ).focus();
			await user.keyboard( '{Escape}' );

			expect( onKeyDown.mock.calls[ 0 ][ 0 ].defaultPrevented ).toBe( false );

			await user.keyboard( '{ArrowRight}{Escape}' );

			expect( onKeyDown.mock.calls.at( -1 )?.[ 0 ].defaultPrevented ).toBe( true );
		} finally {
			stop();
		}
	} );
} );
