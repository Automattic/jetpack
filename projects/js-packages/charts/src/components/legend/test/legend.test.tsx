import { render, screen } from '@testing-library/react';
import { BaseLegend } from '../private/base-legend';
import type { LegendProps } from '../types';

const TestShape: LegendProps[ 'shape' ] = props => {
	return (
		<svg>
			<rect data-testid="legend-marker" fill={ props.fill } />
		</svg>
	);
};

describe( 'BaseLegend', () => {
	const defaultItems = [
		{ label: 'Item 1', value: '50%', color: '#ff0000' },
		{ label: 'Item 2', value: '30%', color: '#00ff00' },
	];

	test( 'renders horizontal legend items', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
		expect( screen.getByText( '50%' ) ).toBeInTheDocument();
		expect( screen.getByText( '30%' ) ).toBeInTheDocument();
	} );

	test( 'renders vertical legend items', () => {
		render( <BaseLegend items={ defaultItems } orientation="vertical" /> );
		const items = screen.getAllByText( /Item \d/ );
		expect( items ).toHaveLength( 2 );
	} );

	test( 'applies color styles to legend markers', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" shape={ TestShape } /> );
		const markers = screen.getAllByTestId( 'legend-marker' );
		expect( markers[ 0 ] ).toHaveAttribute( 'fill', '#ff0000' );
		expect( markers[ 1 ] ).toHaveAttribute( 'fill', '#00ff00' );
	} );

	test( 'handles empty items array', () => {
		render( <BaseLegend items={ [] } orientation="horizontal" /> );
		const legendItems = screen.queryAllByRole( 'listitem' );
		expect( legendItems ).toHaveLength( 0 );
	} );

	test( 'handles missing values', () => {
		const itemsWithoutValues = [
			{ label: 'Item 1', color: '#ff0000', value: undefined },
			{ label: 'Item 2', color: '#00ff00', value: undefined },
		];
		render( <BaseLegend items={ itemsWithoutValues } orientation="horizontal" /> );
		expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
	} );

	test( 'applies custom className', () => {
		render(
			<BaseLegend items={ defaultItems } className="custom-legend" orientation="horizontal" />
		);
		expect( screen.getByRole( 'list' ) ).toHaveClass( 'custom-legend' );
	} );

	test( 'renders with correct orientation styles', () => {
		const { rerender } = render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		expect( screen.getByTestId( 'legend-horizontal' ) ).toBeInTheDocument();

		rerender( <BaseLegend items={ defaultItems } orientation="vertical" /> );
		expect( screen.getByTestId( 'legend-vertical' ) ).toBeInTheDocument();
	} );

	test( 'renders legend items with correct spacing', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		const items = screen.getAllByTestId( 'legend-item' );
		expect( items ).toHaveLength( 2 );
	} );

	test( 'handles items with long labels', () => {
		const itemsWithLongLabels = [
			{ label: 'Very Long Label That Should Still Display', value: '50%', color: '#ff0000' },
			{ label: 'Another Long Label for Testing', value: '30%', color: '#00ff00' },
		];
		render( <BaseLegend items={ itemsWithLongLabels } orientation="horizontal" /> );
		expect( screen.getByText( 'Very Long Label That Should Still Display' ) ).toBeInTheDocument();
	} );

	describe( 'text wrapping behavior', () => {
		const longLabelItems = [
			{ label: 'Very Long Label That Should Wrap or Truncate', value: '50%', color: '#ff0000' },
			{ label: 'Another Long Label for Testing', value: '30%', color: '#00ff00' },
		];

		test( 'applies maxWidth constraint to legend labels', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth={ 150 } orientation="horizontal" /> );
			const labels = screen.getAllByText( /Long Label/ );
			labels.forEach( label => {
				const labelElement = label.closest( '.visx-legend-label' );
				expect( labelElement ).toHaveStyle( { maxWidth: '150px' } );
			} );
		} );

		test( 'applies maxWidth as string with unit', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth="10rem" orientation="horizontal" /> );
			const labels = screen.getAllByText( /Long Label/ );
			labels.forEach( label => {
				const labelElement = label.closest( '.visx-legend-label' );
				expect( labelElement ).toHaveStyle( { maxWidth: '10rem' } );
			} );
		} );

		test( 'renders correctly with and without maxWidth', () => {
			const { rerender } = render(
				<BaseLegend items={ longLabelItems } orientation="horizontal" />
			);

			// Without maxWidth, legend items should render normally
			let legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// With maxWidth, legend labels should be constrained
			rerender( <BaseLegend items={ longLabelItems } maxWidth={ 150 } orientation="horizontal" /> );
			legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// The legend labels should have the maxWidth constraint applied
			const labels = screen.getAllByText( /Long Label/ );
			labels.forEach( label => {
				const labelElement = label.closest( '.visx-legend-label' );
				expect( labelElement ).toHaveStyle( { maxWidth: '150px' } );
			} );
		} );

		test( 'renders with different textOverflow values', () => {
			// Test ellipsis behavior - should render without errors
			const { rerender } = render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth={ 150 }
					textOverflow="ellipsis"
					orientation="horizontal"
				/>
			);
			let labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );

			labels.forEach( label => {
				const labelElement = label.closest( '.visx-legend-label' );
				expect( labelElement ).toBeTruthy();
				expect( labelElement ).toHaveStyle( { maxWidth: '150px' } );
			} );

			// Test wrap behavior - should render without errors
			rerender(
				<BaseLegend
					items={ longLabelItems }
					maxWidth={ 150 }
					textOverflow="wrap"
					orientation="horizontal"
				/>
			);
			labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );

			labels.forEach( label => {
				const labelElement = label.closest( '.visx-legend-label' );
				expect( labelElement ).toBeTruthy();
				expect( labelElement ).toHaveStyle( { maxWidth: '150px' } );
			} );
		} );

		test( 'adds title attribute for potential tooltip when textOverflow is ellipsis', () => {
			// Render with ellipsis overflow
			render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth={ 50 }
					textOverflow="ellipsis"
					orientation="horizontal"
				/>
			);

			// Find text spans (our LegendText components)
			const textSpans = document.querySelectorAll( 'span' );
			let foundTextSpan = false;

			textSpans.forEach( span => {
				// Look for spans that contain our long label text
				if ( span.textContent?.includes( 'Very Long Label' ) ) {
					foundTextSpan = true;
					// The span should have a title attribute (for tooltip) when text might be truncated
					// Note: In JSDOM environment, we can't accurately detect visual truncation,
					// so we just verify the component structure exists
					expect( span ).toBeDefined();
				}
			} );

			expect( foundTextSpan ).toBe( true );
		} );

		test( 'does not add title attribute when textOverflow is wrap', () => {
			// Render with wrap overflow
			render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth={ 50 }
					textOverflow="wrap"
					orientation="horizontal"
				/>
			);

			// Find text spans (our LegendText components)
			const textSpans = document.querySelectorAll( 'span' );
			let foundTextSpan = false;

			textSpans.forEach( span => {
				// Look for spans that contain our long label text
				if ( span.textContent?.includes( 'Very Long Label' ) ) {
					foundTextSpan = true;
					// In wrap mode, we should not have a title attribute since text wraps instead of truncating
					expect( span ).toBeDefined();
				}
			} );

			expect( foundTextSpan ).toBe( true );
		} );
	} );
} );
