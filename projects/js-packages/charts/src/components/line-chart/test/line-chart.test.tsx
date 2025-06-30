/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { GlyphDiamond } from '@visx/glyph';
import React from 'react';
import { jetpackTheme, ThemeProvider, wooTheme } from '../../../providers/theme';
import LineChart from '../line-chart';

const customTheme = {
	...jetpackTheme,
	glyphs: [
		props =>
			React.createElement(
				'g',
				{ 'data-testid': 'custom-glyph-diamond' },
				React.createElement( GlyphDiamond, {
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
			expect( screen.getByRole( 'img', { name: /line chart/i } ) ).toBeInTheDocument();
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
			expect( screen.getByRole( 'img', { name: /line chart/i } ) ).toBeInTheDocument();
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
			expect( screen.getByRole( 'img', { name: /line chart/i } ) ).toBeInTheDocument();
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

	describe( 'Annotations', () => {
		test( 'renders annotations when an annotations list is provided', () => {
			renderWithTheme( {
				annotations: [
					{
						datum: { date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
						title: 'Annotation 1',
						subtitle: 'Annotation 1 subtitle',
					},
					{
						datum: { date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						title: 'Annotation 2',
					},
				],
			} );

			expect( screen.getByText( 'Annotation 1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Annotation 1 subtitle' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Annotation 2' ) ).toBeInTheDocument();
		} );

		test( 'skips rendering an annotation when it is malformed', () => {
			renderWithTheme( {
				annotations: [
					{
						title: 'Annotation 1',
						subtitle: 'Annotation 1 subtitle',
					},
					{
						datum: { date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
						title: 'Annotation 2',
					},
				],
			} );

			expect( screen.queryByText( 'Annotation 1' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Annotation 1 subtitle' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Annotation 2' ) ).toBeInTheDocument();
		} );

		test( 'does not render annotations when no annotations list is provided', () => {
			renderWithTheme( {} );

			expect( screen.queryByTestId( 'annotation-0' ) ).not.toBeInTheDocument();
		} );

		test( 'does not render annotations when an empty annotations list is provided', () => {
			renderWithTheme( {
				annotations: [],
			} );

			expect( screen.queryByTestId( 'annotation-0' ) ).not.toBeInTheDocument();
		} );

		test( 'renders annotations with zero values', () => {
			renderWithTheme( {
				annotations: [
					{
						datum: { date: new Date( '2024-01-01' ), value: 0, label: 'Jan 1' },
						title: 'Zero Value Annotation',
						subtitle: 'This point has a value of 0',
					},
				],
			} );

			expect( screen.getByText( 'Zero Value Annotation' ) ).toBeInTheDocument();
			expect( screen.getByText( 'This point has a value of 0' ) ).toBeInTheDocument();
		} );
	} );
} );
