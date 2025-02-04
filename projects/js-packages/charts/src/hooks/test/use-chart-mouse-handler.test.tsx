import { renderHook, act } from '@testing-library/react';
import useChartMouseHandler from '../use-chart-mouse-handler';

jest.mock( '@visx/event', () => ( {
	localPoint: () => ( { x: 100, y: 200 } ),
} ) );

describe( 'useChartMouseHandler', () => {
	const mockEvent = {
		clientX: 100,
		clientY: 200,
		currentTarget: {
			getBoundingClientRect: () => ( {
				left: 50,
				top: 50,
			} ),
		},
		target: document.createElement( 'svg' ),
	} as unknown as React.MouseEvent< SVGElement >;

	const margin = { margin: { left: 0, right: 0, top: 0, bottom: 0 }, withTooltips: true };

	test( 'initializes with default values', () => {
		const { result } = renderHook( () => useChartMouseHandler( margin ) );
		expect( result.current.tooltipData ).toBeNull();
		expect( result.current.tooltipOpen ).toBe( false );
	} );

	test( 'handles mouse move', () => {
		const { result } = renderHook( () => useChartMouseHandler( { withTooltips: true } ) );
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEvent, mockData );
		} );

		expect( result.current.tooltipData ).toEqual( mockData );
		expect( result.current.tooltipOpen ).toBe( true );
	} );

	test( 'handles mouse leave', () => {
		const { result } = renderHook( () => useChartMouseHandler( margin ) );

		act( () => {
			result.current.onMouseMove( mockEvent, { value: 42, label: 'Test' } );
			result.current.onMouseLeave();
		} );

		expect( result.current.tooltipData ).toBeNull();
		expect( result.current.tooltipOpen ).toBe( false );
	} );
} );
