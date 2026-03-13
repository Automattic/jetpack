import { renderHook, act } from '@testing-library/react';
import { useChartMouseHandler } from '../use-chart-mouse-handler';
import type { MouseEvent } from 'react';

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
	} as unknown as MouseEvent< SVGElement >;

	test( 'initializes with default values', () => {
		const { result } = renderHook( () => useChartMouseHandler( { withTooltips: true } ) );
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
		const { result } = renderHook( () => useChartMouseHandler( { withTooltips: true } ) );

		act( () => {
			result.current.onMouseMove( mockEvent, { value: 42, label: 'Test' } );
			result.current.onMouseLeave();
		} );

		expect( result.current.tooltipData ).toBeNull();
		expect( result.current.tooltipOpen ).toBe( false );
	} );
} );
