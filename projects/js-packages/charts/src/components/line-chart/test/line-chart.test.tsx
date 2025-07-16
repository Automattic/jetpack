/* eslint-disable react/jsx-no-bind */
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlyphDiamond } from '@visx/glyph';
import { createElement, createRef } from 'react';
import { jetpackTheme, ThemeProvider, wooTheme } from '../../../providers/theme';
import LineChart, { LineChartUnresponsive } from '../line-chart';
import type { LineChartRef } from '../line-chart-context';

const customTheme = {
	...jetpackTheme,
	glyphs: [
		props =>
			createElement(
				'g',
				{ 'data-testid': 'custom-glyph-diamond' },
				createElement( GlyphDiamond, {
					key: props.key,
					top: props.y,
					left: props.x,
					size: props.size * props.size,
					fill: props.color,
				} )
			),
	],
};

const THEME_MAP = {
	default: undefined,
	jetpack: jetpackTheme,
	woo: wooTheme,
	custom: customTheme,
};

describe( 'LineChart', () => {
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
				options: {},
			},
		],
	};

	const renderWithTheme = ( props = {}, themeName = 'jetpack' ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<ThemeProvider theme={ theme }>
				{ /* @ts-expect-error TODO Fix the missing props */ }
				<LineChart { ...defaultProps } { ...props } />
			</ThemeProvider>
		);
	};

	const renderUnwrappedWithTheme = ( props = {}, themeName = 'jetpack', ref = undefined ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<ThemeProvider theme={ theme }>
				{ /* @ts-expect-error TODO Fix the missing props */ }
				<LineChartUnresponsive { ...defaultProps } { ...props } ref={ ref } />
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
					},
				],
			} );
			// Should render without crashing and show the single point
			expect( screen.getByRole( 'grid', { name: /line chart/i } ) ).toBeInTheDocument();
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
							{ date: new Date( 'invalid' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
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
					},
					{
						label: 'Series B',
						data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
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
					},
				],
			} );
			expect( screen.queryByText( 'Series A' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Gradient Fill', () => {
		test( 'renders with gradient fill when withGradientFill is true', () => {
			renderWithTheme( { withGradientFill: true } );
			expect( screen.getByTestId( 'line-gradient' ) ).toBeInTheDocument();
		} );

		test( 'renders without gradient fill when withGradientFill is false', () => {
			renderWithTheme( { withGradientFill: false } );
			expect( screen.queryByTestId( 'line-gradient' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Axis Configuration', () => {
		test( 'renders with custom axis options', () => {
			renderWithTheme( {
				options: {
					axis: {
						x: { orientation: 'top' },
						y: { orientation: 'right' },
					},
				},
			} );
			// The chart should render with the custom axis configuration
			expect( screen.getByRole( 'grid', { name: /line chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Responsiveness', () => {
		test( 'renders with custom dimensions', () => {
			renderWithTheme( {
				width: 800,
				height: 400,
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10 } ],
					},
				],
			} );

			// Instead of checking styles, verify the chart renders
			expect( screen.getByTestId( 'line-chart' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'grid', { name: /line chart/i } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Start Glyphs', () => {
		test( 'renders start glyphs when withStartGlyphs is true', () => {
			renderWithTheme( {
				withStartGlyphs: true,
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

			// Check that start glyphs are rendered for each series
			const startGlyphs = screen.getAllByTestId( /start-glyph/i );
			expect( startGlyphs ).toHaveLength( 2 ); // One for each series
		} );

		test( 'does not render start glyphs when withStartGlyphs is false', () => {
			renderWithTheme( {
				withStartGlyphs: false,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {},
					},
				],
			} );

			// Check that no start glyphs are rendered
			expect( screen.queryByTestId( /start-glyph/i ) ).not.toBeInTheDocument();
		} );

		test( 'does not render start glyph when series has empty data', () => {
			renderWithTheme( {
				withStartGlyphs: true,
				data: [
					{
						label: 'Empty Series',
						data: [],
						options: {},
					},
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// Should only have one start glyph (from the non-empty series)
			const startGlyphs = screen.getAllByTestId( /start-glyph/i );
			expect( startGlyphs ).toHaveLength( 1 );
		} );

		test( 'Renders custom glyph from theme', () => {
			renderWithTheme(
				{
					withStartGlyphs: true,
					data: [
						{
							label: 'Series A',
							data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						},
						{
							label: 'Series B',
							data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
						},
					],
				},
				'custom'
			);

			// We are rendering one custom glyph from theme and the second dataset will be using default glyph.
			const defaultGlyphs = screen.getAllByTestId( /start-glyph/i );
			expect( defaultGlyphs ).toHaveLength( 1 );

			const customGlyphs = screen.getAllByTestId( /custom-glyph/i );
			expect( customGlyphs ).toHaveLength( 1 );
		} );
	} );

	describe( 'Legend Glyphs', () => {
		test( 'renders legend glyphs when withLegendGlyph is true', () => {
			renderWithTheme( {
				showLegend: true,
				withLegendGlyph: true,
				glyphStyle: {
					radius: 10,
				},
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
			const legendItems = screen.getAllByTestId( /legend-item/i );
			expect( legendItems ).toHaveLength( 2 );

			const legendGlyphs = screen.getAllByTestId( /legend-glyph/i );
			expect( legendGlyphs ).toHaveLength( 2 );
		} );

		test( 'renders legend glyphs when withLegendGlyph is false', () => {
			renderWithTheme( {
				withLegendGlyph: false,
				showLegend: true,
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
			const legendItems = screen.getAllByTestId( /legend-item/i );
			expect( legendItems ).toHaveLength( 2 );

			expect( screen.queryByTestId( /legend-glyph/i ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Chart Ref Interface', () => {
		test( 'exposes getScales method via ref', () => {
			const ref = createRef< LineChartRef >();
			renderUnwrappedWithTheme( {}, 'jetpack', ref );

			expect( ref.current?.getScales() ).toBeDefined();
			expect( ref.current?.getScales()?.xScale ).toBeDefined();
			expect( ref.current?.getScales()?.yScale ).toBeDefined();
		} );

		test( 'exposes getChartDimensions method via ref', () => {
			const ref = createRef< LineChartRef >();
			renderUnwrappedWithTheme( { width: 800, height: 400 }, 'jetpack', ref );

			const dimensions = ref.current?.getChartDimensions();
			expect( dimensions?.width ).toBe( 800 );
			expect( dimensions?.height ).toBe( 400 );
		} );
	} );

	describe( 'Annotations', () => {
		const renderWithAnnotations = (
			children: React.ReactNode,
			props = {},
			themeName = 'jetpack'
		) => {
			const theme = THEME_MAP[ themeName ];

			return render(
				<ThemeProvider theme={ theme }>
					{ /* @ts-expect-error TODO Fix the missing props */ }
					<LineChart { ...defaultProps } { ...props }>
						{ children }
					</LineChart>
				</ThemeProvider>
			);
		};

		test( 'renders annotations when using compound component pattern', async () => {
			const width = 500;
			const height = 300;

			renderWithAnnotations(
				<LineChart.AnnotationsOverlay>
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } }
						title="Annotation 1"
						subtitle="Annotation 1 subtitle"
					/>
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' } }
						title="Annotation 2"
					/>
				</LineChart.AnnotationsOverlay>,
				{ width, height }
			);

			const overlay = await screen.findByTestId( 'line-chart-annotations-overlay' );
			expect( overlay ).toBeInTheDocument();
			expect( overlay ).toHaveAttribute( 'width', width.toString() );
			expect( overlay ).toHaveAttribute( 'height', height.toString() );

			await waitFor( () => {
				expect( screen.getByText( 'Annotation 1' ) ).toBeInTheDocument();
			} );
			await waitFor( () => {
				expect( screen.getByText( 'Annotation 1 subtitle' ) ).toBeInTheDocument();
			} );
			await waitFor( () => {
				expect( screen.getByText( 'Annotation 2' ) ).toBeInTheDocument();
			} );
		} );

		test( 'skips rendering an annotation when it is malformed', async () => {
			renderWithAnnotations(
				<LineChart.AnnotationsOverlay>
					{ /* @ts-expect-error Testing malformed annotation without required datum prop */ }
					<LineChart.Annotation title="Annotation 1" subtitle="Annotation 1 subtitle" />
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' } }
						title="Annotation 2"
					/>
				</LineChart.AnnotationsOverlay>
			);

			await waitFor( () => {
				expect( screen.getByText( 'Annotation 2' ) ).toBeInTheDocument();
			} );
			expect( screen.queryByText( 'Annotation 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Annotation 1 subtitle' ) ).not.toBeInTheDocument();
		} );

		test( 'does not render annotations when no AnnotationsOverlay is provided', async () => {
			renderWithTheme( {} );

			await waitFor( () => {
				expect( screen.queryByTestId( 'line-chart-annotations-overlay' ) ).not.toBeInTheDocument();
			} );
			await waitFor( () => {
				expect( screen.queryByTestId( 'annotation-0' ) ).not.toBeInTheDocument();
			} );
		} );

		test( 'does not render annotations when AnnotationsOverlay is empty', () => {
			renderWithAnnotations( <LineChart.AnnotationsOverlay></LineChart.AnnotationsOverlay> );

			expect( screen.queryByTestId( 'annotation-0' ) ).not.toBeInTheDocument();
		} );

		test( 'renders annotations with zero values', async () => {
			renderWithAnnotations(
				<LineChart.AnnotationsOverlay>
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-01' ), value: 0, label: 'Jan 1' } }
						title="Zero Value Annotation"
						subtitle="This point has a value of 0"
					/>
				</LineChart.AnnotationsOverlay>
			);

			await waitFor( () => {
				expect( screen.getByText( 'Zero Value Annotation' ) ).toBeInTheDocument();
			} );
			await waitFor( () => {
				expect( screen.getByText( 'This point has a value of 0' ) ).toBeInTheDocument();
			} );
		} );

		test( 'renders annotations with custom label renderer', async () => {
			renderWithAnnotations(
				<LineChart.AnnotationsOverlay>
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } }
						title="Annotation 1"
						subtitle="Annotation 1 subtitle"
						renderLabel={ ( { title, subtitle } ) => (
							<div data-testid="custom-label">
								{ title }
								{ subtitle && <span>{ subtitle }</span> }
							</div>
						) }
					/>
				</LineChart.AnnotationsOverlay>
			);

			await waitFor( () => {
				expect( screen.getByTestId( 'custom-label' ) ).toBeInTheDocument();
			} );
		} );

		test( 'renders annotations with custom label popover renderer', async () => {
			renderWithAnnotations(
				<LineChart.AnnotationsOverlay>
					<LineChart.Annotation
						datum={ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } }
						title="Annotation 1"
						subtitle="Annotation 1 subtitle"
						renderLabel={ ( { title, subtitle } ) => (
							<div data-testid="custom-label">
								{ title }
								{ subtitle && <span>{ subtitle }</span> }
							</div>
						) }
						renderLabelPopover={ ( { title, subtitle } ) => (
							<div data-testid="custom-label-popover">
								{ title }
								{ subtitle && <span>{ subtitle }</span> }
							</div>
						) }
					/>
				</LineChart.AnnotationsOverlay>
			);

			await waitFor( () => {
				expect( screen.getByTestId( 'custom-label-popover' ) ).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'Keyboard Navigation Accessibility', () => {
		describe( 'Chart Focus and Accessibility Attributes', () => {
			test( 'chart container has proper accessibility attributes', () => {
				renderWithTheme();
				const chart = screen.getByRole( 'grid', { name: /line chart/i } );

				expect( chart ).toHaveAttribute( 'tabIndex', '0' );
				expect( chart ).toHaveAttribute( 'role', 'grid' );
				expect( chart ).toHaveAttribute( 'aria-label', 'line chart' );
			} );

			test( 'chart container can receive focus', async () => {
				const user = userEvent.setup();
				renderWithTheme();
				const chart = screen.getByRole( 'grid', { name: /line chart/i } );

				await user.tab();
				expect( chart ).toHaveFocus();
			} );
		} );

		describe( 'Arrow Key Navigation', () => {
			test( 'right arrow key navigates to next data point', async () => {
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

				const chart = screen.getByRole( 'grid', { name: /line chart/i } );
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

				const chart = screen.getByRole( 'grid', { name: /line chart/i } );
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

				const chart = screen.getByRole( 'grid', { name: /line chart/i } );
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

		test( 'keyboard navigation works with custom tooltip renderer', async () => {
			const user = userEvent.setup();
			const customTooltipRenderer = jest.fn( ( { tooltipData } ) => (
				<div role="tooltip" data-testid="custom-tooltip">
					Custom: { tooltipData?.nearestDatum?.datum?.date?.toLocaleDateString() }
				</div>
			) );

			renderWithTheme( { renderTooltip: customTooltipRenderer } );

			const chart = screen.getByRole( 'grid', { name: /line chart/i } );
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
} );
