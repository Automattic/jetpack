/* eslint-disable react/jsx-no-bind */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlyphDiamond } from '@visx/glyph';
import { createElement, createRef } from 'react';
import { GlobalChartsProvider, defaultTheme } from '../../../providers';
import LineChart, { LineChartUnresponsive } from '../line-chart';
import type { SingleChartRef } from '../../private/single-chart-context';

// Mock useElementSize to return non-zero dimensions in jsdom so charts render
const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// Drive the zoom state directly so we can assert the clip-path behaviour without
// simulating a pointer drag (svgPoint geometry is unavailable in jsdom). The rest
// of the x-zoom module (ZoomClipPath, getZoomClipPathId, etc.) stays real.
const mockUseXZoom = jest.fn();
jest.mock( '../../private/x-zoom', () => {
	const actual = jest.requireActual( '../../private/x-zoom' );
	return {
		__esModule: true,
		...actual,
		useXZoom: ( ...args: unknown[] ) => mockUseXZoom( ...args ),
	};
} );

const passthroughZoom = () => ( {
	domain: null,
	drag: null,
	reset: jest.fn(),
	handlers: { onPointerDown: jest.fn(), onPointerMove: jest.fn(), onPointerUp: jest.fn() },
} );

beforeEach( () => {
	mockUseXZoom.mockReset();
	mockUseXZoom.mockImplementation( passthroughZoom );
} );

const customTheme = {
	...defaultTheme,
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

	const renderWithTheme = ( props = {}, themeName = 'default', children = undefined ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<GlobalChartsProvider theme={ theme }>
				{ /* @ts-expect-error TODO Fix the missing props */ }
				<LineChart { ...defaultProps } { ...props }>
					{ children }
				</LineChart>
			</GlobalChartsProvider>
		);
	};

	const renderUnwrappedWithTheme = ( props = {}, themeName = 'default', ref = undefined ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<GlobalChartsProvider theme={ theme }>
				{ /* @ts-expect-error TODO Fix the missing props */ }
				<LineChartUnresponsive { ...defaultProps } { ...props } ref={ ref } />
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
		const multiSeriesData = [
			{
				label: 'Series A',
				data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
			},
			{
				label: 'Series B',
				data: [ { date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' } ],
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
			renderWithTheme( { data: multiSeriesData }, 'default', <LineChart.Legend /> );

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Series A' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Series B' ) ).toBeInTheDocument();
		} );

		test( 'renders composition legend regardless of showLegend value', () => {
			renderWithTheme(
				{ data: multiSeriesData, showLegend: false },
				'default',
				<LineChart.Legend />
			);

			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
		} );

		test( 'renders composition legend in top position', () => {
			renderWithTheme( { data: multiSeriesData }, 'default', <LineChart.Legend position="top" /> );

			// Legend should appear before the chart content in DOM order
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			const html = document.body.innerHTML;
			expect( html.indexOf( 'data-testid="legend-horizontal"' ) ).toBeLessThan(
				html.indexOf( 'role="grid"' )
			);
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

		test( 'renders gradient with custom configuration', () => {
			renderWithTheme( {
				withGradientFill: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {
							gradient: {
								from: '#ff0000',
								to: '#0000ff',
								fromOpacity: 0.8,
								toOpacity: 0.2,
							},
						},
					},
				],
			} );

			// Check that the gradient is rendered
			const gradient = screen.getByTestId( 'line-gradient' );
			expect( gradient ).toBeInTheDocument();
			expect( gradient.tagName ).toBe( 'linearGradient' );
		} );

		test( 'renders gradient stops with line color when no color specified', () => {
			renderWithTheme( {
				withGradientFill: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {
							gradient: {
								stops: [
									{ offset: '0%', opacity: 0.8 }, // No color specified
									{ offset: '50%', color: '#ff0000', opacity: 0.5 },
									{ offset: '100%', opacity: 0 }, // No color specified
								],
							},
						},
					},
				],
			} );

			// Check that the gradient is rendered with stops
			const gradient = screen.getByTestId( 'line-gradient' );
			expect( gradient ).toBeInTheDocument();
			expect( gradient.tagName ).toBe( 'linearGradient' );

			// Check that individual stops are rendered with proper test IDs
			// Format: line-gradient-stop-{chartId}-{seriesIndex}-{stopIndex}
			const firstStop = screen.getByTestId( /line-gradient-stop-.*-0-0/ );
			const secondStop = screen.getByTestId( /line-gradient-stop-.*-0-1/ );
			const thirdStop = screen.getByTestId( /line-gradient-stop-.*-0-2/ );

			// First stop should use the line color (no color specified)
			expect( firstStop ).toHaveAttribute( 'stop-opacity', '0.8' );
			expect( firstStop ).toHaveAttribute( 'offset', '0%' );

			// Middle stop should use the specified color
			expect( secondStop ).toHaveAttribute( 'stop-color', '#ff0000' );
			expect( secondStop ).toHaveAttribute( 'stop-opacity', '0.5' );
			expect( secondStop ).toHaveAttribute( 'offset', '50%' );

			// Last stop should use the line color and have opacity 0
			expect( thirdStop ).toHaveAttribute( 'stop-opacity', '0' );
			expect( thirdStop ).toHaveAttribute( 'offset', '100%' );
		} );

		test( 'renders multiple gradients for multiple series', () => {
			renderWithTheme( {
				withGradientFill: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {
							gradient: {
								from: '#ff0000',
								to: '#ff0000',
								fromOpacity: 0.5,
								toOpacity: 0,
							},
						},
					},
					{
						label: 'Series B',
						data: [
							{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
						],
						options: {
							gradient: {
								from: '#0000ff',
								to: '#0000ff',
								fromOpacity: 0.7,
								toOpacity: 0.1,
							},
						},
					},
				],
			} );

			// Check that both gradients are rendered
			const gradients = screen.getAllByTestId( 'line-gradient' );
			expect( gradients ).toHaveLength( 2 );

			// Verify both gradients are linearGradient elements
			expect( gradients[ 0 ].tagName ).toBe( 'linearGradient' );
			expect( gradients[ 1 ].tagName ).toBe( 'linearGradient' );
		} );

		test( 'renders gradient with stops when provided', () => {
			renderWithTheme( {
				withGradientFill: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
						options: {
							gradient: {
								from: '#ff0000',
								to: '#0000ff',
								stops: [
									{ offset: '0%', color: '#ff0000', opacity: 1 },
									{ offset: '50%', color: '#00ff00', opacity: 0.5 },
									{ offset: '100%', color: '#0000ff', opacity: 0 },
								],
							},
						},
					},
				],
			} );

			// Check that the gradient is rendered
			// The actual stop elements are children of the gradient, but we can't easily test them
			// without direct DOM access, so we just verify the gradient exists
			const gradient = screen.getByTestId( 'line-gradient' );
			expect( gradient ).toBeInTheDocument();
			expect( gradient.tagName ).toBe( 'linearGradient' );
		} );

		test( 'applies gradient to area fill', () => {
			renderWithTheme( {
				withGradientFill: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						],
					},
				],
			} );

			// Check that the gradient is rendered and the chart is properly rendered
			const gradient = screen.getByTestId( 'line-gradient' );
			expect( gradient ).toBeInTheDocument();

			// Verify that the chart container exists
			const chart = screen.getByRole( 'grid', { name: /line chart/i } );
			expect( chart ).toBeInTheDocument();
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

	describe( 'X-Axis Ticks', () => {
		test( 'renders ticks in hours.', () => {
			renderWithTheme( {
				width: 800,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01:1:' ), value: 10 },
							{ date: new Date( '2024-01-01:3:' ), value: 20 },
							{ date: new Date( '2024-01-01:5:' ), value: 30 },
							{ date: new Date( '2024-01-01:7:' ), value: 40 },
							{ date: new Date( '2024-01-01:23:' ), value: 50 },
						],
					},
				],
			} );

			const ticks = screen.getAllByText( /\d+ [AM|PM]/ );
			expect( ticks.length ).toBeGreaterThan( 1 );
		} );

		test( 'renders ticks in short date format.', () => {
			renderWithTheme( {
				width: 800,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10 },
							{ date: new Date( '2024-04-01' ), value: 20 },
							{ date: new Date( '2024-07-01' ), value: 30 },
							{ date: new Date( '2024-10-01' ), value: 40 },
							{ date: new Date( '2025-03-01' ), value: 50 },
						],
					},
				],
			} );

			const ticks = screen.getAllByText(
				/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+$/
			);
			expect( ticks.length ).toBeGreaterThan( 1 );
		} );

		test( 'renders ticks in year format.', () => {
			renderWithTheme( {
				width: 800,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2023-01-01' ), value: 10 },
							{ date: new Date( '2024-01-01' ), value: 10 },
							{ date: new Date( '2025-01-01' ), value: 50 },
						],
					},
				],
			} );

			const ticks = screen.getAllByText( /^202\d$/ );
			expect( ticks.length ).toBeGreaterThan( 1 );
		} );
	} );

	describe( 'Guess optimal number of ticks', () => {
		test( 'renders optimal number of ticks.', () => {
			renderWithTheme( {
				width: 400,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10 },
							{ date: new Date( '2024-02-02' ), value: 20 },
							{ date: new Date( '2024-03-03' ), value: 30 },
							{ date: new Date( '2024-04-04' ), value: 40 },
							{ date: new Date( '2024-05-05' ), value: 50 },
							{ date: new Date( '2024-06-06' ), value: 60 },
							{ date: new Date( '2024-07-07' ), value: 70 },
							{ date: new Date( '2024-08-08' ), value: 70 },
							{ date: new Date( '2024-09-09' ), value: 70 },
							{ date: new Date( '2024-10-10' ), value: 70 },
						],
					},
				],
			} );

			const ticks = screen.getAllByText( /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct) \d+/ );
			expect( ticks.length ).toBeLessThan( 6 ); // Not much space
		} );

		test( 'renders only one tick when all ticks are the same', () => {
			renderWithTheme( {
				width: 800,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01T01:00:00' ), value: 10 },
							{ date: new Date( '2024-01-01T01:00:00' ), value: 20 },
							{ date: new Date( '2024-01-01T01:00:00' ), value: 30 },
						],
					},
				],
			} );

			const ticks = screen.getAllByText( /\d+ [AP]M/ );
			expect( ticks ).toHaveLength( 1 );
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

	describe( 'End Glyphs', () => {
		test( 'renders end glyphs when withEndGlyphs is true', () => {
			renderWithTheme( {
				withEndGlyphs: true,
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

			// Check that end glyphs are rendered for each series
			const endGlyphs = screen.getAllByTestId( /end-glyph/i );
			expect( endGlyphs ).toHaveLength( 2 ); // One for each series
		} );

		test( 'does not render end glyphs when withEndGlyphs is false', () => {
			renderWithTheme( {
				withEndGlyphs: false,
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

			// Check that no end glyphs are rendered
			expect( screen.queryByTestId( /end-glyph/i ) ).not.toBeInTheDocument();
		} );

		test( 'does not render end glyph when series has empty data', () => {
			renderWithTheme( {
				withEndGlyphs: true,
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

			// Should only have one end glyph (from the non-empty series)
			const endGlyphs = screen.getAllByTestId( /end-glyph/i );
			expect( endGlyphs ).toHaveLength( 1 );
		} );

		test( 'renders both start and end glyphs when both are enabled', () => {
			renderWithTheme( {
				withStartGlyphs: true,
				withEndGlyphs: true,
				data: [
					{
						label: 'Series A',
						data: [
							{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
							{ date: new Date( '2024-01-03' ), value: 30, label: 'Jan 3' },
						],
						options: {},
					},
					{
						label: 'Series B',
						data: [
							{ date: new Date( '2024-01-01' ), value: 15, label: 'Jan 1' },
							{ date: new Date( '2024-01-02' ), value: 25, label: 'Jan 2' },
							{ date: new Date( '2024-01-03' ), value: 35, label: 'Jan 3' },
						],
						options: {},
					},
				],
			} );

			// Check that both start and end glyphs are rendered for each series
			const startGlyphs = screen.getAllByTestId( /start-glyph/i );
			expect( startGlyphs ).toHaveLength( 2 );

			const endGlyphs = screen.getAllByTestId( /end-glyph/i );
			expect( endGlyphs ).toHaveLength( 2 );
		} );

		test( 'renders custom end glyph from theme', () => {
			renderWithTheme(
				{
					withEndGlyphs: true,
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
								{ date: new Date( '2024-01-01' ), value: 20, label: 'Jan 1' },
								{ date: new Date( '2024-01-02' ), value: 30, label: 'Jan 2' },
							],
						},
					],
				},
				'custom'
			);

			// We are rendering one custom glyph from theme and the second dataset will be using default glyph.
			const defaultGlyphs = screen.getAllByTestId( /end-glyph/i );
			expect( defaultGlyphs ).toHaveLength( 1 );

			const customGlyphs = screen.getAllByTestId( /custom-glyph/i );
			expect( customGlyphs ).toHaveLength( 1 );
		} );

		test( 'renders end glyph at correct position for single data point', () => {
			renderWithTheme( {
				withEndGlyphs: true,
				data: [
					{
						label: 'Series A',
						data: [ { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' } ],
						options: {},
					},
				],
			} );

			// For a single data point, the end glyph should be rendered at that point
			const endGlyphs = screen.getAllByTestId( /end-glyph/i );
			expect( endGlyphs ).toHaveLength( 1 );
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

		test( 'does not render legend glyphs when withLegendGlyph is false', () => {
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
			const ref = createRef< SingleChartRef >();
			renderUnwrappedWithTheme( {}, 'default', ref );

			expect( ref.current?.getScales() ).toBeDefined();
			expect( ref.current?.getScales()?.xScale ).toBeDefined();
			expect( ref.current?.getScales()?.yScale ).toBeDefined();
		} );

		test( 'exposes getChartDimensions method via ref', () => {
			const ref = createRef< SingleChartRef >();
			renderUnwrappedWithTheme( { width: 800, height: 400 }, 'default', ref );

			const dimensions = ref.current?.getChartDimensions();
			expect( dimensions?.width ).toBe( 800 );
			expect( dimensions?.height ).toBe( 400 );
		} );
	} );

	describe( 'Annotations', () => {
		const renderWithAnnotations = (
			children: React.ReactNode,
			props = {},
			themeName = 'default'
		) => {
			const theme = THEME_MAP[ themeName ];

			return render(
				<GlobalChartsProvider theme={ theme }>
					{ /* @ts-expect-error TODO Fix the missing props */ }
					<LineChart { ...defaultProps } { ...props }>
						{ children }
					</LineChart>
				</GlobalChartsProvider>
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
				expect( chart ).toHaveAttribute( 'aria-label', 'Line chart' );
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
					Custom:{ ' ' }
					{ tooltipData?.nearestDatum?.datum?.date?.toLocaleDateString( 'ja-JP', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					} ) }
				</div>
			) );

			renderWithTheme( { renderTooltip: customTooltipRenderer } );

			const chart = screen.getByRole( 'grid', { name: /line chart/i } );
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

	describe( 'Interactive Legend', () => {
		it( 'filters series when interactive legend is enabled and series is toggled', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<LineChartUnresponsive
						{ ...defaultProps }
						withGradientFill={ false }
						showLegend={ true }
						legend={ { interactive: true } }
						chartId="test-interactive-chart"
					/>
				</GlobalChartsProvider>
			);

			// Click on first legend item to hide it
			const legendItems = screen.getAllByRole( 'button' );
			await user.click( legendItems[ 0 ] );

			// The series should now be hidden (aria-pressed = false)
			const legendItem = screen.getAllByRole( 'button' )[ 0 ];
			expect( legendItem ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'does not filter series when legendInteractive is false', () => {
			render(
				<GlobalChartsProvider>
					<LineChartUnresponsive
						{ ...defaultProps }
						withGradientFill={ false }
						showLegend={ true }
						legend={ { interactive: false } }
						chartId="test-non-interactive-chart"
					/>
				</GlobalChartsProvider>
			);

			// Legend items should not be interactive
			const buttons = screen.queryAllByRole( 'button' );
			expect( buttons ).toHaveLength( 0 );
		} );

		it( 'shows all series when chartId is missing even if legendInteractive is true', () => {
			render(
				<GlobalChartsProvider>
					<LineChartUnresponsive
						{ ...defaultProps }
						withGradientFill={ false }
						showLegend={ true }
						legend={ { interactive: true } }
						// No chartId provided
					/>
				</GlobalChartsProvider>
			);

			// All legend items should be visible (not hidden)
			const legendItems = screen.getAllByRole( 'button' );
			legendItems.forEach( item => {
				expect( item ).toHaveAttribute( 'aria-pressed', 'true' );
			} );
		} );
	} );

	// The line is not animated, so it clips only while actually zoomed.
	test( 'clips the series to the plot when zoomed', () => {
		mockUseXZoom.mockImplementation( () => ( {
			domain: [ new Date( '2024-01-01' ), new Date( '2024-01-02' ) ],
			drag: null,
			reset: jest.fn(),
			handlers: { onPointerDown: jest.fn(), onPointerMove: jest.fn(), onPointerUp: jest.fn() },
		} ) );
		renderUnwrappedWithTheme( { zoomable: true, chartId: 'zoomtest' } );

		expect( screen.getByTestId( 'chart-series-clip-group' ) ).toHaveAttribute(
			'clip-path',
			'url(#chart-zoom-clip-zoomtest)'
		);
	} );
} );
