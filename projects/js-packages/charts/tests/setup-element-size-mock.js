/**
 * Mock getBoundingClientRect and ResizeObserver so useElementSize returns
 * non-zero dimensions in JSDOM. Without this, ChartLayout's render-prop
 * visibility guard (visibility: hidden until measured) keeps charts hidden
 * and tests can't find accessible elements.
 */

// Return non-zero dimensions from getBoundingClientRect
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
	const rect = originalGetBoundingClientRect.call( this );
	// Only override if all values are zero (JSDOM default)
	if ( rect.width === 0 && rect.height === 0 ) {
		return {
			...rect,
			width: 800,
			height: 400,
			top: 0,
			left: 0,
			bottom: 400,
			right: 800,
			x: 0,
			y: 0,
		};
	}
	return rect;
};

// Mock ResizeObserver to immediately call the callback
if ( typeof window !== 'undefined' && ! window.ResizeObserver ) {
	window.ResizeObserver = class ResizeObserver {
		constructor( callback ) {
			this._callback = callback;
		}
		observe() {
			// Fire immediately so useElementSize gets dimensions on mount
			this._callback();
		}
		unobserve() {}
		disconnect() {}
	};
}
