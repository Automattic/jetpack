/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../providers/theme';
import LineChart from '../line-chart';

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

	const renderWithTheme = ( props = {} ) => {
		return render(
			<ThemeProvider>
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
} );
