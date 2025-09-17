import { renderHook, act } from '@testing-library/react';
import { localPoint } from '@visx/event';
import { useChartMouseHandler } from '../use-chart-mouse-handler';
import type { MouseEvent } from 'react';

// Mock localPoint to return simple x,y coordinates
jest.mock( '@visx/event', () => ( {
	localPoint: jest.fn( () => ( { x: 100, y: 200 } ) ),
} ) );

const mockedLocalPoint = localPoint as jest.MockedFunction< typeof localPoint >;

describe( 'useChartMouseHandler', () => {
	beforeEach( () => {
		// Reset the mock to default behavior before each test
		// @ts-expect-error - Mocking simplified return value for tests
		mockedLocalPoint.mockReturnValue( { x: 100, y: 200 } );
	} );

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

	test( 'uses custom tooltip offset with x and y values', () => {
		const { result } = renderHook( () =>
			useChartMouseHandler( { withTooltips: true, tooltipOffset: { x: 10, y: 20 } } )
		);
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEvent, mockData );
		} );

		expect( result.current.tooltipTop ).toBe( 180 ); // 200 - 20
		expect( result.current.tooltipLeft ).toBe( 110 ); // 100 + 10
	} );

	test( 'applies boundary checking to prevent negative top position', () => {
		const mockEventNearTop = {
			...mockEvent,
			clientY: 3,
		} as unknown as MouseEvent< SVGElement >;

		// Mock localPoint to return coordinates near top
		// @ts-expect-error - Mocking simplified return value for tests
		mockedLocalPoint.mockReturnValueOnce( { x: 100, y: 3 } );

		const { result } = renderHook( () =>
			useChartMouseHandler( { withTooltips: true, tooltipOffset: 10 } )
		);
		const mockData = { value: 42, label: 'Test' };

		act( () => {
			result.current.onMouseMove( mockEventNearTop, mockData );
		} );

		expect( result.current.tooltipTop ).toBe( 0 ); // Math.max(0, 3 - 10) = 0
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
		const { result } = renderHook( () => useChartMouseHandler( { withTooltips: true } ) );

		act( () => {
			result.current.onMouseMove( mockEvent, { value: 42, label: 'Test' } );
			result.current.onMouseLeave();
		} );

		expect( result.current.tooltipData ).toBeNull();
		expect( result.current.tooltipOpen ).toBe( false );
	} );
} );
