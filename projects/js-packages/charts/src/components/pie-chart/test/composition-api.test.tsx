import { render, screen } from '@testing-library/react';
import { Group } from '@visx/group';
import '@testing-library/jest-dom';
import { PieChartUnresponsive as PieChart } from '../index';

describe( 'PieChart Composition API', () => {
	const mockData = [
		{ label: 'A', value: 30, percentage: 30 },
		{ label: 'B', value: 40, percentage: 40 },
		{ label: 'C', value: 30, percentage: 30 },
	];

	describe( 'Compound Components', () => {
		it( 'renders PieChart.SVG children inside the SVG element', () => {
			render(
				<PieChart data={ mockData } size={ 400 }>
					<PieChart.SVG>
						<text data-testid="svg-text">SVG Content</text>
					</PieChart.SVG>
				</PieChart>
			);

			const text = screen.getByTestId( 'svg-text' );
			expect( text ).toBeInTheDocument();
			expect( text ).toHaveTextContent( 'SVG Content' );
		} );

		it( 'renders PieChart.HTML children outside the SVG element', () => {
			const { container } = render(
				<PieChart data={ mockData } size={ 400 }>
					<PieChart.HTML>
						<div data-testid="html-content">HTML Content</div>
					</PieChart.HTML>
				</PieChart>
			);

			const htmlContent = screen.getByTestId( 'html-content' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );

			expect( htmlContent ).toBeInTheDocument();
			expect( htmlContent ).toHaveTextContent( 'HTML Content' );
			// Verify it's not inside the SVG
			expect( svg ).toBeTruthy();
			expect( svg!.contains( htmlContent ) ).toBe( false );
		} );

		it( 'supports multiple compound components', () => {
			const { container } = render(
				<PieChart data={ mockData } size={ 400 }>
					<PieChart.HTML>
						<h3 data-testid="title">Chart Title</h3>
					</PieChart.HTML>
					<PieChart.SVG>
						<text data-testid="svg-annotation">Annotation</text>
					</PieChart.SVG>
					<PieChart.HTML>
						<p data-testid="description">Chart Description</p>
					</PieChart.HTML>
				</PieChart>
			);

			const title = screen.getByTestId( 'title' );
			const annotation = screen.getByTestId( 'svg-annotation' );
			const description = screen.getByTestId( 'description' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );

			expect( title ).toBeInTheDocument();
			expect( annotation ).toBeInTheDocument();
			expect( description ).toBeInTheDocument();

			expect( svg ).toBeTruthy();
			expect( svg!.contains( annotation ) ).toBe( true );
			expect( svg!.contains( title ) ).toBe( false );
			expect( svg!.contains( description ) ).toBe( false );
		} );
	} );

	describe( 'Backward Compatibility', () => {
		it( 'still renders Group components inside SVG for backward compatibility', () => {
			render(
				<PieChart data={ mockData } size={ 400 }>
					<Group>
						<text data-testid="legacy-text">Legacy Content</text>
					</Group>
				</PieChart>
			);

			const text = screen.getByTestId( 'legacy-text' );
			expect( text ).toBeInTheDocument();
			expect( text ).toHaveTextContent( 'Legacy Content' );
		} );

		it( 'renders non-Group children outside SVG for backward compatibility', () => {
			const { container } = render(
				<PieChart data={ mockData } size={ 400 }>
					<div data-testid="legacy-div">Legacy DIV</div>
				</PieChart>
			);

			const div = screen.getByTestId( 'legacy-div' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );

			expect( div ).toBeInTheDocument();
			expect( div ).toHaveTextContent( 'Legacy DIV' );
			expect( svg ).toBeTruthy();
			expect( svg!.contains( div ) ).toBe( false );
		} );

		it( 'handles mixed legacy and compound components', () => {
			const { container } = render(
				<PieChart data={ mockData } size={ 400 }>
					<Group>
						<text data-testid="legacy-svg">Legacy SVG</text>
					</Group>
					<PieChart.SVG>
						<text data-testid="new-svg">New SVG</text>
					</PieChart.SVG>
					<div data-testid="legacy-html">Legacy HTML</div>
					<PieChart.HTML>
						<div data-testid="new-html">New HTML</div>
					</PieChart.HTML>
				</PieChart>
			);

			const legacySvg = screen.getByTestId( 'legacy-svg' );
			const newSvg = screen.getByTestId( 'new-svg' );
			const legacyHtml = screen.getByTestId( 'legacy-html' );
			const newHtml = screen.getByTestId( 'new-html' );
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );

			// All should be rendered
			expect( legacySvg ).toBeInTheDocument();
			expect( newSvg ).toBeInTheDocument();
			expect( legacyHtml ).toBeInTheDocument();
			expect( newHtml ).toBeInTheDocument();

			// SVG elements should be inside SVG
			expect( svg ).toBeTruthy();
			expect( svg!.contains( legacySvg ) ).toBe( true );
			expect( svg!.contains( newSvg ) ).toBe( true );

			// HTML elements should be outside SVG
			expect( svg!.contains( legacyHtml ) ).toBe( false );
			expect( svg!.contains( newHtml ) ).toBe( false );
		} );
	} );
} );
