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
} );
