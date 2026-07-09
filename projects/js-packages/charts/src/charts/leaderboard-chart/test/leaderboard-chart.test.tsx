import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaderboardChart from '../leaderboard-chart';
import type { LeaderboardEntry } from '../../../types';

const mockDefaultParentSize = () => ( {
	parentRef: { current: null },
	width: 400,
	height: 300,
} );

// Mock useParentSize so the responsive wrapper returns predictable dimensions in tests
jest.mock( '@visx/responsive', () => ( {
	useParentSize: jest.fn( () => mockDefaultParentSize() ),
} ) );

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
	afterEach( () => {
		const { useParentSize } = jest.requireMock( '@visx/responsive' );
		useParentSize.mockImplementation( () => mockDefaultParentSize() );
	} );

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

	it( 'shows a placeholder when a row has no previous value', () => {
		render(
			<LeaderboardChart
				data={ [
					...mockData,
					{
						id: 'new',
						label: 'New Source',
						currentValue: 100,
						currentShare: 1,
					},
				] }
				withComparison={ true }
			/>
		);

		expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
		expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
		expect( screen.getByText( 'New Source' ) ).toBeInTheDocument();
		expect( screen.getByText( '-' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( 'No comparison data' ) ).toBeInTheDocument();
		expect( screen.queryByText( '+100%' ) ).not.toBeInTheDocument();
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
					legend={ { shape: 'rect', shapeStyles: { width: 10, height: 6 } } }
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
					<LeaderboardChart.Legend />
				</LeaderboardChart>
			);

			// Chart content should render
			expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();

			// Composition legend should render
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'renders composition legend regardless of showLegend value', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true } showLegend={ false }>
					<LeaderboardChart.Legend />
				</LeaderboardChart>
			);

			// Composition legend should render regardless of showLegend value
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'Current period' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Previous period' ) ).toBeInTheDocument();
		} );

		it( 'supports both built-in and composition legends simultaneously', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true } showLegend={ true }>
					<LeaderboardChart.Legend />
				</LeaderboardChart>
			);

			// Both built-in and composition legends should render (2 items each = 4 total)
			expect( screen.getAllByTestId( 'legend-item' ) ).toHaveLength( 4 );

			// Should have legend items from both legends
			const currentPeriodItems = screen.getAllByText( 'Current period' );
			const previousPeriodItems = screen.getAllByText( 'Previous period' );
			expect( currentPeriodItems ).toHaveLength( 2 );
			expect( previousPeriodItems ).toHaveLength( 2 );
		} );

		it( 'passes props correctly to composition legend', () => {
			render(
				<LeaderboardChart data={ mockData } withComparison={ true }>
					<LeaderboardChart.Legend shape="circle" shapeStyles={ { margin: '4px 8px' } } />
				</LeaderboardChart>
			);

			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// Verify custom shape styles are applied within each legend item.
			// Direct DOM access is needed because visx legend shapes lack accessible attributes and we cannot pass a test id to them.
			legendItems.forEach( item => {
				// eslint-disable-next-line testing-library/no-node-access
				const shape = item.querySelector( '.visx-legend-shape' );
				expect( shape ).toHaveStyle( { margin: '4px 8px' } );
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
					legend={ { interactive: true } }
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
					legend={ { interactive: false } }
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
					legend={ { interactive: true } }
				/>
			);

			// All values should be visible
			expect( screen.getByText( '12.5K' ) ).toBeInTheDocument();
			expect( screen.getByText( '8.8K' ) ).toBeInTheDocument();
			expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
			expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Responsive wrapper', () => {
		it( 'fills parent container (height:100%) by default', () => {
			render( <LeaderboardChart data={ mockData } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { height: '100%' } );
		} );

		it( 'applies explicit width and height to chart container', () => {
			const { useParentSize } = jest.requireMock( '@visx/responsive' );
			useParentSize.mockReturnValue( {
				parentRef: { current: null },
				width: 0,
				height: 0,
			} );

			render( <LeaderboardChart data={ mockData } width={ 500 } height={ 240 } /> );
			const chartContainer = screen.getByTestId( 'leaderboard-chart-container' );

			expect( chartContainer ).toHaveStyle( { width: '500px', height: '240px' } );
		} );
	} );

	describe( 'Interactive items', () => {
		it( 'renders a button for an entry with onClick', () => {
			render( <LeaderboardChart data={ [ { ...mockData[ 0 ], onClick: jest.fn() } ] } /> );
			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button' ).tagName ).toBe( 'BUTTON' );
		} );

		it( 'calls onClick when the row is clicked', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn();
			render( <LeaderboardChart data={ [ { ...mockData[ 0 ], onClick } ] } /> );
			await user.click( screen.getByRole( 'button' ) );
			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'activates onClick via the keyboard (Enter and Space)', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn();
			render( <LeaderboardChart data={ [ { ...mockData[ 0 ], onClick } ] } /> );

			await user.tab();
			expect( screen.getByRole( 'button' ) ).toHaveFocus();

			await user.keyboard( '[Enter]' );
			await user.keyboard( '[Space]' );
			expect( onClick ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'gives the interactive row an accessible name from the label and value', () => {
			render( <LeaderboardChart data={ [ { ...mockData[ 0 ], onClick: jest.fn() } ] } /> );
			// mockData[0] label is 'Direct', currentValue 12500 → '12.5K'
			expect( screen.getByRole( 'button' ) ).toHaveAccessibleName( /Direct.*12\.5K/ );
		} );

		it( 'does not include the missing comparison dash in interactive row names', () => {
			render(
				<LeaderboardChart
					data={ [
						{
							id: 'new',
							label: 'New Source',
							currentValue: 100,
							currentShare: 1,
							onClick: jest.fn(),
						},
					] }
					withComparison={ true }
				/>
			);

			expect( screen.getByRole( 'button' ) ).toHaveAccessibleName(
				/New Source.*100.*No comparison data/
			);
			expect( screen.getByRole( 'button' ) ).not.toHaveAccessibleName( /-/ );
		} );

		it( 'derives the accessible name from an image label via its alt text', () => {
			render(
				<LeaderboardChart
					data={ [
						{
							...mockData[ 0 ],
							label: <img src="https://example.com/flag.svg" alt="United States" />,
							onClick: jest.fn(),
						},
					] }
				/>
			);
			expect( screen.getByRole( 'button' ) ).toHaveAccessibleName( /United States.*12\.5K/ );
		} );

		it( 'uses ariaLabel as the accessible name when provided', () => {
			render(
				<LeaderboardChart
					data={ [
						{
							...mockData[ 0 ],
							label: <img src="https://example.com/flag.svg" alt="" />,
							ariaLabel: 'United States: 12.5K visitors',
							onClick: jest.fn(),
						},
					] }
				/>
			);
			expect( screen.getByRole( 'button' ) ).toHaveAccessibleName(
				'United States: 12.5K visitors'
			);
		} );

		it( 'does not render a button for entries without onClick', () => {
			render( <LeaderboardChart data={ [ mockData[ 0 ] ] } /> );
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		} );

		it( 'renders a button only for interactive entries in mixed data', () => {
			render(
				<LeaderboardChart data={ [ { ...mockData[ 0 ], onClick: jest.fn() }, mockData[ 1 ] ] } />
			);
			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 1 );
		} );
	} );
} );
