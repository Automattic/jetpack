import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { GlobalChartsProvider } from '../../../providers';
import AreaChart, { AreaChartUnresponsive } from '../area-chart';
import type { SingleChartRef } from '../../private/single-chart-context';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

describe( 'AreaChart', () => {
	const defaultProps = {
		width: 500,
		height: 300,
		data: [
			{
				label: 'Series A',
				data: [
					{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
					{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
				],
			},
			{
				label: 'Series B',
				data: [
					{ date: new Date( '2024-01-01' ), value: 5, label: 'Jan 1' },
					{ date: new Date( '2024-01-02' ), value: 15, label: 'Jan 2' },
				],
			},
		],
	};

	const renderWithProvider = ( props = {}, children: React.ReactNode = undefined ) => {
		return render(
			<GlobalChartsProvider>
				<AreaChart { ...defaultProps } { ...props }>
					{ children }
				</AreaChart>
			</GlobalChartsProvider>
		);
	};

	const renderUnresponsive = ( props = {}, ref?: React.Ref< SingleChartRef > ) => {
		return render(
			<GlobalChartsProvider>
				<AreaChartUnresponsive { ...defaultProps } { ...props } ref={ ref } />
			</GlobalChartsProvider>
		);
	};

	describe( 'Data Validation', () => {
		test( 'shows error when data is empty', () => {
			renderWithProvider( { data: [] } );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'shows error for null values', () => {
			renderWithProvider( {
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: null as number | null },
							{ date: new Date( '2024-01-02' ), value: 5 },
						],
					},
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'shows error for invalid dates', () => {
			renderWithProvider( {
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( 'invalid' ), value: 10 },
							{ date: new Date( '2024-01-02' ), value: 20 },
						],
					},
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'shows error when a series has empty data', () => {
			// A non-empty series guards against the "No data available" path
			// for the top-level array; the empty-series check is a separate guard.
			renderWithProvider( {
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10 } ],
					},
					{
						label: 'Series B (empty)',
						data: [],
					},
				],
			} );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'renders with valid data', () => {
			renderWithProvider();
			expect( screen.getByRole( 'grid', { name: /area chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Stacking', () => {
		test( 'is stacked by default', () => {
			renderWithProvider();
			// Both series should be rendered, regardless of mode.
			expect( screen.getByTestId( 'area-chart-series-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'area-chart-series-1' ) ).toBeInTheDocument();
		} );

		test( 'renders unstacked when stacked={ false }', () => {
			renderWithProvider( { stacked: false } );
			expect( screen.getByTestId( 'area-chart-series-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'area-chart-series-1' ) ).toBeInTheDocument();
		} );

		test( 'accepts custom stackOffset', () => {
			renderWithProvider( { stackOffset: 'expand' } );
			expect( screen.getByRole( 'grid', { name: /area chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Legend', () => {
		test( 'shows legend when showLegend is true', () => {
			renderWithProvider( { showLegend: true } );
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'hides legend by default', () => {
			renderWithProvider();
			expect( screen.queryByText( 'Series A' ) ).not.toBeInTheDocument();
		} );

		test( 'renders composition legend as child component', () => {
			renderWithProvider( {}, <AreaChart.Legend /> );
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
		} );
	} );

	describe( 'Interactive legend', () => {
		test( 'keeps every series mounted after hiding one (stacked)', async () => {
			const user = userEvent.setup();
			renderWithProvider( {
				showLegend: true,
				chartId: 'test-interactive-stacked',
				legend: { interactive: true },
			} );

			expect( screen.getByTestId( 'area-chart-series-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'area-chart-series-1' ) ).toBeInTheDocument();

			await user.click( screen.getByText( 'Series A' ) );

			// Both series remain in the DOM (hidden one is zeroed via yAccessor,
			// not unmounted) so that visx stack indices stay stable.
			expect( screen.getByTestId( 'area-chart-series-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'area-chart-series-1' ) ).toBeInTheDocument();
		} );

		test( 'keeps every series mounted after hiding one (unstacked)', async () => {
			const user = userEvent.setup();
			renderWithProvider( {
				stacked: false,
				showLegend: true,
				chartId: 'test-interactive-unstacked',
				legend: { interactive: true },
			} );

			await user.click( screen.getByText( 'Series A' ) );

			expect( screen.getByTestId( 'area-chart-series-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'area-chart-series-1' ) ).toBeInTheDocument();
		} );

		test( 'tooltip omits hidden series after toggle', async () => {
			const user = userEvent.setup();
			renderWithProvider( {
				showLegend: true,
				chartId: 'test-interactive-tooltip',
				legend: { interactive: true },
			} );

			await user.click( screen.getByText( 'Series A' ) );

			// Open a tooltip via keyboard navigation, then verify the hidden
			// series' label is absent from the rendered tooltip rows.
			const chart = screen.getByRole( 'grid', { name: /area chart/i } );
			chart.focus();
			await user.keyboard( '{ArrowRight}' );

			const tooltip = await screen.findByRole( 'tooltip' );
			expect( tooltip ).not.toHaveTextContent( 'Series A' );
			expect( tooltip ).toHaveTextContent( 'Series B' );
		} );

		test( 'renderTooltip receives only visible series in datumByKey', async () => {
			const user = userEvent.setup();
			const renderTooltip = jest.fn( () => <div>tooltip</div> );
			renderWithProvider( {
				showLegend: true,
				chartId: 'test-interactive-render-tooltip',
				legend: { interactive: true },
				renderTooltip,
			} );

			await user.click( screen.getByText( 'Series A' ) );
			const chart = screen.getByRole( 'grid', { name: /area chart/i } );
			chart.focus();
			await user.keyboard( '{ArrowRight}' );

			// `renderTooltip` may be called for non-keyboard events too, but the
			// keyboard-driven call must have filtered datumByKey down to visible series.
			const calls = renderTooltip.mock.calls as unknown as Array<
				[
					{
						tooltipData?: {
							datumByKey?: Record< string, unknown >;
							nearestDatum?: { key: string };
						};
					},
				]
			>;
			const keyboardCall = calls.find( ( [ params ] ) => params?.tooltipData?.datumByKey );
			expect( keyboardCall ).toBeDefined();
			const keys = Object.keys( keyboardCall![ 0 ].tooltipData!.datumByKey! );
			expect( keys ).toContain( 'Series B' );
			expect( keys ).not.toContain( 'Series A' );
			// And `nearestDatum` should never point at a hidden series.
			expect( keyboardCall![ 0 ].tooltipData?.nearestDatum?.key ).not.toBe( 'Series A' );
		} );

		test( 'y-axis rescales across legend toggles by default', async () => {
			const user = userEvent.setup();
			const ref = createRef< SingleChartRef >();
			render(
				<GlobalChartsProvider>
					<AreaChartUnresponsive
						{ ...defaultProps }
						showLegend
						chartId="test-interactive-domain-rescale"
						legend={ { interactive: true } }
						ref={ ref }
					/>
				</GlobalChartsProvider>
			);

			const initialDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			expect( initialDomain ).toBeDefined();

			await user.click( screen.getByText( 'Series A' ) );

			const afterToggleDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			// Hiding Series A drops the upper bound; visx should refit.
			expect( afterToggleDomain ).toBeDefined();
			expect( afterToggleDomain![ 1 ] ).toBeLessThan( initialDomain![ 1 ] );
		} );

		test( 'y-axis stays pinned for unstacked area when rescaleYOnLegendToggle is false', async () => {
			// Exercises the non-stacked branch of fixedYDomain, which scans the
			// raw min/max across all series rather than summing stack columns.
			const user = userEvent.setup();
			const ref = createRef< SingleChartRef >();
			render(
				<GlobalChartsProvider>
					<AreaChartUnresponsive
						{ ...defaultProps }
						showLegend
						chartId="test-interactive-domain-pin-unstacked"
						legend={ { interactive: true } }
						stacked={ false }
						rescaleYOnLegendToggle={ false }
						ref={ ref }
					/>
				</GlobalChartsProvider>
			);

			const initialDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			expect( initialDomain ).toBeDefined();
			// defaultProps has values up to 20; pinned-unstacked should cover the max.
			expect( initialDomain![ 1 ] ).toBeGreaterThanOrEqual( 20 );

			await user.click( screen.getByText( 'Series A' ) );

			const afterToggleDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			expect( afterToggleDomain ).toEqual( initialDomain );
		} );

		test( 'y-axis stays pinned when rescaleYOnLegendToggle is false', async () => {
			const user = userEvent.setup();
			const ref = createRef< SingleChartRef >();
			render(
				<GlobalChartsProvider>
					<AreaChartUnresponsive
						{ ...defaultProps }
						showLegend
						chartId="test-interactive-domain-pin"
						legend={ { interactive: true } }
						rescaleYOnLegendToggle={ false }
						ref={ ref }
					/>
				</GlobalChartsProvider>
			);

			const initialDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			expect( initialDomain ).toBeDefined();

			await user.click( screen.getByText( 'Series A' ) );

			const afterToggleDomain = (
				ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined
			 )?.domain();
			expect( afterToggleDomain ).toEqual( initialDomain );
		} );

		test( 'supports negative stacked values without clipping (with pinned Y)', () => {
			// The mixed-sign full-extent pin only kicks in when the consumer
			// opts into pinned-Y behavior; visx's natural domain derivation for
			// a `stackOffset: 'none'` stack does not extend below zero for
			// purely-negative series, which is what this test guards against.
			const ref = createRef< SingleChartRef >();
			render(
				<GlobalChartsProvider>
					<AreaChartUnresponsive
						width={ 500 }
						height={ 300 }
						chartId="test-interactive-negative"
						showLegend
						legend={ { interactive: true } }
						rescaleYOnLegendToggle={ false }
						data={ [
							{
								label: 'Pos',
								data: [
									{ date: new Date( '2024-01-01' ), value: 10 },
									{ date: new Date( '2024-01-02' ), value: 20 },
								],
							},
							{
								label: 'Neg',
								data: [
									{ date: new Date( '2024-01-01' ), value: -5 },
									{ date: new Date( '2024-01-02' ), value: -15 },
								],
							},
						] }
						ref={ ref }
					/>
				</GlobalChartsProvider>
			);

			const [ min, max ] =
				( ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined )?.domain() ??
				[];
			expect( min ).toBeLessThanOrEqual( -15 );
			expect( max ).toBeGreaterThanOrEqual( 20 );
		} );

		test( 'does not pin domain for non-default stack offsets', () => {
			const ref = createRef< SingleChartRef >();
			render(
				<GlobalChartsProvider>
					<AreaChartUnresponsive
						{ ...defaultProps }
						chartId="test-interactive-expand"
						showLegend
						legend={ { interactive: true } }
						stackOffset="expand"
						ref={ ref }
					/>
				</GlobalChartsProvider>
			);

			// `expand` normalises to [0,1]; if we accidentally pinned the raw-sum
			// domain (e.g. [0, 35]), the top of the domain would be far above 1.
			const [ min, max ] =
				( ref.current?.getScales()?.yScale as { domain: () => number[] } | undefined )?.domain() ??
				[];
			expect( min ).toBeGreaterThanOrEqual( 0 );
			expect( max ).toBeLessThanOrEqual( 1.001 );
		} );
	} );

	describe( 'Without GlobalChartsProvider', () => {
		test( 'self-wraps in a provider when none is present', () => {
			render( <AreaChartUnresponsive { ...defaultProps } /> );
			expect( screen.getByRole( 'grid', { name: /area chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'chart container has expected ARIA attributes', () => {
			renderWithProvider();
			const chart = screen.getByRole( 'grid', { name: /area chart/i } );
			expect( chart ).toHaveAttribute( 'tabIndex', '0' );
			expect( chart ).toHaveAttribute( 'aria-label', 'Area chart' );
		} );
	} );

	describe( 'Chart Ref Interface', () => {
		test( 'exposes getScales via ref', () => {
			const ref = createRef< SingleChartRef >();
			renderUnresponsive( {}, ref );

			expect( ref.current?.getScales() ).toBeDefined();
			expect( ref.current?.getScales()?.xScale ).toBeDefined();
			expect( ref.current?.getScales()?.yScale ).toBeDefined();
		} );

		test( 'exposes getChartDimensions via ref', () => {
			const ref = createRef< SingleChartRef >();
			renderUnresponsive( { width: 800, height: 400 }, ref );

			const dimensions = ref.current?.getChartDimensions();
			expect( dimensions?.width ).toBe( 800 );
			expect( dimensions?.height ).toBe( 400 );
		} );
	} );

	describe( 'Tooltips', () => {
		test( 'tooltips can be disabled', () => {
			renderWithProvider( { withTooltips: false } );
			// Tooltip portal element should not be present.
			expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Hover glyphs', () => {
		// Trigger the AccessibleTooltip's keyboard nav so a tooltip is opened
		// against a known datum index, which is the only reliable way to
		// surface the visx TooltipContext state in a jsdom environment.
		const focusFirstDatum = async () => {
			const user = userEvent.setup();
			const chart = screen.getByRole( 'grid', { name: /area chart/i } );
			chart.focus();
			await user.keyboard( '{ArrowRight}' );
		};

		test( 'renders one glyph per visible series in stacked + offset="none"', async () => {
			renderWithProvider();
			await focusFirstDatum();

			const glyphs = screen.getAllByTestId( /^area-chart-hover-glyph-/ );
			expect( glyphs ).toHaveLength( 2 );
		} );

		test( 'renders no glyphs when stackOffset is "expand"', async () => {
			renderWithProvider( { stackOffset: 'expand' } );
			await focusFirstDatum();

			expect( screen.queryAllByTestId( /^area-chart-hover-glyph-/ ) ).toHaveLength( 0 );
		} );

		test( 'renders no glyphs when stackOffset is "wiggle"', async () => {
			renderWithProvider( { stackOffset: 'wiggle' } );
			await focusFirstDatum();

			expect( screen.queryAllByTestId( /^area-chart-hover-glyph-/ ) ).toHaveLength( 0 );
		} );

		test( 'renders no glyphs when stackOffset is "silhouette"', async () => {
			renderWithProvider( { stackOffset: 'silhouette' } );
			await focusFirstDatum();

			expect( screen.queryAllByTestId( /^area-chart-hover-glyph-/ ) ).toHaveLength( 0 );
		} );

		test( 'renders glyphs in unstacked mode', async () => {
			renderWithProvider( { stacked: false } );
			await focusFirstDatum();

			const glyphs = screen.getAllByTestId( /^area-chart-hover-glyph-/ );
			expect( glyphs ).toHaveLength( 2 );
		} );

		test( 'renders glyphs in unstacked mode with interactive legend', async () => {
			renderWithProvider( {
				stacked: false,
				showLegend: true,
				chartId: 'test-unstacked-interactive',
				legend: { interactive: true },
			} );
			await focusFirstDatum();

			const glyphs = screen.getAllByTestId( /^area-chart-hover-glyph-/ );
			expect( glyphs ).toHaveLength( 2 );
		} );

		test( 'renders glyphs only for series with a datum at the hovered x (mismatched x-domains)', async () => {
			// Each series' data[0] is a different date. Keyboard nav fires
			// showTooltip for every series at its own data[selectedIndex];
			// the LAST one wins as the nearestDatum, so the resolved hover
			// date is Series B's. HoverGlyphs should:
			//   - Skip Series A (no datum at Series B's date) — cumulative += 0
			//   - Render a glyph for Series B
			renderWithProvider( {
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10 } ],
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-15' ), value: 5 } ],
					},
				],
			} );
			await focusFirstDatum();

			const glyphs = screen.getAllByTestId( /^area-chart-hover-glyph-/ );
			expect( glyphs ).toHaveLength( 1 );
			// Only Series B (index 1) has a datum at the hovered date.
			expect( screen.getByTestId( 'area-chart-hover-glyph-1' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'area-chart-hover-glyph-0' ) ).not.toBeInTheDocument();
		} );
	} );

	// The area is animated, so it clips whenever zoomable (not just while zoomed).
	test( 'clips the series to the plot when zoomable', () => {
		renderUnresponsive( { zoomable: true, chartId: 'zoomtest' } );

		expect( screen.getByTestId( 'chart-series-clip-group' ) ).toHaveAttribute(
			'clip-path',
			'url(#chart-zoom-clip-zoomtest)'
		);
	} );
} );
