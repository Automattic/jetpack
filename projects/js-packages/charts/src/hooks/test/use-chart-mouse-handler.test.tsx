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

	test( 'uses default tooltip offset of 5', () => {
		const { result } = renderHook( () => useChartMouseHandler( { withTooltips: true } ) );
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEvent, mockData );
		} );

		expect( result.current.tooltipTop ).toBe( 195 ); // 200 - 5
		expect( result.current.tooltipLeft ).toBe( 100 );
	} );

	test( 'uses custom tooltip offset', () => {
		const { result } = renderHook( () =>
			useChartMouseHandler( { withTooltips: true, tooltipOffset: 15 } )
		);
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEvent, mockData );
		} );

		expect( result.current.tooltipTop ).toBe( 185 ); // 200 - 15
		expect( result.current.tooltipLeft ).toBe( 100 );
	} );

	test( 'does not show tooltip when tooltips are disabled', () => {
		const { result } = renderHook( () =>
			useChartMouseHandler( { withTooltips: false, tooltipOffset: 10 } )
		);
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEvent, mockData );
		} );

		expect( result.current.tooltipData ).toBeNull();
		expect( result.current.tooltipOpen ).toBe( false );
		expect( result.current.tooltipTop ).toBeUndefined();
		expect( result.current.tooltipLeft ).toBeUndefined();
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
