import { act, renderHook } from '@testing-library/react';
import { useTimelineGeometry } from '../use-timeline-geometry';

let mockWidth = 1000;
const mockWidthRef = jest.fn();
jest.mock( '../use-element-width', () => ( {
	useElementWidth: () => ( { ref: mockWidthRef, width: mockWidth } ),
} ) );

beforeEach( () => {
	mockWidth = 1000;
} );

/**
 * Attach the geometry hook to a scroller with controllable measurements.
 *
 * @param currentMs - Playhead time.
 * @return The hook and attached scroller.
 */
function setup( currentMs = 5000 ) {
	const scroller = document.createElement( 'div' );
	const view = renderHook( () =>
		useTimelineGeometry( {
			durationMs: 10000,
			currentMs,
			getZoomLadder: width => ( { sourceZoom: 8000 / width, extraStops: 0 } ),
		} )
	);
	act( () => view.result.current.scrollerRef( scroller ) );
	return { ...view, scroller };
}

it( 'preserves the visible playhead position through zoom and fit', () => {
	const { result, scroller } = setup();
	act( () => result.current.applyZoom( 4 ) );
	expect( scroller.scrollLeft ).toBe( 1500 );
	expect( result.current.pxPerMs * 5000 - scroller.scrollLeft ).toBe( 500 );
	act( () => result.current.applyZoom( 1 ) );
	expect( scroller.scrollLeft ).toBe( 0 );
	expect( result.current.contentWidth ).toBe( 1000 );
} );

it( 'zooms around the visible window when the playhead is offscreen', () => {
	const { result, scroller } = setup( 0 );
	act( () => result.current.applyZoom( 2 ) );
	scroller.scrollLeft = 500;
	act( () => result.current.applyZoom( 4 ) );
	expect( scroller.scrollLeft ).toBe( 1500 );
} );

it( 'accumulates wheel events delivered before React commits', () => {
	const { result, scroller } = setup();
	act( () => {
		for ( let i = 0; i < 2; i++ ) {
			scroller.dispatchEvent(
				new WheelEvent( 'wheel', { ctrlKey: true, deltaY: -Math.log( 2 ) / 0.002 } )
			);
		}
	} );
	expect( result.current.zoom ).toBeCloseTo( 4 );
	expect( scroller.scrollLeft ).toBeCloseTo( 1500 );
} );

it( 'keeps a reduced zoom ceiling after the viewport narrows again', () => {
	const { result, rerender } = setup();
	act( () => result.current.applyZoom( 8 ) );
	mockWidth = 2000;
	rerender();
	expect( result.current.zoom ).toBe( 4 );
	mockWidth = 1000;
	rerender();
	expect( result.current.zoom ).toBe( 4 );
} );

it( 'preserves the visible playhead during a resize', () => {
	const { result, rerender, scroller } = setup();
	act( () => result.current.applyZoom( 2 ) );
	mockWidth = 1200;
	rerender();
	expect( result.current.pxPerMs * 5000 - scroller.scrollLeft ).toBe( 500 );
} );
