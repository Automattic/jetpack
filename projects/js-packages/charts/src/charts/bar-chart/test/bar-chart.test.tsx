import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import BarChart from '../bar-chart';

// Mock useElementHeight to return a non-zero height in jsdom so charts render
const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-height', () => ( {
	useElementHeight: () => [ mockRefCallback, 300 ], // Return test height to allow chart rendering
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

	const renderWithTheme = ( props = {} ) => {
		return render(
			<GlobalChartsProvider>
				<BarChart { ...defaultProps } { ...props } />
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
		test( 'shows legend when showLegend is true', () => {
			renderWithTheme( {
				showLegend: true,
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
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'hides legend when showLegend is false', () => {
			renderWithTheme( {
				showLegend: false,
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );
			expect( screen.queryByText( 'Series A' ) ).not.toBeInTheDocument();
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

	describe( 'Interactive Legend', () => {
		it( 'filters series when interactive legend is enabled and series is toggled', async () => {
			const user = userEvent.setup();

			renderWithTheme( {
				showLegend: true,
				legendInteractive: true,
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
				legendInteractive: false,
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
				legendInteractive: true,
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
				legendInteractive: true,
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
