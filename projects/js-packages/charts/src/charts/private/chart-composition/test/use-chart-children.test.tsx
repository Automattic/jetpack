import { renderHook } from '@testing-library/react';
import { Group } from '@visx/group';
import { Legend } from '../../../../components/legend';
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
		expect( result.current.legendChildren ).toHaveLength( 0 );
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
		expect( result.current.legendChildren ).toHaveLength( 0 );
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
		expect( result.current.legendChildren ).toHaveLength( 0 );
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

	it( 'should extract Legend children to legendChildren with default position bottom', () => {
		const children = <Legend />;

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 1 );
		expect( result.current.legendChildren[ 0 ].position ).toBe( 'bottom' );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should extract Legend children with position top', () => {
		const children = <Legend position="top" />;

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 1 );
		expect( result.current.legendChildren[ 0 ].position ).toBe( 'top' );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );

	it( 'should default to bottom for invalid position values', () => {
		// @ts-expect-error -- testing invalid runtime value
		const children = <Legend position="left" />;

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 1 );
		expect( result.current.legendChildren[ 0 ].position ).toBe( 'bottom' );
	} );

	it( 'should exclude Legend children from nonLegendChildren', () => {
		const children = [
			<Legend key="legend" position="top" />,
			<div key="other">Other Content</div>,
		];

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 1 );
		expect( result.current.nonLegendChildren ).toHaveLength( 1 );
	} );

	it( 'should preserve original child order in nonLegendChildren', () => {
		const children = [
			<div key="first">First</div>,
			<Legend key="legend" position="top" />,
			<Group key="group">
				<text>SVG</text>
			</Group>,
			<div key="last">Last</div>,
		];

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.nonLegendChildren ).toHaveLength( 3 );
		// Verify order matches original (minus the Legend)
		expect( ( result.current.nonLegendChildren[ 0 ] as React.ReactElement ).key ).toBe( 'first' );
		expect( ( result.current.nonLegendChildren[ 1 ] as React.ReactElement ).key ).toBe( 'group' );
		expect( ( result.current.nonLegendChildren[ 2 ] as React.ReactElement ).key ).toBe( 'last' );
	} );

	it( 'should return empty nonLegendChildren when all children are Legends', () => {
		const children = [
			<Legend key="top" position="top" />,
			<Legend key="bottom" position="bottom" />,
		];

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 2 );
		expect( result.current.nonLegendChildren ).toHaveLength( 0 );
	} );

	it( 'should extract multiple Legend children by position', () => {
		const children = [
			<Legend key="top" position="top" />,
			<Legend key="bottom" position="bottom" />,
		];

		const { result } = renderHook( () => useChartChildren( children, 'TestChart' ) );

		expect( result.current.legendChildren ).toHaveLength( 2 );
		expect( result.current.legendChildren[ 0 ].position ).toBe( 'top' );
		expect( result.current.legendChildren[ 1 ].position ).toBe( 'bottom' );
		expect( result.current.otherChildren ).toHaveLength( 0 );
	} );
} );
