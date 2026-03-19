import { render, screen } from '@testing-library/react';
import { renderLegendSlot } from '../../chart-composition';
import { ChartLayout } from '../chart-layout';
import type { LegendChild } from '../../chart-composition/use-chart-children';

// Mock renderLegendSlot since we test it separately
jest.mock( '../../chart-composition', () => ( {
	renderLegendSlot: jest.fn( () => [] ),
} ) );

const mockRenderLegendSlot = renderLegendSlot as jest.Mock;

describe( 'ChartLayout', () => {
	beforeEach( () => {
		mockRenderLegendSlot.mockReturnValue( [] );
	} );

	it( 'renders children inside a column Stack', () => {
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'chart-content' ) ).toBeInTheDocument();
	} );

	it( 'renders legend element at top when legendPosition is top', () => {
		const legendElement = <div data-testid="legend">Legend</div>;
		render(
			<ChartLayout legendPosition="top" legendElement={ legendElement } legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const legend = screen.getByTestId( 'legend' );
		const content = screen.getByTestId( 'chart-content' );
		expect( legend.compareDocumentPosition( content ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'renders legend element at bottom when legendPosition is bottom', () => {
		const legendElement = <div data-testid="legend">Legend</div>;
		render(
			<ChartLayout legendPosition="bottom" legendElement={ legendElement } legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const content = screen.getByTestId( 'chart-content' );
		const legend = screen.getByTestId( 'legend' );
		expect( content.compareDocumentPosition( legend ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'does not render legend element when it is false/null', () => {
		render(
			<ChartLayout legendPosition="top" legendElement={ false } legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		expect( screen.queryByTestId( 'legend' ) ).not.toBeInTheDocument();
	} );

	it( 'calls renderLegendSlot for both positions', () => {
		const legendChildren: LegendChild[] = [];
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ legendChildren }>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( mockRenderLegendSlot ).toHaveBeenCalledWith( legendChildren, 'top' );
		expect( mockRenderLegendSlot ).toHaveBeenCalledWith( legendChildren, 'bottom' );
	} );

	it( 'hides layout until measured when using render-prop children', () => {
		// Override the global getBoundingClientRect mock to return zero (unmeasured state)
		// for elements inside this test. This simulates the initial state before
		// ResizeObserver provides real dimensions in a browser.
		const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function () {
			return { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0 } as DOMRect;
		};

		try {
			const childFn = jest.fn().mockReturnValue( <div>Chart</div> );
			render(
				<ChartLayout legendPosition="bottom" legendChildren={ [] } data-testid="layout">
					{ childFn }
				</ChartLayout>
			);
			// When contentHeight is 0, layout should be hidden to prevent layout shift
			expect( screen.getByTestId( 'layout' ) ).toHaveStyle( { visibility: 'hidden' } );
		} finally {
			Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
		}
	} );

	it( 'does not hide layout when using plain ReactNode children', () => {
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] } data-testid="layout">
				<div>Chart</div>
			</ChartLayout>
		);
		const layoutStyle = screen.getByTestId( 'layout' ).getAttribute( 'style' ) ?? '';
		expect( layoutStyle ).not.toContain( 'visibility' );
	} );

	it( 'passes className and style to Stack', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				className="my-chart"
				style={ { width: 400, height: 300 } }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		const layout = screen.getByTestId( 'layout' );
		expect( layout ).toHaveClass( 'my-chart' );
		expect( layout ).toHaveStyle( { width: '400px', height: '300px' } );
	} );

	it( 'passes gap to Stack', () => {
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] } gap="lg" data-testid="layout">
				<div>Chart</div>
			</ChartLayout>
		);
		// Stack renders gap as a CSS class or style — just verify it renders without error
		expect( screen.getByTestId( 'layout' ) ).toBeInTheDocument();
	} );

	it( 'calls function-as-children with measurement props', () => {
		const childFn = jest.fn().mockReturnValue( <div data-testid="chart-content">Chart</div> );

		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] }>
				{ childFn }
			</ChartLayout>
		);

		expect( childFn ).toHaveBeenCalled();
		const firstCallArg = childFn.mock.calls[ 0 ][ 0 ];

		expect( firstCallArg ).toEqual(
			expect.objectContaining( {
				contentWidth: expect.any( Number ),
				contentHeight: expect.any( Number ),
				isMeasured: expect.any( Boolean ),
			} )
		);
	} );

	it( 'renders trailing content after bottom legend', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendElement={ <div data-testid="legend">Legend</div> }
				legendChildren={ [] }
				trailingContent={ <div data-testid="trailing">Extra</div> }
			>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const legend = screen.getByTestId( 'legend' );
		const trailing = screen.getByTestId( 'trailing' );
		expect( legend.compareDocumentPosition( trailing ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
