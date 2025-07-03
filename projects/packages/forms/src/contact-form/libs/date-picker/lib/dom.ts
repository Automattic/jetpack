/**
 * @file Helper functions for dealing with dom elements.
 */

export const Key = {
	left: 'ArrowLeft',
	up: 'ArrowUp',
	right: 'ArrowRight',
	down: 'ArrowDown',
	enter: 'Enter',
	esc: 'Escape',
	tab: 'Tab',
	space: 'Space',
};

/**
 * on attaches an event handler to the specified element, and returns an
 * off function which can be used to remove the handler.
 *
 * @param {string}      evt     the name of the event to handle
 * @param {HTMLElement} el      the element to attach to
 * @param {function}    handler the event handler
 *
 * @returns {function} the off function
 */
export function on( evt: string, el: HTMLElement, handler: EventListenerOrEventListenerObject ) {
	el.addEventListener( evt, handler, true );

	return (): void => {
		el.removeEventListener( evt, handler, true );
	};
}
