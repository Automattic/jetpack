/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
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
			expect( screen.getByRole( 'img', { name: /bar chart/i } ) ).toBeInTheDocument();
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
			expect( screen.getByRole( 'img', { name: /bar chart/i } ) ).toBeInTheDocument();
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
			expect( screen.getByRole( 'img', { name: /bar chart/i } ) ).toBeInTheDocument();

			rerender(
				<ThemeProvider>
					<BarChart { ...defaultProps } gridVisibility="y" />
				</ThemeProvider>
			);
			expect( screen.getByRole( 'img', { name: /bar chart/i } ) ).toBeInTheDocument();

			rerender(
				<ThemeProvider>
					<BarChart { ...defaultProps } gridVisibility="xy" />
				</ThemeProvider>
			);
			expect( screen.getByRole( 'img', { name: /bar chart/i } ) ).toBeInTheDocument();
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

			// Get all tspan elements in the document
			const tspans = screen.getAllByText( /./i, {
				selector: '.visx-axis-bottom .visx-axis-tick tspan',
			} );

			// Check if any of these tspans contains our target text
			const hasTargetDate = tspans.some( element => element.textContent.trim() === '1/3/24' );

			expect( hasTargetDate ).toBe( true );
		} );
	} );
} );
