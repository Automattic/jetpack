import { type RefObject, useEffect } from 'react';

const findClosestScrollable = ( element: HTMLElement ): HTMLElement | null => {
	const style = window.getComputedStyle( element );
	const canScroll = [ style.overflow, style.overflowX, style.overflowY ].find(
		value => value === 'auto' || value === 'scroll'
	);
	const overflows =
		element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;

	if ( canScroll && overflows ) {
		return element;
	}
	return element.parentElement ? findClosestScrollable( element.parentElement ) : null;
};

// Handle automation scrolling, including both X and Y axes simultaneously.
// Use animation frames to sync with browser repaints for smooth scrolling.
export const useAutomationScroll = ( automationRef?: RefObject< HTMLDivElement | null > ): void =>
	useEffect( () => {
		const automation = automationRef?.current;
		if ( ! automation ) {
			return undefined;
		}

		let frameId: number;
		const scrollHandler = ( event: WheelEvent ) => {
			// do not hijack wheel event inside other scrollable elements
			const scrollTarget = findClosestScrollable( event.target as HTMLElement );
			if ( scrollTarget !== automation ) {
				return;
			}

			event.preventDefault();
			frameId = requestAnimationFrame( () => {
				automation.scrollLeft += event.deltaX;
				automation.scrollTop += event.deltaY;
			} );
		};

		automation.addEventListener( 'wheel', scrollHandler, { passive: false } );

		// cleanup
		return () => {
			automation.removeEventListener( 'wheel', scrollHandler );
			if ( frameId ) {
				cancelAnimationFrame( frameId );
			}
		};
	}, [ automationRef ] );
