import { act, fireEvent, render, screen } from '@testing-library/react';
import { useTimelinePointerDrag } from '../use-pointer-drag';

beforeEach( () => {
	jest.useFakeTimers();
	Object.assign( Element.prototype, {
		setPointerCapture: jest.fn(),
		hasPointerCapture: () => true,
		releasePointerCapture: jest.fn(),
	} );
} );
afterEach( () => jest.useRealTimers() );

it.each( [
	[ 399, 1, 'pointerUp' ],
	[ 1, -1, 'pointerCancel' ],
] as const )(
	'follows a stationary pointer at %i (direction %i) and stops on %s',
	( clientX, direction, end ) => {
		const scroller = document.createElement( 'div' );
		scroller.scrollLeft = 200;
		Object.defineProperties( scroller, {
			clientWidth: { value: 400 },
			scrollWidth: { value: 1000 },
		} );
		scroller.getBoundingClientRect = () => ( { left: 0, right: 400, width: 400 } ) as DOMRect;
		const content = document.createElement( 'div' );
		content.getBoundingClientRect = () => ( { left: -scroller.scrollLeft } ) as DOMRect;
		const onDragMove = jest.fn();
		const onDragEnd = jest.fn();
		const Handle = () => {
			const drag = useTimelinePointerDrag( {
				contentRef: { current: content },
				scrollerEl: scroller,
				pxPerMs: 0.1,
				getAnchorMs: () => 4000,
				onDragMove,
				onDragEnd,
			} );
			return <button { ...drag }>Drag</button>;
		};
		const { unmount } = render( <Handle /> );
		const handle = screen.getByRole( 'button', { name: 'Drag' } );
		// eslint-disable-next-line testing-library/prefer-user-event -- Exercise pointer capture and frame-driven movement.
		fireEvent.pointerDown( handle, { button: 0, pointerId: 1, clientX: 250 } );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.pointerMove( handle, { pointerId: 1, clientX } );
		const before = onDragMove.mock.lastCall[ 0 ];
		act( () => jest.advanceTimersByTime( 160 ) );
		expect( ( scroller.scrollLeft - 200 ) * direction ).toBeGreaterThan( 0 );
		expect( ( onDragMove.mock.lastCall[ 0 ] - before ) * direction ).toBeGreaterThan( 0 );
		act( () => jest.advanceTimersByTime( 10000 ) );
		expect( scroller.scrollLeft ).toBe( direction === 1 ? 600 : 0 );

		fireEvent[ end ]( handle, { pointerId: 1, clientX } );
		expect( onDragEnd ).toHaveBeenCalledTimes( 1 );
		const calls = onDragMove.mock.calls.length;
		act( () => jest.advanceTimersByTime( 160 ) );
		expect( onDragMove ).toHaveBeenCalledTimes( calls );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.pointerDown( handle, { button: 0, pointerId: 2, clientX } );
		unmount();
		expect( jest.getTimerCount() ).toBe( 0 );
	}
);
