import { type RefObject, useEffect, useRef } from 'react';

// Handle automation dragging to move the flow in a drag-to-scroll fashion.
// Use animation frames to sync with browser repaints for smooth scrolling.
// This handles mouse & trackpad. On touch devices, the drag runs natively.
export const useAutomationDragToScroll = (
	automationRef?: RefObject< HTMLDivElement | null >
): void => {
	// Using a ref here is crucial to avoid re-rendering the component tree
	// on every mouse move event. The event handlers must not modify state.
	const dragInfo = useRef( { isDragging: false, lastX: 0, lastY: 0 } );

	useEffect( () => {
		const automation = automationRef?.current;
		if ( ! automation ) {
			return undefined;
		}

		automation.style.cursor = 'grab';

		let frameId: number;
		const onMouseMove = event => {
			if ( ! dragInfo.current.isDragging ) {
				return;
			}

			event.preventDefault();
			frameId = requestAnimationFrame( () => {
				automation.scrollLeft += dragInfo.current.lastX - event.clientX;
				automation.scrollTop += dragInfo.current.lastY - event.clientY;
				dragInfo.current.lastX = event.clientX;
				dragInfo.current.lastY = event.clientY;
			} );
		};

		const onMouseDown = event => {
			dragInfo.current.isDragging = true;
			dragInfo.current.lastX = event.clientX;
			dragInfo.current.lastY = event.clientY;
			automation.style.cursor = 'grabbing';
		};

		const onMouseUp = () => {
			dragInfo.current.isDragging = false;
			automation.style.cursor = 'grab';
		};

		automation.addEventListener( 'mousemove', onMouseMove, { passive: false } );
		automation.addEventListener( 'mousedown', onMouseDown );
		window.addEventListener( 'mouseup', onMouseUp );

		// cleanup
		return () => {
			automation.removeEventListener( 'mousemove', onMouseMove );
			automation.removeEventListener( 'mousedown', onMouseDown );
			window.removeEventListener( 'mouseup', onMouseUp );
			if ( frameId ) {
				cancelAnimationFrame( frameId );
			}
		};
	}, [ automationRef ] );
};
