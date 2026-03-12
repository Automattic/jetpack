/**
 * Mock getBoundingClientRect and ResizeObserver so useElementSize returns
 * non-zero dimensions in JSDOM. Without this, ChartLayout's render-prop
 * visibility guard (visibility: hidden until measured) keeps charts hidden
 * and tests can't find accessible elements.
 */

// Guard for SSR test environment (jest-environment node) where Element is not defined
if ( typeof Element !== 'undefined' ) {
	// Return non-zero dimensions from getBoundingClientRect.
	// When an element has zero dimensions (JSDOM default), walk up the DOM tree
	// to find an ancestor with inline style dimensions. This ensures charts with
	// explicit sizes (e.g. Sparkline at 100x40) get realistic measurements rather
	// than the hardcoded fallback.
	const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
	Element.prototype.getBoundingClientRect = function () {
		const rect = originalGetBoundingClientRect.call( this );
		// Only override if all values are zero (JSDOM default)
		if ( rect.width === 0 && rect.height === 0 ) {
			let width = 0;
			let height = 0;
			let el = this;

			// Walk up the DOM tree looking for ancestors with inline style dimensions
			while ( el ) {
				if ( el.style ) {
					if ( ! width && el.style.width ) {
						width = parseFloat( el.style.width );
					}
					if ( ! height && el.style.height ) {
						height = parseFloat( el.style.height );
					}
				}
				if ( width && height ) {
					break;
				}
				el = el.parentElement;
			}

			// Fall back to sensible defaults for elements without ancestor dimensions
			width = width || 800;
			height = height || 400;

			return {
				...rect,
				width,
				height,
				top: 0,
				left: 0,
				bottom: height,
				right: width,
				x: 0,
				y: 0,
			};
		}
		return rect;
	};
}

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
