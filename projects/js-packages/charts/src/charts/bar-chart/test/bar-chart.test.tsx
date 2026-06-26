import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import BarChart from '../bar-chart';
import { useBarChartOptions } from '../private';

// Mock useElementSize to return non-zero dimensions in jsdom so charts render
const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

describe( 'BarChart', () => {
	const defaultProps = {
		width: 500,
		height: 300,
		data: [
			{
				label: 'Series A',
				data: [
					{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
					{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
					{ date: new Date( '2024-01-03' ), value: 30 },
				],
				options: {},
			},
		],
	};

	const renderWithTheme = ( props = {}, children = undefined ) => {
		return render(
			<GlobalChartsProvider>
				<BarChart { ...defaultProps } { ...props }>
					{ children }
				</BarChart>
			</GlobalChartsProvider>
		);
	};

	describe( 'Data Validation', () => {
		test( 'handles empty data array', () => {
			renderWithTheme( { data: [] } );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: -10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: -20, label: 'Jan 2' },
						],
						options: {},
					},
				],
			} );
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();
		} );

		test( 'handles null or undefined values', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: null as number | null, label: 'Jan 1' },
							{
								date: new Date( '2024-01-02' ),
								value: undefined as number | undefined,
								label: 'Jan 2',
							},
						],
						options: {},
					},
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'handles invalid date values', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( 'invalid' ), value: 10 },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {},
					},
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'handles invalid label values', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Series A',
						data: [
							{ label: '', value: 10 }, // Empty label
							{ label: 'Label 2', value: 20 },
						],
						options: {},
					},
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Legend', () => {
		const multiSeriesData = [
			{
				label: 'Series A',
				data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
				options: {},
			},
			{
				label: 'Series B',
				data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
				options: {},
			},
		];

		test( 'shows legend when showLegend is true', () => {
			renderWithTheme( { showLegend: true, data: multiSeriesData } );
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'hides legend when showLegend is false', () => {
			renderWithTheme( { showLegend: false, data: multiSeriesData } );
			expect( screen.queryByText( 'Series A' ) ).not.toBeInTheDocument();
		} );

		test( 'renders composition legend as child component', () => {
			renderWithTheme( { data: multiSeriesData }, <BarChart.Legend /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'renders composition legend regardless of showLegend value', () => {
			renderWithTheme( { data: multiSeriesData, showLegend: false }, <BarChart.Legend /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
		} );

		test( 'renders composition legend in top position', () => {
			renderWithTheme( { data: multiSeriesData }, <BarChart.Legend position="top" /> );

			// Legend should appear before the chart content in DOM order
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			const html = document.body.innerHTML;
			expect( html.indexOf( 'data-testid="legend-horizontal"' ) ).toBeLessThan(
				html.indexOf( 'role="grid"' )
			);
		} );
	} );

	describe( 'Grid Visibility', () => {
		test( 'renders with different grid visibility options', () => {
			const { rerender } = renderWithTheme( { gridVisibility: 'x' } );
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			rerender(
				<GlobalChartsProvider>
					<BarChart { ...defaultProps } gridVisibility="y" />
				</GlobalChartsProvider>
			);
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			rerender(
				<GlobalChartsProvider>
					<BarChart { ...defaultProps } gridVisibility="xy" />
				</GlobalChartsProvider>
			);
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Custom tickFormat', () => {
		test( 'renders with custom tickFormat', () => {
			renderWithTheme( {
				options: {
					axis: {
						x: {
							tickFormat: ( timestamp: number ) => {
								const date = new Date( timestamp );
								return date.toLocaleDateString( 'en-US', { dateStyle: 'short' } );
							},
						},
					},
				},
			} );

			// Query for tspan elements that contain the formatted date.
			const tspansWithDate = screen.getAllByText( '1/3/24' );
			expect( tspansWithDate.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Pattern', () => {
		test( 'renders with patterns', () => {
			renderWithTheme( { withPatterns: true } );
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			// Check that pattern definitions container is present
			expect( screen.getByTestId( 'bar-chart-patterns' ) ).toBeInTheDocument();
		} );

		test( 'renders without patterns by default', () => {
			renderWithTheme( { withPatterns: false } );
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			// Check that no pattern definitions container is present
			expect( screen.queryByTestId( 'bar-chart-patterns' ) ).not.toBeInTheDocument();
		} );

		test( 'comparison shadow reuses the primary bar pattern when patterns are enabled', () => {
			renderWithTheme( {
				withPatterns: true,
				data: [
					{
						label: 'This period',
						group: 'views',
						data: [
							{ label: 'Mon', value: 10 },
							{ label: 'Tue', value: 20 },
						],
					},
					{
						label: 'Previous period',
						group: 'views',
						options: { type: 'comparison' as const },
						data: [
							{ label: 'Mon', value: 15 },
							{ label: 'Tue', value: 25 },
						],
					},
				],
			} );

			const shadow = screen.getAllByTestId( /^bar-chart-comparison-\d+-\d+$/ )[ 0 ];
			const shadowFill = shadow.getAttribute( 'fill' );
			// Shadow is filled with a pattern, not a solid color, and it references the PRIMARY
			// series' pattern (index 0) rather than the comparison series' own index.
			expect( shadowFill ).toMatch( /^url\(#bar-pattern-.+-0\)$/ );
		} );
	} );

	describe( 'Keyboard Navigation Accessibility', () => {
		describe( 'Chart Focus and Accessibility Attributes', () => {
			test( 'chart container has proper accessibility attributes', () => {
				renderWithTheme();
				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );

				expect( chart ).toHaveAttribute( 'tabIndex', '0' );
				expect( chart ).toHaveAttribute( 'role', 'grid' );
				expect( chart ).toHaveAttribute( 'aria-label', 'Bar chart' );
			} );

			test( 'chart container can receive focus', async () => {
				const user = userEvent.setup();
				renderWithTheme();
				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );

				await user.tab();
				expect( chart ).toHaveFocus();
			} );
		} );

		describe( 'Arrow Key Navigation', () => {
			test( 'right arrow key navigates to next data point', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'Series A',
							group: 'Series A',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
							options: {},
						},
						{
							label: 'Series B',
							group: 'Series B',
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
							options: {},
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Single tab should focus on the first tooltip.
				await user.keyboard( '{ArrowRight}' );
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Series A' );
				// The category/value row joins with a space after the colon.
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Jan 1: 10' );
				expect( screen.queryByTestId( 'chart-tooltip-1' ) ).not.toBeInTheDocument();

				// Second tab should focus on the second tooltip.
				await user.keyboard( '{ArrowRight}' );
				expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveFocus();
				expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveTextContent( 'Series B' );
				expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();
			} );

			test( 'left arrow key navigates to previous data point', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'Series A',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
							options: {},
						},
						{
							label: 'Series B',
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
							options: {},
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Right arrow key should focus on the first tooltip.
				await user.keyboard( '{ArrowRight}' );
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Series A' );
				expect( screen.queryByTestId( 'chart-tooltip-1' ) ).not.toBeInTheDocument();

				// Right arrow key should focus on the second tooltip.
				await user.keyboard( '{ArrowRight}' );
				expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveFocus();
				expect( screen.getByTestId( 'chart-tooltip-1' ) ).toHaveTextContent( 'Series B' );
				expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();

				// Left arrow key should focus on the first tooltip.
				await user.keyboard( '{ArrowLeft}' );
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Series A' );
				expect( screen.queryByTestId( 'chart-tooltip-1' ) ).not.toBeInTheDocument();
			} );
		} );

		describe( 'Comparison tooltip', () => {
			test( 'tooltip shows both the primary and comparison values', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'This period',
							group: 'views',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
						},
						{
							label: 'Previous period',
							group: 'views',
							options: { type: 'comparison' as const },
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				await user.keyboard( '{ArrowRight}' );
				const tooltip = screen.getByTestId( 'chart-tooltip-0' );
				// Both periods are shown, each as "label: value" with a space after the colon.
				expect( tooltip ).toHaveTextContent( 'This period: 10' );
				expect( tooltip ).toHaveTextContent( 'Previous period: 15' );
			} );

			test( 'keyboard navigation past the first slot stays on the primary bar, not the comparison series', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'This period',
							group: 'views',
							data: [
								{ label: 'Mon', value: 10 },
								{ label: 'Tue', value: 20 },
							],
						},
						{
							label: 'Previous period',
							group: 'views',
							options: { type: 'comparison' as const },
							data: [
								{ label: 'Mon', value: 15 },
								{ label: 'Tue', value: 25 },
							],
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Slot 0 is the first primary bar (Mon); slot 1 must be the SECOND primary
				// bar (Tue) — not the comparison series' first bar. The keyboard index space
				// counts only primary bars, so the tooltip must too.
				await user.keyboard( '{ArrowRight}' );
				await user.keyboard( '{ArrowRight}' );
				const tooltip = screen.getByTestId( 'chart-tooltip-1' );
				expect( tooltip ).toHaveTextContent( 'Tue' );
				expect( tooltip ).toHaveTextContent( 'This period' );
				expect( tooltip ).toHaveTextContent( '20' );
				expect( tooltip ).toHaveTextContent( 'Previous period' );
				expect( tooltip ).toHaveTextContent( '25' );
			} );
		} );

		describe( 'Tab Key Navigation', () => {
			test( 'tab key exits navigation when reaching end of data points', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					data: [
						{
							label: 'Series A',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
							options: {},
						},
						{
							label: 'Series B',
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
							options: {},
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Chart should be in focus.
				expect( chart ).toHaveFocus();

				// Clicking tab should not open any tooltips.
				await user.tab();
				expect( screen.queryByTestId( 'chart-tooltip-1' ) ).not.toBeInTheDocument();
				expect( screen.queryByTestId( 'chart-tooltip-0' ) ).not.toBeInTheDocument();
				// Chart should no longer be in focus.
				expect( chart ).not.toHaveFocus();
			} );
		} );

		describe( 'Keyboard Highlighting', () => {
			test( 'shows tooltip when navigating with keyboard', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'Series A',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
							options: {},
						},
						{
							label: 'Series B',
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
							options: {},
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Navigate to the first bar
				await user.keyboard( '{ArrowRight}' );

				// Check that the tooltip appears for Series A
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toBeInTheDocument();
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Series A' );
			} );

			test( 'generates correct CSS selector for keyboard highlighting', async () => {
				const user = userEvent.setup();
				renderWithTheme( {
					withTooltips: true,
					data: [
						{
							label: 'Series A',
							data: [
								{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							],
							options: {},
						},
						{
							label: 'Series B',
							data: [
								{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							],
							options: {},
						},
					],
				} );

				const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
				chart.focus();

				// Navigate to the first bar (Series A, Jan 1)
				await user.keyboard( '{ArrowRight}' );

				// Check that styles are generated by looking for the chart container with data-chart-id
				const chartContainer = screen.getByTestId( 'bar-chart' );
				expect( chartContainer ).toBeInTheDocument();

				// Verify tooltip is showing (which indicates highlighting is working)
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toBeInTheDocument();
				expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( 'Series A' );
			} );
		} );

		test( 'keyboard navigation works with custom tooltip renderer', async () => {
			const user = userEvent.setup();
			const customTooltipRenderer = jest.fn( ( { tooltipData } ) => (
				<div role="tooltip" data-testid="custom-tooltip">
					Custom:{ ' ' }
					{ tooltipData?.nearestDatum?.datum?.date?.toLocaleDateString( 'ja-JP', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					} ) }
				</div>
			) );

			renderWithTheme( { withTooltips: true, renderTooltip: customTooltipRenderer } );

			const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
			chart.focus();

			// Click on right arrow key to focus on the first tooltip.
			await user.keyboard( '{ArrowRight}' );

			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '2024年1月1日月曜日' );

			const customTooltip = screen.getByTestId( 'custom-tooltip' );
			expect( customTooltip ).toBeInTheDocument();
			expect( customTooltipRenderer ).toHaveBeenCalled();
		} );
	} );

	/* eslint-disable testing-library/no-node-access */
	describe( 'Zero Value Display', () => {
		test( 'renders visible bars for zero values with default settings', () => {
			renderWithTheme( {
				showZeroValues: true,
				data: [
					{
						label: 'Test Series',
						data: [
							{ label: 'Zero', value: 0 },
							{ label: 'Non-zero', value: 100 },
						],
						options: {},
					},
				],
			} );

			const svgElement = screen.getByRole( 'grid', { name: /bar chart/i } ).querySelector( 'svg' );
			const bars = svgElement?.querySelectorAll( '.visx-bar-group rect' );

			// Should have 2 bars
			expect( bars?.length ).toBe( 2 );

			// Both bars should have height > 0 (zero values get minimum height)
			bars?.forEach( bar => {
				const height = parseFloat( bar.getAttribute( 'height' ) || '0' );
				expect( height ).toBeGreaterThan( 0 );
			} );
		} );

		test( 'Does not render zero-value bars when default showZeroValues is false', () => {
			renderWithTheme( {
				data: [
					{
						label: 'Test Series',
						data: [
							{ label: 'Zero', value: 0 },
							{ label: 'Non-zero', value: 100 },
						],
						options: {},
					},
				],
			} );

			const svgElement = screen.getByRole( 'grid', { name: /bar chart/i } ).querySelector( 'svg' );
			const bars = svgElement?.querySelectorAll( '.visx-bar-group rect' );

			// Should have 2 bars
			expect( bars?.length ).toBe( 2 );

			// Both bars should have height > 0 (zero values get minimum height)
			const barZero = bars[ 0 ];
			const height = parseFloat( barZero.getAttribute( 'height' ) || '0' );
			expect( height ).toBe( 0 );

			// Second bar should have height more than 0.
			const barOne = bars[ 1 ];
			const heightOne = parseFloat( barOne.getAttribute( 'height' ) || '0' );
			expect( heightOne ).toBeGreaterThan( 0 );
		} );

		test( 'works correctly with horizontal orientation', () => {
			renderWithTheme( {
				showZeroValues: true,
				data: [
					{
						label: 'Test Series',
						data: [
							{ label: 'Zero', value: 0 },
							{ label: 'Non-zero', value: 100 },
						],
						options: {},
					},
				],
				orientation: 'horizontal',
			} );

			const svgElement = screen.getByRole( 'grid', { name: /bar chart/i } ).querySelector( 'svg' );
			const bars = svgElement?.querySelectorAll( '.visx-bar-group rect' );

			// Both bars should be visible in horizontal mode
			expect( bars?.length ).toBe( 2 );
			bars?.forEach( bar => {
				const width = parseFloat( bar.getAttribute( 'width' ) || '0' );
				expect( width ).toBeGreaterThan( 0 );
			} );
		} );

		test( 'ensures minimum pixel height for zero values in small charts', () => {
			// With a small chart height (100px) and large data range, zero-value bars
			// should still be visible (at least 3px based on MIN_PIXEL_HEIGHT)
			renderWithTheme( {
				showZeroValues: true,
				height: 100,
				data: [
					{
						label: 'Test Series',
						data: [
							{ label: 'Zero', value: 0 },
							{ label: 'Large', value: 10000 },
						],
						options: {},
					},
				],
			} );

			const svgElement = screen.getByRole( 'grid', { name: /bar chart/i } ).querySelector( 'svg' );
			const bars = svgElement?.querySelectorAll( '.visx-bar-group rect' );

			expect( bars?.length ).toBe( 2 );

			// The zero-value bar (first bar) should have a minimum visible height.
			// We check for >= 2px to allow for rounding in the pixel calculation.
			const zeroBar = bars?.[ 0 ];
			const zeroBarHeight = parseFloat( zeroBar?.getAttribute( 'height' ) || '0' );
			expect( zeroBarHeight ).toBeGreaterThanOrEqual( 2 );
		} );
	} );

	/* eslint-enable testing-library/no-node-access */

	describe( 'Label Overflow Ellipsis', () => {
		const longLabelData = [
			{
				label: 'Series A',
				data: [
					{ label: 'Very Long Category Label One', value: 100 },
					{ label: 'Very Long Category Label Two', value: 200 },
					{ label: 'Very Long Category Label Three', value: 150 },
				],
				options: {},
			},
		];

		test( 'renders chart with labelOverflow ellipsis option', () => {
			renderWithTheme( {
				data: longLabelData,
				options: {
					axis: {
						x: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();
		} );

		test( 'truncates labels with CSS text-overflow ellipsis', () => {
			renderWithTheme( {
				width: 300, // Narrow width to force truncation
				data: longLabelData,
				options: {
					axis: {
						x: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			// Labels should be rendered with truncation styles
			const label = screen.getByText( /Very Long Category Label One/i );
			expect( label ).toHaveStyle( { textOverflow: 'ellipsis' } );
			expect( label ).toHaveStyle( { overflow: 'hidden' } );
			expect( label ).toHaveStyle( { whiteSpace: 'nowrap' } );
		} );

		test( 'sets title attribute for hover tooltips on truncated labels', () => {
			renderWithTheme( {
				width: 300,
				data: longLabelData,
				options: {
					axis: {
						x: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			// Title attribute should show full text on hover
			const label = screen.getByText( /Very Long Category Label One/i );
			expect( label ).toHaveAttribute( 'title', 'Very Long Category Label One' );
		} );

		test( 'applies truncation to x-axis for vertical bar charts', () => {
			renderWithTheme( {
				width: 300,
				data: longLabelData,
				orientation: 'vertical',
				options: {
					axis: {
						x: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			// X-axis labels should have truncation
			const label = screen.getByText( /Very Long Category Label One/i );
			expect( label ).toHaveStyle( { textOverflow: 'ellipsis' } );
		} );

		test( 'applies truncation to y-axis for horizontal bar charts', () => {
			renderWithTheme( {
				width: 300,
				data: longLabelData,
				orientation: 'horizontal',
				options: {
					axis: {
						y: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			// Y-axis labels should have truncation in horizontal mode
			const label = screen.getByText( /Very Long Category Label One/i );
			expect( label ).toHaveStyle( { textOverflow: 'ellipsis' } );
		} );

		test( 'handles very small chart widths gracefully', () => {
			renderWithTheme( {
				width: 100, // Very small width
				data: longLabelData,
				options: {
					axis: {
						x: {
							labelOverflow: 'ellipsis',
						},
					},
				},
			} );

			// Chart should still render without errors
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			// Labels should still be present and have minimum width applied
			const label = screen.getByText( /Very Long Category Label One/i );
			expect( label ).toBeInTheDocument();
		} );

		test( 'does not apply truncation styles when labelOverflow is not set', () => {
			renderWithTheme( {
				width: 300,
				data: longLabelData,
			} );

			// Without labelOverflow, labels should use default SVG text rendering
			// which doesn't have CSS text-overflow
			const labels = screen.getAllByText( /Very Long Category Label/i );
			labels.forEach( label => {
				// SVG text elements don't have textOverflow style
				expect( label.tagName.toLowerCase() ).not.toBe( 'div' );
			} );
		} );
	} );

	describe( 'Comparison Series', () => {
		it( 'renders a translucent shadow behind the primary bar for a comparison series', () => {
			const data = [
				{
					label: 'This year',
					group: 'views',
					data: [
						{ label: 'Jan', value: 100 },
						{ label: 'Feb', value: 120 },
					],
				},
				{
					label: 'Last year',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [
						{ label: 'Jan', value: 80 },
						{ label: 'Feb', value: 140 },
					],
				},
			];
			render( <BarChart data={ data } width={ 400 } height={ 300 } /> );

			// two comparison shadow rects (one per data point)
			// Match individual rect testids like bar-chart-comparison-1-0 (not the group wrapper)
			const shadows = screen.getAllByTestId( /^bar-chart-comparison-\d+-\d+$/ );
			expect( shadows ).toHaveLength( 2 );
			expect( shadows[ 0 ] ).toHaveAttribute( 'opacity', '0.5' );

			// primary bars still render for the single primary series (visx .visx-bar)
			// eslint-disable-next-line testing-library/no-node-access
			const bars = document.querySelectorAll( '.visx-bar' );
			expect( bars.length ).toBeGreaterThanOrEqual( 2 );
		} );

		it( 'hides the comparison shadow group from assistive technology', () => {
			const data = [
				{
					label: 'This year',
					group: 'views',
					data: [ { label: 'Jan', value: 100 } ],
				},
				{
					label: 'Last year',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [ { label: 'Jan', value: 80 } ],
				},
			];
			render( <BarChart data={ data } width={ 400 } height={ 300 } /> );

			// The shadow is decorative: no keyboard/hover target and its value is surfaced
			// through the tooltip, so it must not be announced as a separate element.
			expect( screen.getByTestId( 'bar-chart-comparison-bars' ) ).toHaveAttribute(
				'aria-hidden',
				'true'
			);
		} );

		it( 'renders comparison shadows in horizontal orientation', () => {
			const data = [
				{
					label: 'This year',
					group: 'views',
					data: [
						{ label: 'Jan', value: 100 },
						{ label: 'Feb', value: 120 },
					],
				},
				{
					label: 'Last year',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [
						{ label: 'Jan', value: 80 },
						{ label: 'Feb', value: 140 },
					],
				},
			];
			render( <BarChart data={ data } orientation="horizontal" width={ 400 } height={ 300 } /> );

			const shadows = screen.getAllByTestId( /^bar-chart-comparison-\d+-\d+$/ );
			expect( shadows ).toHaveLength( 2 );
			expect( shadows[ 0 ] ).toHaveAttribute( 'opacity', '0.5' );
		} );

		it( 'expands value-axis domain to include comparison values exceeding the primary max', () => {
			// Comparison value 150 exceeds primary max 100.
			// Without domain expansion the value-axis scale config has no explicit domain,
			// so visx derives it from primary BarSeries only (max=100).
			// With the fix, an explicit domain [min,150] is set on the value-axis scale config.
			const data = [
				{
					label: 'This year',
					group: 'views',
					data: [ { label: 'Jan', value: 100 } ],
				},
				{
					label: 'Last year',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [ { label: 'Jan', value: 150 } ],
				},
			];

			const { result } = renderHook( () => useBarChartOptions( data, false, {} ) );
			const yScale = result.current.yScale as { domain?: number[] };
			// domain must be set explicitly and its max must be >= 150
			expect( yScale.domain ).toBeDefined();
			expect( ( yScale.domain as number[] )[ 1 ] ).toBeGreaterThanOrEqual( 150 );
		} );

		it( 'keeps the value-axis baseline at zero so comparison bars encode magnitude truthfully', () => {
			// All values are well above zero; the domain must still start at 0 so a bar's
			// length stays proportional to its value (a non-zero baseline exaggerates differences).
			const data = [
				{
					label: 'This period',
					group: 'views',
					data: [ { label: 'Mon', value: 420 } ],
				},
				{
					label: 'Previous period',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [ { label: 'Mon', value: 510 } ],
				},
			];

			const { result } = renderHook( () => useBarChartOptions( data, false, {} ) );
			const yScale = result.current.yScale as { domain?: number[] };
			expect( yScale.domain ).toBeDefined();
			expect( ( yScale.domain as number[] )[ 0 ] ).toBe( 0 );
		} );

		it( 'zero-bases the value-axis domain in horizontal comparison charts', () => {
			const data = [
				{
					label: 'This period',
					group: 'views',
					data: [ { label: 'Mon', value: 420 } ],
				},
				{
					label: 'Previous period',
					group: 'views',
					options: { type: 'comparison' as const },
					data: [ { label: 'Mon', value: 510 } ],
				},
			];

			// In horizontal charts the value axis is x.
			const { result } = renderHook( () => useBarChartOptions( data, true, {} ) );
			const xScale = result.current.xScale as { domain?: number[] };
			expect( xScale.domain ).toBeDefined();
			expect( ( xScale.domain as number[] )[ 0 ] ).toBe( 0 );
			expect( ( xScale.domain as number[] )[ 1 ] ).toBeGreaterThanOrEqual( 510 );
		} );

		it( 'counts only primary series for keyboard navigation when a comparison series is present', async () => {
			const user = userEvent.setup();
			// 2 primary + 1 comparison. totalPoints should be 2*2=4, not 3*2=6.
			// If comparison is counted, the 5th ArrowRight would reference a phantom series
			// and could throw or show an undefined tooltip key.
			const data = [
				{
					label: 'Series A',
					group: 'g',
					data: [
						{ label: 'Jan', value: 10 },
						{ label: 'Feb', value: 20 },
					],
				},
				{
					label: 'Series B',
					group: 'g2',
					data: [
						{ label: 'Jan', value: 15 },
						{ label: 'Feb', value: 25 },
					],
				},
				{
					label: 'Last year',
					group: 'g',
					options: { type: 'comparison' as const },
					data: [
						{ label: 'Jan', value: 8 },
						{ label: 'Feb', value: 18 },
					],
				},
			];
			render(
				<GlobalChartsProvider>
					<BarChart data={ data } width={ 400 } height={ 300 } withTooltips />
				</GlobalChartsProvider>
			);

			const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
			chart.focus();

			// Navigate through all 4 primary slots (2 series × 2 data points)
			for ( let i = 0; i < 4; i++ ) {
				await user.keyboard( '{ArrowRight}' );
			}

			// If totalPoints was 6 (counted comparison), tooltip 4 would still show.
			// With correct totalPoints=4, navigation wraps and tooltip 0 is shown again,
			// not phantom slot 4 (which would reference data[2], a comparison series).
			// Either way, there must be no crash and navigation must stay in bounds.
			const tooltips = screen.queryAllByTestId( /^chart-tooltip-/ );
			expect( tooltips ).toHaveLength( 1 );
			// The visible tooltip must belong to a primary series
			const tooltipText = tooltips[ 0 ].textContent ?? '';
			expect( [ 'Series A', 'Series B' ].some( k => tooltipText.includes( k ) ) ).toBe( true );
		} );
	} );

	describe( 'Interactive Legend', () => {
		it( 'filters series when interactive legend is enabled and series is toggled', async () => {
			const user = userEvent.setup();

			renderWithTheme( {
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-interactive-bar-chart',
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// Click on first legend item to hide it
			const legendItems = screen.getAllByRole( 'button' );
			await user.click( legendItems[ 0 ] );

			// The series should now be hidden (aria-pressed = false)
			const legendItem = screen.getAllByRole( 'button' )[ 0 ];
			expect( legendItem ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'does not filter series when legendInteractive is false', () => {
			renderWithTheme( {
				showLegend: true,
				legend: { interactive: false },
				chartId: 'test-non-interactive-bar-chart',
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// Legend items should not be interactive
			const buttons = screen.queryAllByRole( 'button' );
			expect( buttons ).toHaveLength( 0 );
		} );

		it( 'shows all series when chartId is missing even if legendInteractive is true', () => {
			renderWithTheme( {
				showLegend: true,
				legend: { interactive: true },
				// No chartId provided
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// All legend items should be visible (not hidden)
			const legendItems = screen.getAllByRole( 'button' );
			legendItems.forEach( item => {
				expect( item ).toHaveAttribute( 'aria-pressed', 'true' );
			} );
		} );

		it( 'shows "All series are hidden" message when all series are toggled off', async () => {
			const user = userEvent.setup();

			renderWithTheme( {
				showLegend: true,
				legend: { interactive: true },
				chartId: 'test-all-hidden-bar-chart',
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// Hide all series
			const legendItems = screen.getAllByRole( 'button' );
			await user.click( legendItems[ 0 ] );
			await user.click( legendItems[ 1 ] );

			// Check for the "all series hidden" message
			expect(
				screen.getByText( /all series are hidden.*click legend items to show data/i )
			).toBeInTheDocument();
		} );
	} );
} );
