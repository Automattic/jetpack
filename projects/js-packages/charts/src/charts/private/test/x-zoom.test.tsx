import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useXZoom } from '../x-zoom';
import type { SingleChartRef } from '../single-chart-context';
import type { EventHandlerParams } from '@visx/xychart';

// A fake scale that lets the hook convert pixel positions to data values.
// The hook only uses `.invert()`; everything else can be stubbed.
const fakeXScale = ( ( x: number ) => x * 2 ) as unknown as ( ( v: number ) => number ) & {
	invert: ( v: number ) => number;
};
( fakeXScale as unknown as { invert: ( v: number ) => number } ).invert = v => v * 2;

const makeChartRef = (
	scale: { invert?: ( v: number ) => unknown } | null = fakeXScale as unknown as {
		invert: ( v: number ) => unknown;
	}
) =>
	( {
		current: {
			getScales: () => ( scale ? { xScale: scale, yScale: scale } : null ),
			getChartDimensions: () => ( { width: 0, height: 0, margin: {} } ),
		},
	} ) as unknown as ReturnType< typeof useRef< SingleChartRef > >;

const makeParams = ( x: number ): EventHandlerParams< object > =>
	( {
		key: '',
		index: 0,
		datum: {},
		event: new Event( 'pointerdown' ) as unknown as PointerEvent,
		svgPoint: { x, y: 0 },
	} ) as unknown as EventHandlerParams< object >;

describe( 'useXZoom', () => {
	test( 'commits a domain on pointerup after dragging more than minDragPixels', () => {
		const chartRef = makeChartRef();
		const { result } = renderHook( () => useXZoom< number >( { enabled: true, chartRef } ) );

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 200 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 200 ) ) );

		// fakeXScale.invert(x) = x * 2.
		expect( result.current.domain ).toEqual( [ 200, 400 ] );
		expect( result.current.drag ).toBeNull();
	} );

	test( 'discards drags shorter than minDragPixels', () => {
		const chartRef = makeChartRef();
		const { result } = renderHook( () => useXZoom< number >( { enabled: true, chartRef } ) );

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 103 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 103 ) ) );

		expect( result.current.domain ).toBeNull();
		expect( result.current.drag ).toBeNull();
	} );

	test( 'normalises right-to-left drags', () => {
		const chartRef = makeChartRef();
		const { result } = renderHook( () => useXZoom< number >( { enabled: true, chartRef } ) );

		act( () => result.current.handlers.onPointerDown( makeParams( 300 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 100 ) ) );

		expect( result.current.domain ).toEqual( [ 200, 600 ] );
	} );

	test( 'reset clears the committed domain', () => {
		const chartRef = makeChartRef();
		const { result } = renderHook( () => useXZoom< number >( { enabled: true, chartRef } ) );

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 200 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 200 ) ) );
		expect( result.current.domain ).not.toBeNull();
		act( () => result.current.reset() );
		expect( result.current.domain ).toBeNull();
	} );

	test( 'is a passthrough when disabled', () => {
		const chartRef = makeChartRef();
		const userOnPointerDown = jest.fn();
		const { result } = renderHook( () =>
			useXZoom< number >( {
				enabled: false,
				chartRef,
				userHandlers: { onPointerDown: userOnPointerDown },
			} )
		);

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 200 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 200 ) ) );

		expect( userOnPointerDown ).toHaveBeenCalledTimes( 1 );
		expect( result.current.domain ).toBeNull();
		expect( result.current.drag ).toBeNull();
	} );

	test( 'forwards events to user handlers when zoom is enabled', () => {
		const chartRef = makeChartRef();
		const userOnPointerDown = jest.fn();
		const userOnPointerMove = jest.fn();
		const userOnPointerUp = jest.fn();
		const { result } = renderHook( () =>
			useXZoom< number >( {
				enabled: true,
				chartRef,
				userHandlers: {
					onPointerDown: userOnPointerDown,
					onPointerMove: userOnPointerMove,
					onPointerUp: userOnPointerUp,
				},
			} )
		);

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 200 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 200 ) ) );

		expect( userOnPointerDown ).toHaveBeenCalledTimes( 1 );
		expect( userOnPointerMove ).toHaveBeenCalledTimes( 1 );
		expect( userOnPointerUp ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'leaves domain null when the X scale has no invert function', () => {
		const chartRef = makeChartRef( {
			/* no invert */
		} );
		const { result } = renderHook( () => useXZoom< number >( { enabled: true, chartRef } ) );

		act( () => result.current.handlers.onPointerDown( makeParams( 100 ) ) );
		act( () => result.current.handlers.onPointerMove( makeParams( 200 ) ) );
		act( () => result.current.handlers.onPointerUp( makeParams( 200 ) ) );

		expect( result.current.domain ).toBeNull();
	} );
} );
