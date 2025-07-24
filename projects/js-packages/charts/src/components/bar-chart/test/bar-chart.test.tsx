/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../../providers/theme';
import BarChart from '../bar-chart';

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
			<ThemeProvider>
				<BarChart { ...defaultProps } { ...props } />
			</ThemeProvider>
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
				<ThemeProvider>
					<BarChart { ...defaultProps } gridVisibility="y" />
				</ThemeProvider>
			);
			expect( screen.getByRole( 'grid', { name: /bar chart/i } ) ).toBeInTheDocument();

			rerender(
				<ThemeProvider>
					<BarChart { ...defaultProps } gridVisibility="xy" />
				</ThemeProvider>
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
				expect( chart ).toHaveAttribute( 'aria-label', 'bar chart' );
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
					Custom: { tooltipData?.nearestDatum?.datum?.date?.toLocaleDateString() }
				</div>
			) );

			renderWithTheme( { withTooltips: true, renderTooltip: customTooltipRenderer } );

			const chart = screen.getByRole( 'grid', { name: /bar chart/i } );
			chart.focus();

			// Click on right arrow key to focus on the first tooltip.
			await user.keyboard( '{ArrowRight}' );

			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveFocus();
			expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '1/1/2024' );

			const customTooltip = screen.getByTestId( 'custom-tooltip' );
			expect( customTooltip ).toBeInTheDocument();
			expect( customTooltipRenderer ).toHaveBeenCalled();
		} );
	} );

	/* eslint-disable testing-library/no-node-access */
	describe( 'Zero Value Display', () => {
		test( 'renders visible bars for zero values with default settings', () => {
			renderWithTheme( {
				zeroValueDisplay: true,
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

		test( 'Does not render zero-value bars when default zeroValueDisplay is false', () => {
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
				zeroValueDisplay: true,
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
} );
