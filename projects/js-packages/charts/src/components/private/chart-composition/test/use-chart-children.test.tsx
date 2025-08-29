import { renderHook } from '@testing-library/react';
import { Group } from '@visx/group';
import { ChartSVG, ChartHTML } from '../index';
import { useChartChildren } from '../use-chart-children';

// Shared test utilities to reduce duplication
const TestSVG = ( { children }: { children: React.ReactNode } ) => <>{ children }</>;
TestSVG.displayName = 'TestChart.SVG';

const TestHTML = ( { children }: { children: React.ReactNode } ) => <>{ children }</>;
TestHTML.displayName = 'TestChart.HTML';

describe( 'useChartChildren', () => {
	it( 'should extract SVG children from chart-specific compound components', () => {
		const children = (
			<TestSVG>
				<text>SVG Content</text>
			</TestSVG>
		);

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 1 );
		expect( result.current.htmlChildren ).toHaveLength( 0 );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should extract HTML children from chart-specific compound components', () => {
		const children = (
			<TestHTML>
				<div>HTML Content</div>
			</TestHTML>
		);

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 0 );
		expect( result.current.htmlChildren ).toHaveLength( 1 );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should handle generic Chart.SVG and Chart.HTML components', () => {
		// Create elements directly without Fragment wrapper
		const svgElement = (
			<ChartSVG>
				<text>SVG Content</text>
			</ChartSVG>
		);
		const htmlElement = (
			<ChartHTML>
				<div>HTML Content</div>
			</ChartHTML>
		);

		const children = [ svgElement, htmlElement ];

		const { result } = renderHook( () => useChartChildren( children, 'AnyChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 1 );
		expect( result.current.htmlChildren ).toHaveLength( 1 );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should maintain backward compatibility with Group components', () => {
		const children = (
			<Group>
				<text>Legacy SVG Content</text>
			</Group>
		);

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 1 );
		expect( result.current.htmlChildren ).toHaveLength( 0 );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should categorize other children correctly', () => {
		const children = <div>Regular Content</div>;

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 0 );
		expect( result.current.htmlChildren ).toHaveLength( 0 );
		expect( result.current.otherChildren ).toHaveLength( 1 );
	} );

	it( 'should handle mixed children types', () => {
		// Create elements as array to avoid Fragment issues
		const children = [
			<TestSVG key="svg">
				<text>SVG Content</text>
			</TestSVG>,
			<Group key="group">
				<text>Legacy SVG</text>
			</Group>,
			<TestHTML key="html">
				<div>HTML Content</div>
			</TestHTML>,
			<div key="other">Other Content</div>,
		];

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 2 ); // TestSVG content + Group
		expect( result.current.htmlChildren ).toHaveLength( 1 ); // TestHTML content
		expect( result.current.otherChildren ).toHaveLength( 1 ); // div
	} );

	it( 'should handle empty children', () => {
		const { result } = renderHook( () => useChartChildren( null, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 0 );
		expect( result.current.htmlChildren ).toHaveLength( 0 );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should handle multiple children within compound components', () => {
		const children = (
			<TestSVG>
				<text>First SVG</text>
				<text>Second SVG</text>
				<g>Third SVG</g>
			</TestSVG>
		);

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.svgChildren ).toHaveLength( 3 );
	} );
} );
