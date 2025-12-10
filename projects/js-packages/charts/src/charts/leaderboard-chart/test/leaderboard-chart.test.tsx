import { render, screen } from '@testing-library/react';
import LeaderboardChart from '../leaderboard-chart';
import type { LeaderboardEntry } from '../../../types';

const mockData: LeaderboardEntry[] = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 70,
		previousShare: 76,
		delta: -8,
	},
];

/**
 * Custom value formatter for testing
 *
 * @param value - Value to format
 * @return Formatted value
 */
const testValueFormatter = ( value: number ) => `${ value }$`;

/**
 * Custom delta formatter for testing
 *
 * @param value - Delta value to format
 * @return Formatted delta value
 */
const testDeltaFormatter = ( value: number ) => `${ value }delta`;

describe( 'LeaderboardChart', () => {
	it( 'renders leaderboard entries', () => {
		render( <LeaderboardChart data={ mockData } /> );

		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'renders values with default formatter', () => {
		render( <LeaderboardChart data={ mockData } /> );

		expect( screen.getByText( '12.5K' ) ).toBeInTheDocument();
		expect( screen.getByText( '8.8K' ) ).toBeInTheDocument();
	} );

	it( 'shows comparison data when withComparison is true', () => {
		render( <LeaderboardChart data={ mockData } withComparison={ true } /> );

		expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
		expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
	} );

	it( 'shows custom label when provided', () => {
		render(
			<LeaderboardChart
				data={ mockData.map( entry => ( {
					...entry,
					label: <span className="large-text">{ entry.label }</span>,
				} ) ) }
				withComparison={ false }
			/>
		);

		expect( screen.getByText( 'Direct' ) ).toHaveClass( 'large-text' );
		expect( screen.getByText( 'Social Media' ) ).toHaveClass( 'large-text' );
	} );

	it( 'hides comparison data when withComparison is false', () => {
		render( <LeaderboardChart data={ mockData } withComparison={ false } /> );

		expect( screen.queryByText( '+25%' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '-8%' ) ).not.toBeInTheDocument();
	} );

	it( 'applies loading state correctly', () => {
		render( <LeaderboardChart data={ mockData } loading={ true } /> );

		// Test that the loading functionality works by checking if the component renders
		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'uses custom formatters when provided', () => {
		render(
			<LeaderboardChart
				data={ mockData }
				withComparison={ true }
				valueFormatter={ testValueFormatter }
				deltaFormatter={ testDeltaFormatter }
			/>
		);

		expect( screen.getByText( '12500$' ) ).toBeInTheDocument();
		expect( screen.getByText( '25delta' ) ).toBeInTheDocument();
	} );

	it( 'applies custom colors', () => {
		render(
			<LeaderboardChart data={ mockData } primaryColor="#FF0000" secondaryColor="#00FF00" />
		);

		// Test that the component renders correctly with custom colors
		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'handles empty data', () => {
		render( <LeaderboardChart data={ [] } /> );

		expect( screen.queryByText( 'Direct' ) ).not.toBeInTheDocument();
	} );

	describe( 'Legend functionality', () => {
		it( 'renders built-in legend when showLegend is true', () => {
			render( <LeaderboardChart data={ mockData } withComparison={ true } showLegend={ true } /> );

			// Built-in legend should render
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'does not render built-in legend when showLegend is false', () => {
			render( <LeaderboardChart data={ mockData } withComparison={ true } showLegend={ false } /> );

			// Built-in legend should not render
			expect( screen.queryByTestId( 'legend-item' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'legend-horizontal' ) ).not.toBeInTheDocument();
		} );

		it( 'does not render built-in legend by default when showLegend is not specified', () => {
			render( <LeaderboardChart data={ mockData } withComparison={ true } /> );

			// Built-in legend should not render by default
			expect( screen.queryByTestId( 'legend-item' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'legend-horizontal' ) ).not.toBeInTheDocument();
		} );

		it( 'renders built-in legend with custom shape and size', () => {
			render(
				<LeaderboardChart
					data={ mockData }
					withComparison={ true }
					showLegend={ true }
					legendShape="rect"
					legendShapeWidth={ 10 }
					legendShapeHeight={ 6 }
				/>
			);

			// Built-in legend should render
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );

			// Check that custom dimensions are applied (the legend items should exist)
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'renders built-in legend with custom labels', () => {
			render(
				<LeaderboardChart
					data={ mockData }
					withComparison={ true }
					showLegend={ true }
					legendLabels={ {
						primary: 'This Period',
						comparison: 'Last Period',
					} }
				/>
			);

			// Built-in legend should render with custom labels
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'This Period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Last Period' ) ).toBeInTheDocument();

			// Default labels should not be present
			expect( screen.queryByText( 'Current period' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Previous period' ) ).not.toBeInTheDocument();
		} );

		it( 'renders only current period legend when withComparison is false', () => {
			render( <LeaderboardChart data={ mockData } withComparison={ false } showLegend={ true } /> );

			// Only one legend item should render for current period
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 1 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Previous period' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Composition API', () => {
		it( 'renders LeaderboardChart.Legend as child component', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true }>
					<LeaderboardChart.Legend data-testid="composition-legend-item" />
				</LeaderboardChart>
			);

			// Chart content should render
			expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();

			// Composition legend should render - each legend item gets its own element
			expect( screen.getAllByTestId( 'composition-legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'renders composition legend regardless of showLegend value', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true } showLegend={ false }>
					<LeaderboardChart.Legend data-testid="composition-legend-item" />
				</LeaderboardChart>
			);

			// No built-in legend should be rendered when showLegend is false
			expect( screen.queryByTestId( 'legend-item' ) ).not.toBeInTheDocument();

			// Composition legend should still render regardless of showLegend value
			expect( screen.getAllByTestId( 'composition-legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'supports both built-in and composition legends simultaneously', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true } showLegend={ true }>
					<LeaderboardChart.Legend data-testid="composition-legend-item" />
				</LeaderboardChart>
			);

			// Built-in legend should render (with legend-item test IDs)
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );

			// Composition legend should also render
			expect( screen.getAllByTestId( 'composition-legend-item' ) ).toHaveLength( 2 );

			// Should have legend items from both legends
			const currentPeriodItems = screen.getAllByText( 'Current period' );
			const previousPeriodItems = screen.getAllByText( 'Previous period' );
			expect( currentPeriodItems ).toHaveLength( 2 ); // One from each legend
			expect( previousPeriodItems ).toHaveLength( 2 ); // One from each legend
		} );

		it( 'passes props correctly to composition legend', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true }>
					<LeaderboardChart.Legend
						data-testid="composition-legend-item"
						shape="circle"
						shapeWidth={ 12 }
						shapeHeight={ 12 }
						style={ { marginTop: '20px' } }
					/>
				</LeaderboardChart>
			);

			const legendItems = screen.getAllByTestId( 'composition-legend-item' );
			expect( legendItems ).toHaveLength( 2 );
			// Check that each legend item has the custom style applied
			legendItems.forEach( item => {
				expect( item ).toHaveStyle( { marginTop: '20px' } );
			} );
		} );

		it( 'renders chart content when using composition API', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true }>
					<LeaderboardChart.Legend />
				</LeaderboardChart>
			);

			// Chart bars should render
			expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
			expect( screen.getByText( '12.5K' ) ).toBeInTheDocument();
			expect( screen.getByText( '8.8K' ) ).toBeInTheDocument();
			expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
			expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Interactive Legend', () => {
		it( 'renders legend as interactive when legendInteractive is true', () => {
			render(
				<LeaderboardChart
					data={ mockData }
					withComparison={ true }
					showLegend={ true }
					legendInteractive={ true }
				/>
			);

			const legendItems = screen.getAllByRole( 'button' );
			expect( legendItems.length ).toBeGreaterThan( 0 );
		} );

		it( 'renders legend as non-interactive when legendInteractive is false', () => {
			render(
				<LeaderboardChart
					data={ mockData }
					withComparison={ true }
					showLegend={ true }
					legendInteractive={ false }
				/>
			);

			// Legend items should not have button role when not interactive
			const legendItems = screen.queryAllByRole( 'button' );
			expect( legendItems ).toHaveLength( 0 );
		} );

		it( 'shows all data when all series are visible', () => {
			render(
				<LeaderboardChart
					data={ mockData }
					withComparison={ true }
					showLegend={ true }
					legendInteractive={ true }
				/>
			);

			// All values should be visible
			expect( screen.getByText( '12.5K' ) ).toBeInTheDocument();
			expect( screen.getByText( '8.8K' ) ).toBeInTheDocument();
			expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
			expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
		} );
	} );
} );
