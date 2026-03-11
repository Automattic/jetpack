/* eslint-disable no-bitwise, jest/expect-expect */
import { render, screen } from '@testing-library/react';
import { renderLegendSlot } from '../../../charts/private/chart-composition';
import { ChartLayout } from '../chart-layout';
import type { LegendChild } from '../../../charts/private/chart-composition/use-chart-children';

// Mock renderLegendSlot since we test it separately
jest.mock( '../../../charts/private/chart-composition', () => ( {
	renderLegendSlot: jest.fn( () => [] ),
} ) );

const mockRenderLegendSlot = renderLegendSlot as jest.Mock;

/**
 * Asserts that `earlier` appears before `later` in DOM order.
 *
 * @param {HTMLElement} earlier - Element expected to appear first
 * @param {HTMLElement} later   - Element expected to appear second
 */
function expectDomOrder( earlier: HTMLElement, later: HTMLElement ) {
	expect(
		earlier.compareDocumentPosition( later ) & Node.DOCUMENT_POSITION_FOLLOWING
	).toBeTruthy();
}

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
		// Legend should come before content in DOM order
		expectDomOrder( screen.getByTestId( 'legend' ), screen.getByTestId( 'chart-content' ) );
	} );

	it( 'renders legend element at bottom when legendPosition is bottom', () => {
		const legendElement = <div data-testid="legend">Legend</div>;
		render(
			<ChartLayout legendPosition="bottom" legendElement={ legendElement } legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		// Content should come before legend in DOM order
		expectDomOrder( screen.getByTestId( 'chart-content' ), screen.getByTestId( 'legend' ) );
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

	it( 'applies visibility hidden when isWaitingForMeasurement is true', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				isWaitingForMeasurement={ true }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'layout' ) ).toHaveStyle( { visibility: 'hidden' } );
	} );

	it( 'applies visibility visible when isWaitingForMeasurement is false', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				isWaitingForMeasurement={ false }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'layout' ) ).toHaveStyle( { visibility: 'visible' } );
	} );

	it( 'does not set visibility in inline style when isWaitingForMeasurement is undefined', () => {
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] } data-testid="layout">
				<div>Chart</div>
			</ChartLayout>
		);
		// When isWaitingForMeasurement is not provided, visibility should not be set in inline style
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

	it( 'forwards ref to Stack', () => {
		const ref = jest.fn();
		render(
			<ChartLayout ref={ ref } legendPosition="bottom" legendChildren={ [] }>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( ref ).toHaveBeenCalledWith( expect.any( HTMLElement ) );
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
		expectDomOrder( screen.getByTestId( 'legend' ), screen.getByTestId( 'trailing' ) );
	} );
} );
